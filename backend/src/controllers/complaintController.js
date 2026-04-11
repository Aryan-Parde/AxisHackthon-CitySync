const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AIService = require('../services/aiService');
const RoutingService = require('../services/routingService');
const DuplicateService = require('../services/duplicateService');
const PriorityScoring = require('../utils/priorityScoring');
const GeoUtils = require('../utils/geoUtils');
const NotificationService = require('../services/notificationService');

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res, next) => {
  try {
    const { description, title, images, location } = req.body;

    if (!description || !location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Description and location coordinates are required'
      });
    }

    // Step 1: AI Classification
    const aiResult = await AIService.classifyComplaint(description);

    // Step 2: Generate embedding for duplicate detection
    const embedding = await AIService.generateEmbedding(description);

    // Step 3: Reverse geocode location
    const [lng, lat] = location.coordinates;
    const geoData = await GeoUtils.reverseGeocode(lng, lat);

    // Step 4: Calculate priority
    const priority = PriorityScoring.calculate({
      category: aiResult.category,
      description,
      nearbyCount: 0,
      aiSeverity: aiResult.severity || 'medium'
    });

    // Create complaint object
    const complaintData = {
      citizen: req.user._id,
      title: title || aiResult.suggestedTitle || `${aiResult.category} issue`,
      description,
      category: aiResult.category,
      images: images || [],
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address || geoData.address,
        ward: geoData.ward,
        zone: geoData.zone || RoutingService.determineZone(location.coordinates)
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
        note: `Complaint submitted. AI classified as ${aiResult.category} (${Math.round(aiResult.confidence * 100)}% confidence)`
      }]
    };

    const complaint = await Complaint.create(complaintData);

    // Step 5: Check for duplicates
    const duplicateResult = await DuplicateService.findDuplicate(complaint);

    if (duplicateResult) {
      // Mark as duplicate
      complaint.duplicateOf = duplicateResult.duplicate._id;
      complaint.status = 'closed';
      complaint.timeline.push({
        status: 'closed',
        timestamp: new Date(),
        note: `Merged with existing complaint ${duplicateResult.duplicate.ticketId} (${Math.round(duplicateResult.similarity * 100)}% similarity)`
      });
      await complaint.save();

      // Update original
      await DuplicateService.mergeDuplicate(duplicateResult.duplicate._id, complaint);

      return res.status(201).json({
        success: true,
        message: `Your complaint has been merged with an existing report (${duplicateResult.duplicate.ticketId}). It is now reported by ${duplicateResult.duplicate.duplicateCount + 1} users.`,
        data: complaint,
        isDuplicate: true,
        originalTicketId: duplicateResult.duplicate.ticketId
      });
    }

    // Step 6: Route to department
    const routing = await RoutingService.routeComplaint(complaint);

    if (routing.department) {
      complaint.department = routing.department;
      complaint.location.zone = routing.zone;
      complaint.estimatedResolution = routing.estimatedResolution;
      complaint.timeline.push({
        status: 'submitted',
        timestamp: new Date(),
        note: `Routed to ${routing.departmentName} (${routing.zone} zone). Estimated resolution: ${Math.round(routing.estimatedHours)}h`
      });
      await complaint.save();
    }

    // Step 7: Update user complaint count
    await User.findByIdAndUpdate(req.user._id, { $inc: { complaintsCount: 1 } });

    // Step 8: Send notification
    await NotificationService.notifyStatusUpdate(complaint, req.user);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's complaints
// @route   GET /api/complaints
// @access  Private
exports.getMyComplaints = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const query = { citizen: req.user._id };
    if (status) query.status = status;
    if (category) query.category = category;

    const complaints = await Complaint.find(query)
      .populate('department', 'name code icon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('department', 'name code icon contacts escalationChain')
      .populate('citizen', 'name mobile')
      .populate('duplicateOf', 'ticketId status');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby complaints
// @route   GET /api/complaints/nearby
// @access  Private
exports.getNearbyComplaints = async (req, res, next) => {
  try {
    const { lng, lat, radius = 1000, category } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'Coordinates required' });
    }

    const query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      },
      status: { $nin: ['closed'] }
    };

    if (category) query.category = category;

    const complaints = await Complaint.find(query)
      .populate('department', 'name code icon')
      .limit(50);

    res.status(200).json({
      success: true,
      data: complaints,
      count: complaints.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (admin/authority)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id
    });

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Notify citizen
    const citizen = await User.findById(complaint.citizen);
    if (citizen) {
      await NotificationService.notifyStatusUpdate(complaint, citizen);
    }

    res.status(200).json({
      success: true,
      message: 'Status updated',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upvote a complaint
// @route   POST /api/complaints/:id/upvote
// @access  Private
exports.upvoteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const userId = req.user._id;
    const alreadyUpvoted = complaint.upvotedBy.some(id => id.toString() === userId.toString());

    if (alreadyUpvoted) {
      complaint.upvotedBy = complaint.upvotedBy.filter(id => id.toString() !== userId.toString());
      complaint.upvotes = Math.max(0, complaint.upvotes - 1);
    } else {
      complaint.upvotedBy.push(userId);
      complaint.upvotes += 1;
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      data: { upvotes: complaint.upvotes, upvoted: !alreadyUpvoted }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve complaint with photo + action report
// @route   PUT /api/complaints/:id/resolve
// @access  Private (authority/admin)
exports.resolveComplaint = async (req, res, next) => {
  try {
    const { resolutionPhoto, actionTaken } = req.body;

    if (!actionTaken) {
      return res.status(400).json({
        success: false,
        message: 'Action taken report is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Run AI photo comparison if both photos are available
    let aiVerification = { verified: true, score: 70, analysis: 'No photos to compare. Accepted on officer report.' };

    if (resolutionPhoto && complaint.images && complaint.images.length > 0) {
      aiVerification = await AIService.comparePhotos(
        complaint.images[0],
        resolutionPhoto,
        complaint.description
      );
      console.log(`\n🤖 AI Verification for ${complaint.ticketId}: Score ${aiVerification.score}%\n`);
    } else if (resolutionPhoto) {
      aiVerification = { verified: true, score: 75, analysis: 'No original complaint photo. Resolution photo accepted.' };
    }

    // Update complaint
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.resolution = {
      photo: resolutionPhoto || '',
      actionTaken,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      aiVerification: {
        verified: aiVerification.verified,
        score: aiVerification.score,
        analysis: aiVerification.analysis
      }
    };

    complaint.timeline.push({
      status: 'resolved',
      timestamp: new Date(),
      note: `Resolved by ${req.user.name || 'Officer'}. AI Verification: ${aiVerification.score}% confidence. ${aiVerification.analysis}`,
      updatedBy: req.user._id
    });

    await complaint.save();

    // Notify citizen
    const citizen = await User.findById(complaint.citizen);
    if (citizen) {
      await NotificationService.notifyStatusUpdate(complaint, citizen);
    }

    res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully',
      data: complaint,
      aiVerification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reassign complaint to different department
// @route   PUT /api/complaints/:id/reassign
// @access  Private (admin/nodal officer)
exports.reassignComplaint = async (req, res, next) => {
  try {
    const { departmentId, note } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const Department = require('../models/Department');
    const newDept = await Department.findById(departmentId);
    if (!newDept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    complaint.department = departmentId;
    complaint.timeline.push({
      status: complaint.status,
      timestamp: new Date(),
      note: note || `Reassigned to ${newDept.name} by Nodal Officer`,
      updatedBy: req.user._id
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint reassigned to ${newDept.name}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

