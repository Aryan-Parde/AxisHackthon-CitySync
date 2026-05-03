const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Department = require('./models/Department');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

// Real image URLs (Unsplash — free to use)
const images = {
  pothole: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
    'https://images.unsplash.com/photo-1594818898109-44704b4e8775?w=800&q=80',
  ],
  garbage: [
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80',
  ],
  streetlight: [
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80',
  ],
  water: [
    'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=80',
  ],
  sewage: [
    'https://images.unsplash.com/photo-1580894908361-967195033215?w=800&q=80',
  ],
  road: [
    'https://images.unsplash.com/photo-1566803832277-7c7612ebe125?w=800&q=80',
  ],
  traffic: [
    'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80',
  ],
  construction: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  ],
  resolved: [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  ],
};

const complaints = [
  // --- CRITICAL ---
  {
    title: 'Massive pothole causing accidents on JM Road',
    description: 'A dangerously deep pothole has formed near the JM Road-FC Road junction. Two-wheelers are skidding daily. An auto-rickshaw got stuck yesterday evening. Urgent repair needed before monsoon makes it worse.',
    category: 'pothole',
    location: { type: 'Point', coordinates: [73.8417, 18.5196], address: 'JM Road near FC Road Junction, Pune', zone: 'Central' },
    priority: { level: 'critical', score: 91, factors: { category: 22, keywords: 20, frequency: 15, time: 10, aiSeverity: 10 } },
    status: 'in_progress',
    images: [images.pothole[0]],
    duplicateCount: 14, upvotes: 38,
    aiMetadata: { classificationConfidence: 96, suggestedCategory: 'pothole', keywords: ['pothole', 'accident', 'dangerous', 'skidding'] },
  },
  {
    title: 'Water main burst flooding Karve Nagar streets',
    description: 'Major water pipeline burst at Karve Nagar Chowk. Water is gushing onto the road and has been flowing for 5+ hours. Entire street is waterlogged, shops are affected. Multiple calls to helpline unanswered.',
    category: 'water_supply',
    location: { type: 'Point', coordinates: [73.8175, 18.4973], address: 'Karve Nagar Chowk, Pune', zone: 'West' },
    priority: { level: 'critical', score: 95, factors: { category: 25, keywords: 24, frequency: 10, time: 12, aiSeverity: 10 } },
    status: 'escalated',
    escalationLevel: 2,
    images: [images.water[0]],
    duplicateCount: 18, upvotes: 52,
    aiMetadata: { classificationConfidence: 98, suggestedCategory: 'water_supply', keywords: ['burst', 'flooding', 'waterlogged', 'emergency'] },
  },
  {
    title: 'Sewage overflowing into Sahakarnagar residential lanes',
    description: 'Manhole in Lane 5, Sahakarnagar has been overflowing since 3 days. Raw sewage is entering homes. Children are falling sick. The stench is unbearable. Health emergency!',
    category: 'sewage',
    location: { type: 'Point', coordinates: [73.8545, 18.4895], address: 'Lane 5, Sahakarnagar, Pune', zone: 'South' },
    priority: { level: 'critical', score: 88, factors: { category: 25, keywords: 18, frequency: 12, time: 8, aiSeverity: 10 } },
    status: 'in_progress',
    images: [images.sewage[0]],
    duplicateCount: 9, upvotes: 34,
    aiMetadata: { classificationConfidence: 94, suggestedCategory: 'sewage', keywords: ['overflow', 'manhole', 'health hazard', 'sewage'] },
  },

  // --- HIGH ---
  {
    title: 'Garbage piled up near Deccan Gymkhana park entrance',
    description: 'Massive garbage dump right at the entrance of the public park near Deccan Gymkhana. No collection for the past week. Rats and stray dogs are scavenging. Residents are unable to use the park.',
    category: 'garbage',
    location: { type: 'Point', coordinates: [73.8401, 18.5147], address: 'Deccan Gymkhana Park, Pune', zone: 'Central' },
    priority: { level: 'high', score: 68, factors: { category: 15, keywords: 12, frequency: 18, time: 5, aiSeverity: 8 } },
    status: 'submitted',
    images: [images.garbage[0]],
    duplicateCount: 7, upvotes: 22,
    aiMetadata: { classificationConfidence: 92, suggestedCategory: 'garbage', keywords: ['garbage', 'dump', 'rats', 'no collection'] },
  },
  {
    title: 'Broken footpath tiles near Swargate bus stand',
    description: 'The footpath along Swargate bus stand has broken tiles with exposed rebar. An elderly woman tripped and fractured her wrist yesterday. High pedestrian area needs immediate attention.',
    category: 'road_damage',
    location: { type: 'Point', coordinates: [73.8567, 18.5018], address: 'Swargate Bus Stand, Pune', zone: 'South' },
    priority: { level: 'high', score: 64, factors: { category: 18, keywords: 16, frequency: 8, time: 5, aiSeverity: 8 } },
    status: 'under_review',
    images: [images.road[0]],
    duplicateCount: 4, upvotes: 16,
    aiMetadata: { classificationConfidence: 89, suggestedCategory: 'road_damage', keywords: ['broken', 'footpath', 'injury', 'pedestrian'] },
  },
  {
    title: 'Traffic signal malfunction at Hinjewadi Phase 1 entry',
    description: 'The traffic signal at Hinjewadi Phase 1 entry point has been blinking yellow for 3 days. Peak hour traffic is chaotic with near-miss accidents happening every day. Traffic police are not available.',
    category: 'traffic',
    location: { type: 'Point', coordinates: [73.7379, 18.5912], address: 'Hinjewadi Phase 1 Entry, Pune', zone: 'West' },
    priority: { level: 'high', score: 60, factors: { category: 12, keywords: 12, frequency: 14, time: 8, aiSeverity: 7 } },
    status: 'in_progress',
    images: [images.traffic[0]],
    duplicateCount: 6, upvotes: 28,
    aiMetadata: { classificationConfidence: 90, suggestedCategory: 'traffic', keywords: ['signal', 'malfunction', 'accidents', 'traffic jam'] },
  },

  // --- MEDIUM ---
  {
    title: 'Multiple street lights out on Baner Road stretch',
    description: '6 consecutive street lights are not working on the stretch between Baner-Balewadi road junction and Supreme Business Park. The 500m stretch is completely dark after 7 PM.',
    category: 'streetlight',
    location: { type: 'Point', coordinates: [73.7860, 18.5590], address: 'Baner Road, near Supreme Business Park, Pune', zone: 'West' },
    priority: { level: 'medium', score: 45, factors: { category: 15, keywords: 8, frequency: 5, time: 8, aiSeverity: 5 } },
    status: 'submitted',
    images: [images.streetlight[0]],
    duplicateCount: 3, upvotes: 11,
    aiMetadata: { classificationConfidence: 93, suggestedCategory: 'streetlight', keywords: ['dark', 'street lights', 'not working', 'unsafe'] },
  },
  {
    title: 'Illegal construction blocking pavement in Kothrud',
    description: 'A shop owner on Paud Road, Kothrud has extended their construction onto the public footpath. Pedestrians are forced to walk on the main road. Dangerous for school children.',
    category: 'illegal_construction',
    location: { type: 'Point', coordinates: [73.8086, 18.5074], address: 'Paud Road, Kothrud, Pune', zone: 'West' },
    priority: { level: 'medium', score: 38, factors: { category: 10, keywords: 8, frequency: 5, time: 5, aiSeverity: 4 } },
    status: 'under_review',
    images: [images.construction[0]],
    duplicateCount: 2, upvotes: 8,
    aiMetadata: { classificationConfidence: 87, suggestedCategory: 'illegal_construction', keywords: ['illegal', 'construction', 'footpath', 'encroachment'] },
  },
  {
    title: 'Overflowing garbage bins near Magarpatta City entrance',
    description: 'The community bins at Magarpatta City main entrance have been overflowing for 3 days. Waste is spilling onto the road. The collection truck has not come. Bad impression on visitors.',
    category: 'garbage',
    location: { type: 'Point', coordinates: [73.9270, 18.5148], address: 'Magarpatta City Entrance, Pune', zone: 'East' },
    priority: { level: 'medium', score: 42, factors: { category: 12, keywords: 8, frequency: 8, time: 5, aiSeverity: 5 } },
    status: 'in_progress',
    images: [images.garbage[1]],
    duplicateCount: 3, upvotes: 9,
    aiMetadata: { classificationConfidence: 91, suggestedCategory: 'garbage', keywords: ['overflow', 'garbage bins', 'not collected'] },
  },

  // --- LOW ---
  {
    title: 'Minor pothole forming near Viman Nagar Chowk',
    description: 'A small pothole is forming near Viman Nagar Chowk. Not dangerous yet but could worsen during monsoons. Reporting early for preventive repair.',
    category: 'pothole',
    location: { type: 'Point', coordinates: [73.9146, 18.5679], address: 'Viman Nagar Chowk, Pune', zone: 'East' },
    priority: { level: 'low', score: 22, factors: { category: 8, keywords: 4, frequency: 0, time: 5, aiSeverity: 2 } },
    status: 'submitted',
    images: [images.pothole[1]],
    duplicateCount: 1, upvotes: 3,
    aiMetadata: { classificationConfidence: 85, suggestedCategory: 'pothole', keywords: ['pothole', 'small', 'preventive'] },
  },

  // --- RESOLVED (with resolution data) ---
  {
    title: 'Burst pipe causing water loss in Aundh IT Park area',
    description: 'Underground water pipe burst near Aundh IT Park. Water was being wasted continuously. Reported by multiple residents.',
    category: 'water_supply',
    location: { type: 'Point', coordinates: [73.8070, 18.5580], address: 'Aundh IT Park Road, Pune', zone: 'North' },
    priority: { level: 'high', score: 72, factors: { category: 22, keywords: 16, frequency: 10, time: 8, aiSeverity: 8 } },
    status: 'resolved',
    images: [images.water[0]],
    duplicateCount: 5, upvotes: 19,
    aiMetadata: { classificationConfidence: 95, suggestedCategory: 'water_supply', keywords: ['pipe burst', 'water loss', 'flooding'] },
    resolution: {
      photo: images.resolved[0],
      actionTaken: 'Deployed emergency repair crew within 4 hours. Replaced damaged 12-inch PVC pipe section (approx. 8 meters). Restored water supply to 200+ households. Conducted pressure test to verify repair integrity.',
      aiVerification: { verified: true, score: 88, analysis: 'Resolution photo shows new pipe installed and road restored. Water supply confirmed operational.' },
    },
  },
  {
    title: 'Dangerous pothole fixed on Senapati Bapat Road',
    description: 'Large pothole near Senapati Bapat Road, ICC Trade Tower was causing daily vehicle damage. Heavy traffic area.',
    category: 'pothole',
    location: { type: 'Point', coordinates: [73.8290, 18.5310], address: 'Senapati Bapat Road, near ICC, Pune', zone: 'Central' },
    priority: { level: 'critical', score: 82, factors: { category: 20, keywords: 18, frequency: 14, time: 10, aiSeverity: 9 } },
    status: 'resolved',
    images: [images.pothole[0]],
    duplicateCount: 11, upvotes: 41,
    aiMetadata: { classificationConfidence: 97, suggestedCategory: 'pothole', keywords: ['pothole', 'vehicle damage', 'dangerous'] },
    resolution: {
      photo: images.resolved[1],
      actionTaken: 'Road repair team patched the pothole using hot-mix asphalt. Applied a 3-layer fix for durability. Entire 20-meter stretch resurfaced. Completed within 48 hours of escalation.',
      aiVerification: { verified: true, score: 92, analysis: 'Before/after comparison confirms road surface restored to good condition. Smooth finish verified.' },
    },
  },
  {
    title: 'Garbage cleared from Koregaon Park Lane 7',
    description: 'Persistent garbage dumping issue at the corner of Koregaon Park Lane 7. Was attracting pests and creating hygiene issues for nearby food outlets.',
    category: 'garbage',
    location: { type: 'Point', coordinates: [73.8920, 18.5362], address: 'Lane 7, Koregaon Park, Pune', zone: 'East' },
    priority: { level: 'high', score: 55, factors: { category: 12, keywords: 10, frequency: 12, time: 5, aiSeverity: 7 } },
    status: 'resolved',
    images: [images.garbage[0]],
    duplicateCount: 4, upvotes: 14,
    aiMetadata: { classificationConfidence: 93, suggestedCategory: 'garbage', keywords: ['garbage', 'dumping', 'pests', 'hygiene'] },
    resolution: {
      photo: images.resolved[0],
      actionTaken: 'Deployed sanitation team for deep cleaning. Installed 2 new covered dustbins. Added spot to daily collection route. Issued warning notice to nearby establishments against illegal dumping.',
      aiVerification: { verified: true, score: 85, analysis: 'Area confirmed clean with new waste collection infrastructure installed.' },
    },
  },
  {
    title: 'Street lights restored on Model Colony Road',
    description: 'A row of 8 street lights on Model Colony main road were out for over a month. The dark stretch was unsafe for evening joggers and pedestrians.',
    category: 'streetlight',
    location: { type: 'Point', coordinates: [73.8365, 18.5115], address: 'Model Colony Road, Pune', zone: 'Central' },
    priority: { level: 'medium', score: 48, factors: { category: 15, keywords: 10, frequency: 5, time: 8, aiSeverity: 5 } },
    status: 'resolved',
    images: [images.streetlight[0]],
    duplicateCount: 3, upvotes: 10,
    aiMetadata: { classificationConfidence: 94, suggestedCategory: 'streetlight', keywords: ['street lights', 'dark', 'unsafe', 'not working'] },
    resolution: {
      photo: images.resolved[1],
      actionTaken: 'Replaced burnt-out sodium vapour lamps with energy-efficient LED fixtures. Repaired faulty wiring in junction box. All 8 lights now operational and tested.',
      aiVerification: { verified: true, score: 90, analysis: 'Resolution photo confirms illuminated street. LED upgrade verified — improved brightness noted.' },
    },
  },
  {
    title: 'Drainage blockage cleared in Shivajinagar market area',
    description: 'Drainage system blocked near Shivajinagar market causing water stagnation and mosquito breeding. Vendors complained about loss of business.',
    category: 'drainage',
    location: { type: 'Point', coordinates: [73.8553, 18.5314], address: 'Shivajinagar Market, Pune', zone: 'Central' },
    priority: { level: 'high', score: 62, factors: { category: 18, keywords: 14, frequency: 10, time: 8, aiSeverity: 7 } },
    status: 'resolved',
    images: [images.sewage[0]],
    duplicateCount: 6, upvotes: 17,
    aiMetadata: { classificationConfidence: 91, suggestedCategory: 'drainage', keywords: ['drainage', 'blockage', 'stagnation', 'mosquito'] },
    resolution: {
      photo: images.resolved[0],
      actionTaken: 'Cleared 150 meters of blocked storm drain. Removed debris and solid waste causing obstruction. Installed new drain covers to prevent future blockages. Applied anti-larval treatment.',
      aiVerification: { verified: true, score: 87, analysis: 'Drainage system confirmed functional. Water flow restored, no stagnation observed.' },
    },
  },
];

