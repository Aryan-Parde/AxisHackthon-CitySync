require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./src/models/Department');

// ═══════════════════════════════════════════════════════
//  ALL 30 MUNICIPAL DEPARTMENTS (official list)
// ═══════════════════════════════════════════════════════
const departmentsToSeed = [
  // ── Row 1 ──
  { name: 'General Administration Department', code: 'GAD', description: 'Handles general administrative and miscellaneous civic queries.', categories: ['general','other'], icon: '🏢' },
  { name: 'Social Welfare Department', code: 'SWD', description: 'Handles social welfare schemes, pension, ration, and shelter services.', categories: ['welfare'], icon: '🤝' },
  { name: 'Solid Waste Management', code: 'SWM', description: 'Handles garbage collection, recycling, and solid waste disposal.', categories: ['garbage'], icon: '🗑️' },
  { name: 'Garden Department', code: 'GARDEN', description: 'Maintains public parks, gardens, playgrounds, and city trees.', categories: ['garden'], icon: '🌳' },
  { name: 'Accounts and Finance Department', code: 'AFD', description: 'Handles municipal accounting, budgets, and financial matters.', categories: ['finance'], icon: '💰' },
  { name: 'Public Health Engineering Department', code: 'PHED', description: 'Handles water supply, leakage, sewage, and drainage infrastructure.', categories: ['water_supply','sewage','drainage'], icon: '💧' },

  // ── Row 2 ──
  { name: 'Electrical Department', code: 'ED', description: 'Handles streetlights, electricity poles, transformers, and power issues.', categories: ['streetlight'], icon: '💡' },
  { name: 'Environment Department', code: 'ENV', description: 'Handles environmental protection, air quality, noise, and pollution.', categories: ['noise','pollution'], icon: '🌿' },
  { name: 'Public Work Department', code: 'PWD', description: 'Handles road maintenance, footpaths, bridges, and infrastructure repair.', categories: ['road_damage','pothole'], icon: '🛣️' },
  { name: 'Fire Department', code: 'FIRE', description: 'Handles fire hazards, fire prevention, and emergency response.', categories: ['fire'], icon: '🚒' },
  { name: 'Estate Department', code: 'ESTATE', description: 'Handles municipal property, land records, and estate management.', categories: ['estate'], icon: '🏘️' },
  { name: 'Market Department', code: 'MARKET', description: 'Handles municipal markets, vendor licensing, and trade regulation.', categories: ['market'], icon: '🏪' },

  // ── Row 3 ──
  { name: 'Encroachment Department', code: 'ENCR', description: 'Handles illegal constructions, encroachments, and unauthorized structures.', categories: ['illegal_construction'], icon: '🚧' },
  { name: 'Cultural And Sports Department', code: 'CSD', description: 'Handles cultural events, sports facilities, and public festivals.', categories: ['cultural'], icon: '🏟️' },
  { name: 'Birth and Death Registration Department', code: 'BDRD', description: 'Handles registration of births, deaths, and issuance of certificates.', categories: ['records'], icon: '📋' },
  { name: 'Revenue And Audit Department', code: 'RAD', description: 'Handles revenue collection, tax audit, and financial compliance.', categories: ['tax','audit'], icon: '📊' },
  { name: 'Public Relations Department', code: 'PRD', description: 'Handles public communication, media, and citizen grievance disclosure.', categories: ['pr'], icon: '📢' },
  { name: 'Health Department (Medicine)', code: 'HEALTH', description: 'Handles public health, disease control, hospitals, and medical emergencies.', categories: ['health'], icon: '🏥' },

  // ── Row 4 ──
  { name: 'Hot Mix Plant Department', code: 'HMPD', description: 'Handles road construction, asphalting, tar mixing, and resurfacing.', categories: ['road_damage'], icon: '🏗️' },
  { name: 'Central Records Department', code: 'CRD', description: 'Manages municipal records, RTI requests, and document archives.', categories: ['records'], icon: '📁' },
  { name: 'Transport Department', code: 'TRANSPORT', description: 'Handles city transport, traffic management, buses, and public transit.', categories: ['traffic'], icon: '🚌' },
  { name: 'Law Department', code: 'LAW', description: 'Handles legal matters, court cases, and legal notices for the municipality.', categories: ['legal'], icon: '⚖️' },
  { name: 'Town Planning Department', code: 'TPD', description: 'Handles building permissions, urban planning, and zoning regulations.', categories: ['town_planning'], icon: '🏙️' },
  { name: 'Election Department', code: 'ELEC', description: 'Handles election logistics, voter registration, and polling management.', categories: ['election'], icon: '🗳️' },

  // ── Row 5 ──
  { name: 'Department Of Information And Technology', code: 'IT', description: 'Handles IT infrastructure, municipal portals, apps, and digital services.', categories: ['it'], icon: '💻' },
  { name: 'Education Department', code: 'EDU', description: 'Handles municipal schools, education facilities, and teacher management.', categories: ['education'], icon: '📚' },
  { name: 'Workshop Department', code: 'WORKSHOP', description: 'Handles municipal vehicle maintenance, machinery repair, and fleet management.', categories: ['workshop'], icon: '🔧' },
  { name: 'Revenue Department', code: 'REVENUE', description: 'Handles property tax collection, assessment, and civic tax notices.', categories: ['tax'], icon: '🧾' },
  { name: 'LBT', code: 'LBT', description: 'Handles Local Body Tax (LBT) / Octroi collection and compliance.', categories: ['tax'], icon: '🏦' },
  { name: 'Skysign & Advertisement Department', code: 'SAD', description: 'Handles regulation of hoardings, banners, billboards, and public signage.', categories: ['signage'], icon: '🪧' },
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
      console.log(`✅ Seeded: ${dept.icon} ${dept.name} (${dept.code})`);
    }

    console.log(`\n🎉 Successfully seeded all ${departmentsToSeed.length} departments!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
}

seed();
