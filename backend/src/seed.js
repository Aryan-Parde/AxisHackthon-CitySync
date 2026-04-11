const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Department = require('./models/Department');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

const departments = [
  {
    name: 'Roads & Infrastructure',
    code: 'ROADS',
    description: 'Handles all road-related issues including potholes, road damage, and footpaths',
    icon: '🛣️',
    categories: ['pothole', 'road_damage'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Rajesh Kumar', mobile: '+919876543210', designation: 'Ward Engineer', zone: 'North' },
      { name: 'Priya Sharma', mobile: '+919876543211', designation: 'Ward Engineer', zone: 'South' },
      { name: 'Amit Patel', mobile: '+919876543212', designation: 'Ward Engineer', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Ward Engineer', autoEscalateAfterHours: 24 },
      { level: 1, designation: 'Zone Supervisor', autoEscalateAfterHours: 48 },
      { level: 2, designation: 'Chief Engineer', autoEscalateAfterHours: 72 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 96 },
    ],
    avgResolutionHours: 48,
    performanceScore: 72
  },
  {
    name: 'Sanitation & Waste',
    code: 'SANITATION',
    description: 'Manages garbage collection, waste disposal, and cleanliness',
    icon: '🗑️',
    categories: ['garbage'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Suresh Yadav', mobile: '+919876543220', designation: 'Sanitation Inspector', zone: 'North' },
      { name: 'Meena Devi', mobile: '+919876543221', designation: 'Sanitation Inspector', zone: 'South' },
    ],
    escalationChain: [
      { level: 0, designation: 'Sanitation Inspector', autoEscalateAfterHours: 12 },
      { level: 1, designation: 'Zone Health Officer', autoEscalateAfterHours: 24 },
      { level: 2, designation: 'Chief Health Officer', autoEscalateAfterHours: 48 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 72 },
    ],
    avgResolutionHours: 24,
    performanceScore: 65
  },
  {
    name: 'Street Lighting',
    code: 'LIGHTING',
    description: 'Handles street light repairs and installations',
    icon: '💡',
    categories: ['streetlight'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Vijay Singh', mobile: '+919876543230', designation: 'Electrical Supervisor', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Electrical Supervisor', autoEscalateAfterHours: 24 },
      { level: 1, designation: 'Executive Engineer (Electrical)', autoEscalateAfterHours: 48 },
      { level: 2, designation: 'Superintendent Engineer', autoEscalateAfterHours: 72 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 96 },
    ],
    avgResolutionHours: 36,
    performanceScore: 78
  },
  {
    name: 'Water Supply',
    code: 'WATER',
    description: 'Manages water supply, pipe repairs, and water quality',
    icon: '💧',
    categories: ['water_supply'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Ravi Verma', mobile: '+919876543240', designation: 'Water Supply Engineer', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Water Supply Engineer', autoEscalateAfterHours: 6 },
      { level: 1, designation: 'Executive Engineer (Water)', autoEscalateAfterHours: 12 },
      { level: 2, designation: 'Chief Engineer (Water)', autoEscalateAfterHours: 24 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 48 },
    ],
    avgResolutionHours: 12,
    performanceScore: 82
  },
  {
    name: 'Sewage & Drainage',
    code: 'SEWAGE',
    description: 'Handles sewage blockages, drainage issues, and waterlogging',
    icon: '🚰',
    categories: ['sewage', 'drainage'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Manoj Gupta', mobile: '+919876543250', designation: 'Drainage Engineer', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Drainage Engineer', autoEscalateAfterHours: 12 },
      { level: 1, designation: 'Zone Drainage Officer', autoEscalateAfterHours: 24 },
      { level: 2, designation: 'Chief Engineer (Drainage)', autoEscalateAfterHours: 48 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 72 },
    ],
    avgResolutionHours: 24,
    performanceScore: 60
  },
  {
    name: 'Traffic & Transport',
    code: 'TRAFFIC',
    description: 'Manages traffic signals, parking, and road safety',
    icon: '🚦',
    categories: ['traffic'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Inspector Patil', mobile: '+919876543260', designation: 'Traffic Inspector', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Traffic Inspector', autoEscalateAfterHours: 24 },
      { level: 1, designation: 'ACP (Traffic)', autoEscalateAfterHours: 48 },
      { level: 2, designation: 'DCP (Traffic)', autoEscalateAfterHours: 72 },
      { level: 3, designation: 'Police Commissioner', autoEscalateAfterHours: 96 },
    ],
    avgResolutionHours: 48,
    performanceScore: 55
  },
  {
    name: 'Building & Construction',
    code: 'BUILDING',
    description: 'Handles illegal construction and building violations',
    icon: '🏗️',
    categories: ['illegal_construction', 'noise'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Anil Meshram', mobile: '+919876543270', designation: 'Building Inspector', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Building Inspector', autoEscalateAfterHours: 48 },
      { level: 1, designation: 'Ward Officer', autoEscalateAfterHours: 72 },
      { level: 2, designation: 'Deputy Commissioner (Buildings)', autoEscalateAfterHours: 96 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 120 },
    ],
    avgResolutionHours: 72,
    performanceScore: 45
  },
  {
    name: 'General Complaints',
    code: 'GENERAL',
    description: 'Handles miscellaneous civic complaints',
    icon: '📋',
    categories: ['other'],
    zones: ['North', 'South', 'East', 'West', 'Central'],
    contacts: [
      { name: 'Help Desk', mobile: '+919876543280', designation: 'Complaint Officer', zone: 'Central' },
    ],
    escalationChain: [
      { level: 0, designation: 'Complaint Officer', autoEscalateAfterHours: 24 },
      { level: 1, designation: 'Ward Officer', autoEscalateAfterHours: 48 },
      { level: 2, designation: 'Additional Commissioner', autoEscalateAfterHours: 72 },
      { level: 3, designation: 'Municipal Commissioner', autoEscalateAfterHours: 96 },
    ],
    avgResolutionHours: 48,
    performanceScore: 50
  }
];