async function seedComplaints() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get departments
    const depts = await Department.find();
    if (depts.length === 0) {
      console.error('❌ No departments found. Run "npm run seed" first.');
      process.exit(1);
    }
    const deptMap = {};
    depts.forEach(d => d.categories.forEach(cat => { deptMap[cat] = d._id; }));

    // Get or create citizen
    let citizen = await User.findOne({ role: 'citizen' });
    if (!citizen) {
      citizen = await User.create({ mobile: '+919876500000', name: 'Demo Citizen', role: 'citizen', isVerified: true });
    }

    // Get authority users for resolved complaints
    const authorities = await User.find({ role: 'authority' });

    // Remove existing complaints
    const deleted = await Complaint.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing complaints`);

    // Create complaints
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    const docs = complaints.map((c, i) => {
      const createdAt = new Date(now - (15 - i) * DAY - Math.random() * DAY * 0.5);
      const timeline = [
        { status: 'submitted', timestamp: createdAt, note: 'Complaint submitted by citizen via CitySync app' },
      ];

      if (c.status !== 'submitted') {
        timeline.push({
          status: 'under_review',
          timestamp: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
          note: 'AI classification complete. Routed to department.',
        });
      }
      if (['in_progress', 'resolved', 'escalated'].includes(c.status)) {
        timeline.push({
          status: 'in_progress',
          timestamp: new Date(createdAt.getTime() + 8 * 60 * 60 * 1000),
          note: 'Field team dispatched to location.',
        });
      }
      if (c.status === 'escalated') {
        timeline.push({
          status: 'escalated',
          timestamp: new Date(createdAt.getTime() + 48 * 60 * 60 * 1000),
          note: `Auto-escalated to Level ${c.escalationLevel || 1} due to no resolution.`,
        });
      }
      if (c.status === 'resolved') {
        const resolvedAt = new Date(createdAt.getTime() + 3 * DAY + Math.random() * DAY);
        timeline.push({
          status: 'resolved',
          timestamp: resolvedAt,
          note: 'Issue resolved and verified.',
        });

        if (c.resolution) {
          c.resolution.resolvedAt = resolvedAt;
          c.resolution.resolvedBy = authorities.length > 0 ? authorities[i % authorities.length]._id : citizen._id;
        }
        c.resolvedAt = resolvedAt;
      }

      return {
        ...c,
        ticketId: `CS-2026-${String(1001 + i).padStart(6, '0')}`,
        citizen: citizen._id,
        department: deptMap[c.category] || depts[depts.length - 1]._id,
        assignedTo: authorities.length > 0 ? authorities[i % authorities.length]._id : undefined,
        timeline,
        createdAt,
        estimatedResolution: new Date(createdAt.getTime() + 5 * DAY),
      };
    });

    await Complaint.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} realistic complaints with images & geotags`);

    // Update department stats
    for (const dept of depts) {
      const total = await Complaint.countDocuments({ department: dept._id });
      const resolved = await Complaint.countDocuments({ department: dept._id, status: 'resolved' });
      await Department.findByIdAndUpdate(dept._id, {
        totalComplaints: total,
        resolvedComplaints: resolved,
        performanceScore: total > 0 ? Math.round((resolved / total) * 100) : 0,
      });
    }

    // Summary
    const statusCounts = {};
    for (const c of complaints) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    }
    console.log('\n📊 Complaint breakdown:');
    Object.entries(statusCounts).forEach(([s, n]) => console.log(`   ${s}: ${n}`));
    console.log('\n🎉 Done! Refresh your dashboard to see the complaints.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedComplaints();
