const twilio = require('twilio');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AIService = require('./aiService');
const RoutingService = require('./routingService');
const DuplicateService = require('./duplicateService');
const PriorityScoring = require('../utils/priorityScoring');
const GeoUtils = require('../utils/geoUtils');
const axios = require('axios');

// ═══════════════════════════════════════
//  TWILIO WHATSAPP CLIENT
// ═══════════════════════════════════════
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const WHATSAPP_FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER}`;

class WhatsAppService {

  // ══════════════════════════════════════
  //  MAIN MESSAGE HANDLER
  // ══════════════════════════════════════
  static async handleIncoming(message) {
    const from = message.From;               // whatsapp:+91XXXXXXXXXX
    const body = (message.Body || '').trim();
    const numMedia = parseInt(message.NumMedia || '0');
    const mediaUrl = message.MediaUrl0 || null;
    let phone = from.replace('whatsapp:', '').trim();
    if (!phone.startsWith('+')) {
      phone = '+' + phone.replace(/^\s+/, ''); // Fix dropped + from URL decoded bodies
    }

    console.log(`\n📱 WhatsApp from ${phone}: "${body}" [${numMedia} media]`);

    try {
      // ── Determine user intent ──
      const intent = this._parseIntent(body);

      switch (intent.action) {
        case 'ping':
          console.log('   🏓 Ping-pong');
          return await this._sendMessage(phone, `🏓 *Pong!*\n\nCitySync Bot is alive and well.\n\n⏰ Time: ${new Date().toLocaleString('en-IN')}\n🤖 Model: google/gemini-2.0-flash-001`);

        case 'track':
          return await this._handleTrack(phone, intent.ticketId);

        case 'report':
          return await this._handleReport(phone, intent.text, mediaUrl);

        case 'my_complaints':
          return await this._handleMyComplaints(phone);

        case 'help':
        default:
          return await this._sendHelp(phone);
      }
    } catch (error) {
      console.error('WhatsApp handler error:', error.message);
      return await this._sendMessage(phone,
        `⚠️ Something went wrong. Please try again.\n\nSend *help* for available commands.`
      );
    }
  }

  // ══════════════════════════════════════
  //  INTENT PARSER
  // ══════════════════════════════════════
  static _parseIntent(body) {
    const lower = body.toLowerCase();

    // Track complaint: "track CS-2026-000001" or "status CS-2026-000001"
    const trackMatch = body.match(/(?:track|status|check)\s+(CS-\d{4}-\d+)/i);
    if (trackMatch) {
      return { action: 'track', ticketId: trackMatch[1].toUpperCase() };
    }

    // My complaints
    if (lower === 'my complaints' || lower === 'my issues' || lower === 'list') {
      return { action: 'my_complaints' };
    }

    // Help
    if (lower === 'help' || lower === 'hi' || lower === 'hello' || lower === 'menu' || lower === 'start') {
      return { action: 'help' };
    }

    // Ping
    if (lower === 'ping' || lower === 'test') {
      return { action: 'ping' };
    }

    // Everything else → treat as a complaint report
    // Remove "report:" or "complaint:" prefix if present
    let text = body.replace(/^(report|complaint|issue)\s*[:\-]\s*/i, '');
    return { action: 'report', text };
  }

  // ══════════════════════════════════════
  //  HANDLE: REPORT A COMPLAINT
  // ══════════════════════════════════════
  static async _handleReport(phone, text, mediaUrl) {
    // Step 0: Ensure user exists (auto-register via WhatsApp number)
    let user = await User.findOne({ mobile: phone });
    if (!user) {
      user = await User.create({
        mobile: phone,
        name: `WhatsApp User`,
        role: 'citizen',
        isVerified: true
      });
      console.log(`✅ Auto-registered WhatsApp user: ${phone}`);
    }

    // Step 1: Download image if attached
    let imageBase64 = null;
    if (mediaUrl) {
      try {
        const response = await axios.get(mediaUrl, {
          responseType: 'arraybuffer',
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
          },
          timeout: 15000
        });
        imageBase64 = `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
        console.log('📸 Downloaded WhatsApp image for AI analysis');
      } catch (err) {
        console.error('Failed to download WhatsApp media:', err.message);
      }
    }

    // Minimum text check
    if (!text && !imageBase64) {
      return await this._sendMessage(phone,
        `📝 Please describe the civic issue or send a photo.\n\nExample:\n_"There is garbage overflowing near MG Road junction"_\n\nOr just send a photo of the issue!`
      );
    }

    // Step 2: AI Classification (with fallback)
    let aiResult;
    try {
      aiResult = await AIService.classifyComplaint(text || 'See attached image', imageBase64);
    } catch (aiErr) {
      console.error('AI classification failed, using fallback:', aiErr.message);
      aiResult = AIService._fallback(text || '');
    }

    if (aiResult.needsMoreInfo) {
      return await this._sendMessage(phone,
        `🤔 I couldn't identify the issue clearly.\n\nPlease try:\n• Be more specific (e.g. _"broken water pipe leaking on road"_)\n• Send a clearer photo of the problem\n• Mention what you see: garbage, pothole, broken light, etc.`
      );
    }

    // Step 3: Generate embedding (non-critical — skip on failure)
    let embedding = [];
    try {
      embedding = await AIService.generateEmbedding(text || 'Image-based complaint');
    } catch (embErr) {
      console.warn('Embedding skipped:', embErr.message);
    }

    // Step 4: Priority
    const priority = PriorityScoring.calculate({
      category: aiResult.category,
      description: text || 'Image-based complaint',
      nearbyCount: 0,
      aiSeverity: aiResult.severity || 'medium'
    });

    // Step 5: Create complaint (use default coordinates — Nagpur city center)
    const defaultCoords = [79.0882, 21.1458]; // Nagpur center
    const complaintData = {
      citizen: user._id,
      title: aiResult.suggestedTitle || `${aiResult.issue_type || aiResult.category} reported`,
      description: text || 'Reported via WhatsApp with photo',
      category: aiResult.category,
      images: imageBase64 ? [imageBase64] : [],
      location: {
        type: 'Point',
        coordinates: defaultCoords,
        address: 'Location shared via WhatsApp',
        ward: '',
        zone: RoutingService.determineZone(defaultCoords)
      },
      priority,
      aiMetadata: {
        classificationConfidence: aiResult.confidence,
        suggestedCategory: aiResult.category,
        keywords: aiResult.keywords || [],
        embedding
      },
      timeline: [{
        status: 'submitted',
        timestamp: new Date(),
        note: `Complaint submitted via WhatsApp. AI classified as ${aiResult.issue_type || aiResult.category} (${Math.round(aiResult.confidence * 100)}% confidence)`
      }]
    };

    const complaint = await Complaint.create(complaintData);

    // Step 6: Check duplicates (non-critical — skip on failure)
    try {
      const duplicateResult = await DuplicateService.findDuplicate(complaint);
      if (duplicateResult) {
        complaint.duplicateOf = duplicateResult.duplicate._id;
        complaint.status = 'closed';
        complaint.timeline.push({
          status: 'closed',
          timestamp: new Date(),
          note: `Merged with existing complaint ${duplicateResult.duplicate.ticketId}`
        });
        await complaint.save();
        await DuplicateService.mergeDuplicate(duplicateResult.duplicate._id, complaint);

        return await this._sendMessage(phone,
          `✅ *Complaint Registered!*\n\n🎫 Ticket: *${complaint.ticketId}*\n\n🔄 Your report has been merged with an existing complaint *${duplicateResult.duplicate.ticketId}* — now reported by ${duplicateResult.duplicate.duplicateCount + 1} citizens!\n\nTrack status: send _track ${duplicateResult.duplicate.ticketId}_`
        );
      }
    } catch (dupErr) {
      console.warn('Duplicate check skipped:', dupErr.message);
    }

    // Step 7: Route to department (non-critical)
    try {
      const routing = await RoutingService.routeComplaint(complaint);
      if (routing.department) {
        complaint.department = routing.department;
        complaint.location.zone = routing.zone;
        complaint.estimatedResolution = routing.estimatedResolution;
        complaint.timeline.push({
          status: 'submitted',
          timestamp: new Date(),
          note: `Routed to ${routing.departmentName || 'department'}`
        });
        await complaint.save();
      }
    } catch (routeErr) {
      console.warn('Routing skipped:', routeErr.message);
    }

    // Step 8: Reply with confirmation
    const issueType = aiResult.issue_type || aiResult.category || 'Civic Issue';
    const keywords = (aiResult.keywords || []).join(', ');
    return await this._sendMessage(phone,
      `✅ *Complaint Registered Successfully!*\n\n🎫 Ticket: *${complaint.ticketId}*\n📋 Issue: ${issueType}\n🏢 Dept: ${aiResult.department || 'Routing...'}\n🔑 Keywords: ${keywords}\n📊 Priority: ${priority.level.toUpperCase()}\n🤖 AI Confidence: ${Math.round(aiResult.confidence * 100)}%\n\n📍 _Send your location in the next message to pin the exact spot._\n\n🔍 To track status anytime, send:\n_track ${complaint.ticketId}_`
    );
  }

  // ══════════════════════════════════════
  //  HANDLE: TRACK COMPLAINT STATUS
  // ══════════════════════════════════════
  static async _handleTrack(phone, ticketId) {
    const complaint = await Complaint.findOne({ ticketId })
      .populate('department', 'name icon')
      .lean();

    if (!complaint) {
      return await this._sendMessage(phone,
        `❌ No complaint found with ticket *${ticketId}*.\n\nPlease check the ticket ID and try again.\nFormat: _track CS-2026-000001_`
      );
    }

    const statusEmoji = {
      submitted: '📩', under_review: '🔍', in_progress: '🔧',
      resolved: '✅', closed: '📁', escalated: '🚨', fake: '❌'
    };

    const emoji = statusEmoji[complaint.status] || '📋';
    const dept = complaint.department?.name || 'Not assigned';
    const date = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    // Last timeline entry
    const lastUpdate = complaint.timeline?.length > 0
      ? complaint.timeline[complaint.timeline.length - 1]
      : null;
    const lastNote = lastUpdate
      ? `\n📝 _${lastUpdate.note}_\n⏰ ${new Date(lastUpdate.timestamp).toLocaleString('en-IN')}`
      : '';

    return await this._sendMessage(phone,
      `${emoji} *Complaint Status*\n\n🎫 Ticket: *${ticketId}*\n📋 Issue: ${complaint.title}\n🏢 Dept: ${dept}\n📊 Priority: ${complaint.priority?.level?.toUpperCase() || 'MEDIUM'}\n📅 Filed: ${date}\n\n🔄 Status: *${complaint.status.replace('_', ' ').toUpperCase()}*${lastNote}\n\n${complaint.status === 'resolved' ? '🎉 This issue has been resolved!' : '⏳ We are working on it.'}`
    );
  }

  // ══════════════════════════════════════
  //  HANDLE: MY COMPLAINTS
  // ══════════════════════════════════════
  static async _handleMyComplaints(phone) {
    const user = await User.findOne({ mobile: phone });
    if (!user) {
      return await this._sendMessage(phone,
        `👤 No account found for this number.\n\nSend a complaint first, and we'll automatically register you!`
      );
    }

    const complaints = await Complaint.find({ citizen: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('ticketId title status priority createdAt')
      .lean();

    if (complaints.length === 0) {
      return await this._sendMessage(phone,
        `📋 You have no complaints yet.\n\nTo report an issue, just describe it here!\nExample: _"Garbage overflowing near Central Market"_`
      );
    }

    const statusEmoji = {
      submitted: '📩', under_review: '🔍', in_progress: '🔧',
      resolved: '✅', closed: '📁', escalated: '🚨', fake: '❌'
    };

    let list = `📋 *Your Recent Complaints*\n\n`;
    complaints.forEach((c, i) => {
      const emoji = statusEmoji[c.status] || '📋';
      list += `${i + 1}. ${emoji} *${c.ticketId}*\n   ${c.title}\n   Status: _${c.status.replace('_', ' ')}_\n\n`;
    });

    list += `🔍 Track any ticket: _track CS-XXXX-XXXXXX_`;
    return await this._sendMessage(phone, list);
  }

  // ══════════════════════════════════════
  //  SEND HELP / WELCOME MESSAGE
  // ══════════════════════════════════════
  static async _sendHelp(phone) {
    return await this._sendMessage(phone,
      `🏙️ *Welcome to CitySync!* 🤖\n\nI'm your AI-powered civic assistant. Here's what I can do:\n\n📝 *Report an Issue*\nJust describe it or send a photo!\n_"Broken streetlight on MG Road"_\n_"Garbage piling up near school"_\n\n🔍 *Track Complaint*\n_track CS-2026-000001_\n\n📋 *My Complaints*\n_my complaints_\n\n💡 *Tips:*\n• Send a photo 📸 for faster & more accurate AI classification\n• Be specific about the problem & location\n• AI routes your complaint to the right department automatically\n\n_Powered by CitySync AI — 30 Municipal Departments_`
    );
  }

  // ══════════════════════════════════════
  //  SEND WHATSAPP MESSAGE (via Twilio)
  // ══════════════════════════════════════
  static async _sendMessage(to, body) {
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    if (!twilioClient) {
      console.log(`\n💬 WhatsApp Reply (SIMULATED) to ${to}:\n${body}\n`);
      return { success: true, simulated: true };
    }

    try {
      console.log(`   📤 Sending WhatsApp to ${to}...`);
      const msg = await twilioClient.messages.create({
        from: WHATSAPP_FROM,
        to: toFormatted,
        body
      });
      console.log(`   ✅ Sent! (SID: ${msg.sid}, Status: ${msg.status})`);
      return { success: true, sid: msg.sid };
    } catch (error) {
      console.error(`   ❌ Send failed: ${error.message}`);
      // Fallback: log to console
      console.log(`\n💬 WhatsApp Reply (FALLBACK) to ${to}:\n${body}\n`);
      return { success: false, error: error.message };
    }
  }

  // ══════════════════════════════════════
  //  SEND STATUS NOTIFICATION (proactive)
  // ══════════════════════════════════════
  static async notifyStatusChange(complaint, newStatus) {
    try {
      const user = await User.findById(complaint.citizen);
      if (!user?.mobile) return;

      const statusEmoji = {
        under_review: '🔍', in_progress: '🔧',
        resolved: '✅', escalated: '🚨', closed: '📁'
      };

      const emoji = statusEmoji[newStatus] || '📋';
      const dept = complaint.department?.name || '';

      await this._sendMessage(user.mobile,
        `${emoji} *Complaint Update*\n\n🎫 Ticket: *${complaint.ticketId}*\n📋 ${complaint.title}\n\n🔄 New Status: *${newStatus.replace('_', ' ').toUpperCase()}*${dept ? `\n🏢 Dept: ${dept}` : ''}\n\n${newStatus === 'resolved' ? '🎉 Your issue has been resolved! Thank you for making our city better.' : '⏳ Our team is actively working on this.'}\n\n🔍 _track ${complaint.ticketId}_`
      );
    } catch (error) {
      console.error('WhatsApp notification error:', error.message);
    }
  }
}

module.exports = WhatsAppService;
