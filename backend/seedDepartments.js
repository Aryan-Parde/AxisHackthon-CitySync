require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./src/models/Department');

const departmentsToSeed = [
  {
    name: 'Solid Waste Management',
    code: 'SWM',
    description: 'Handles garbage collection and solid waste management.',
    categories: ['garbage'],
    icon: '🗑️'
  },
  {
    name: 'Public Health Engineering Department',
    code: 'PHED',
    description: 'Handles water supply, leakage, and sewage.',
    categories: ['water_supply', 'sewage', 'drainage'],
    icon: '💧'
  },
  {
    name: 'Public Work Department',
    code: 'PWD',
    description: 'Handles road maintenance and damage repair.',
    categories: ['pothole', 'road_damage'],
    icon: '🛣️'
  },
  {
    name: 'Electrical Department',
    code: 'ED',
    description: 'Handles streetlights and electricity issues.',
    categories: ['streetlight'],
    icon: '💡'
  },
  {
    name: 'Encroachment Department',
    code: 'ENCR',
    description: 'Handles illegal constructions and encroachments.',
    categories: ['illegal_construction'],
    icon: '🚧'
  },
  {
    name: 'Environment Department',
    code: 'ENV',
    description: 'Handles environmental and noise pollution issues.',
    categories: ['noise'],
    icon: '🌳'
  },
  {
    name: 'Fire Department',
    code: 'FIRE',
    description: 'Handles fire hazards and emergencies.',
    categories: [],
    icon: '🚒'
  },
  {
    name: 'Health Department (Medicine)',
    code: 'HEALTH',
    description: 'Handles public health and medical emergencies.',
    categories: [],
    icon: '🏥'
  },
  {
    name: 'Revenue Department',
    code: 'REVENUE',
    description: 'Handles civic tax and land revenue issues.',
    categories: [],
    icon: '💰'
  },
  {
    name: 'Transport Department',
    code: 'TRANSPORT',
    description: 'Handles city transport and traffic issues.',
    categories: ['traffic'],
    icon: '🚌'
  },
  {
    name: 'General Administration Department',
    code: 'GAD',
    description: 'Handles general administrative and miscellaneous queries.',
    categories: ['other'],
    icon: '🏢'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const dept of departmentsToSeed) {
      await Department.findOneAndUpdate(
        { code: dept.code },
        { $set: dept },
        { upsert: true, new: true }
      );
      console.log(`Seeded: ${dept.name}`);
    }

    console.log('Successfully seeded all departments!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
}

seed();