// Sample complaints for demo
const sampleComplaints = [
  {
    title: 'Large pothole on MG Road near bus stop',
    description: 'There is a dangerous large pothole on MG Road, near the main bus stop. Multiple vehicles have been damaged. This is an accident-prone area especially during night. Children walk this route to school.',
    category: 'pothole',
    location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'MG Road, Pune', zone: 'Central' },
    priority: { level: 'critical', score: 85, factors: { category: 20, keywords: 16, frequency: 10, time: 5, aiSeverity: 10 } },
    status: 'in_progress',
    duplicateCount: 8,
    upvotes: 23,
  },
  {
    title: 'Garbage dumping near residential area',
    description: 'Huge pile of garbage accumulated near the park in Sector 7. It stinks badly and is attracting stray dogs. No collection for the past 5 days.',
    category: 'garbage',
    location: { type: 'Point', coordinates: [73.8480, 18.5300], address: 'Sector 7 Park, Pune', zone: 'North' },
    priority: { level: 'high', score: 58, factors: { category: 12, keywords: 8, frequency: 15, time: 5, aiSeverity: 7 } },
    status: 'submitted',
    duplicateCount: 5,
    upvotes: 15,
  },
  {
    title: 'Street light not working for 2 weeks',
    description: 'The street light near Lane 4, Koregaon Park has been non-functional for over 2 weeks. The area becomes very dark at night, making it unsafe especially for women.',
    category: 'streetlight',
    location: { type: 'Point', coordinates: [73.8920, 18.5362], address: 'Lane 4, Koregaon Park, Pune', zone: 'East' },
    priority: { level: 'medium', score: 42, factors: { category: 15, keywords: 8, frequency: 0, time: 10, aiSeverity: 3 } },
    status: 'under_review',
    duplicateCount: 2,
    upvotes: 7,
  },
  {
    title: 'Water pipe burst on FC Road',
    description: 'Major water pipe burst on FC Road causing flooding on the street. Water has been continuously flowing for 3 hours. Emergency situation.',
    category: 'water_supply',
    location: { type: 'Point', coordinates: [73.8400, 18.5250], address: 'FC Road, Pune', zone: 'Central' },
    priority: { level: 'critical', score: 92, factors: { category: 22, keywords: 24, frequency: 5, time: 15, aiSeverity: 10 } },
    status: 'escalated',
    escalationLevel: 1,
    duplicateCount: 12,
    upvotes: 45,
  },
  {
    title: 'Sewage overflow in residential colony',
    description: 'Sewage is overflowing from the manhole in Green Park Colony. The smell is unbearable and it is a health hazard. Children could fall into the open manhole.',
    category: 'sewage',
    location: { type: 'Point', coordinates: [73.8650, 18.5150], address: 'Green Park Colony, Pune', zone: 'South' },
    priority: { level: 'critical', score: 88, factors: { category: 25, keywords: 16, frequency: 10, time: 5, aiSeverity: 10 } },
    status: 'in_progress',
    duplicateCount: 6,
    upvotes: 31,
  },
  {
    title: 'Broken footpath causing injuries',
    description: 'The footpath near Nal Stop is completely broken with sharp edges. An elderly person tripped and got injured yesterday.',
    category: 'road_damage',
    location: { type: 'Point', coordinates: [73.8317, 18.5089], address: 'Nal Stop, Pune', zone: 'West' },
    priority: { level: 'high', score: 62, factors: { category: 18, keywords: 16, frequency: 5, time: 5, aiSeverity: 7 } },
    status: 'submitted',
    duplicateCount: 3,
    upvotes: 12,
  },
  {
    title: 'Illegal construction blocking road',
    description: 'Unauthorized construction on the footpath near Market Road. The builder has encroached on public land and is blocking pedestrian access.',
    category: 'illegal_construction',
    location: { type: 'Point', coordinates: [73.8750, 18.5100], address: 'Market Road, Pune', zone: 'Central' },
    priority: { level: 'medium', score: 35, factors: { category: 10, keywords: 0, frequency: 5, time: 5, aiSeverity: 3 } },
    status: 'under_review',
    duplicateCount: 1,
    upvotes: 4,
  },
  {
    title: 'Traffic signal not working at major junction',
    description: 'The traffic signal at University Road junction has been malfunctioning since morning. There are near-miss accidents happening frequently.',
    category: 'traffic',
    location: { type: 'Point', coordinates: [73.8470, 18.5230], address: 'University Road Junction, Pune', zone: 'Central' },
    priority: { level: 'high', score: 55, factors: { category: 10, keywords: 8, frequency: 10, time: 10, aiSeverity: 7 } },
    status: 'in_progress',
    duplicateCount: 4,
    upvotes: 18,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing database to overcome residual indexes
    if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
        console.log('🗑️ Dropped existing database to clear old indexes');
    }

    // Seed departments
    const createdDepts = await Department.insertMany(departments);
    console.log(`✅ Seeded ${createdDepts.length} departments`);

    // Create or find admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        mobile: '+919999999999',
        name: 'Admin',
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created admin user (+919999999999)');
    }

    // Create demo citizen
    let citizen = await User.findOne({ mobile: '+919876500000' });
    if (!citizen) {
      citizen = await User.create({
        mobile: '+919876500000',
        name: 'Demo Citizen',
        role: 'citizen',
        isVerified: true
      });
      console.log('✅ Created demo citizen (+919876500000)');
    }

    // Seed complaints
    const deptMap = {};
    createdDepts.forEach(d => {
      d.categories.forEach(cat => {
        deptMap[cat] = d._id;
      });
    });

    const complaintDocs = sampleComplaints.map((c, i) => ({
      ...c,
      ticketId: `CS-2026-${String(i + 1).padStart(6, '0')}`,
      citizen: citizen._id,
      department: deptMap[c.category],
      timeline: [
        { status: 'submitted', timestamp: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000), note: 'Complaint submitted' },
        ...(c.status !== 'submitted' ? [{ status: c.status, timestamp: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000), note: `Status changed to ${c.status}` }] : [])
      ],
      createdAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000)
    }));

    await Complaint.insertMany(complaintDocs);
    console.log(`✅ Seeded ${complaintDocs.length} sample complaints`);

    // Update department complaint counts
    for (const dept of createdDepts) {
      const count = await Complaint.countDocuments({ department: dept._id });
      const resolved = await Complaint.countDocuments({ department: dept._id, status: 'resolved' });
      await Department.findByIdAndUpdate(dept._id, { totalComplaints: count, resolvedComplaints: resolved });
    }

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Demo accounts:');
    console.log('  Admin:   +919999999999');
    console.log('  Citizen: +919876500000');
    console.log('  (Use any mobile number - OTP will be shown in console)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
