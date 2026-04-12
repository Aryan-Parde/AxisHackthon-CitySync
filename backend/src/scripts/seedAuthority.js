/**
 * Seed authority users with usernames and passwords
 * Run: node src/scripts/seedAuthority.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

const authorityCredentials = [
  { mobile: '+918000000000', username: 'roads_officer', password: 'roads@123', name: 'Roads & Infrastructure Officer' },
  { mobile: '+918000000001', username: 'water_officer', password: 'water@123', name: 'Water Supply Officer' },
  { mobile: '+918000000002', username: 'sanitation_officer', password: 'sanitation@123', name: 'Sanitation & Waste Officer' },
  { mobile: '+918000000003', username: 'streetlight_officer', password: 'streetlight@123', name: 'Street Lighting Officer' },
  { mobile: '+918000000004', username: 'sewage_officer', password: 'sewage@123', name: 'Sewage & Drainage Officer' },
  { mobile: '+918000000005', username: 'traffic_officer', password: 'traffic@123', name: 'Traffic & Transport Officer' },
  { mobile: '+919999999999', username: 'nodal_officer', password: 'nodal@123', name: 'Nodal Officer' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');

    for (const cred of authorityCredentials) {
      const hashedPassword = await bcrypt.hash(cred.password, 12);
      const result = await User.findOneAndUpdate(
        { username: cred.username },
        { 
          $set: { 
            username: cred.username, 
            password: hashedPassword,
            name: cred.name,
            mobile: cred.mobile,
            role: 'admin',
            isVerified: true
          } 
        },
        { new: true, upsert: true }
      );
      console.log(`✅ Seeded ${cred.username} (${cred.mobile}) — role: admin`);
    }

    console.log('\n🎉 Authority credentials seeded!');
    console.log('\nCredentials:');
    console.log('─────────────────────────────────────');
    authorityCredentials.forEach(c => {
      console.log(`  ${c.username} / ${c.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();
