// Run with: npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const ElectionHistory = require('../models/ElectionHistory');
const Manifesto = require('../models/Manifesto');
const SectorData = require('../models/SectorData');
const VotingPhase = require('../models/VotingPhase');

async function seed() {
  await connectDB();
  console.log('🌱 Seeding SecureVote database...');

  // --- Admin account ---
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await User.create({ username: 'admin', email: 'admin@securevote.local', passwordHash, role: 'admin' });
    console.log('👤 Admin created -> username: admin | password: Admin@123');
  }

  // --- Verifier accounts (multi-signature block finalization: 2-of-3 quorum with admin) ---
  for (const [i, username] of ['verifier1', 'verifier2'].entries()) {
    const exists = await User.findOne({ username });
    if (!exists) {
      const passwordHash = await bcrypt.hash('Verifier@123', 10);
      await User.create({ username, email: `${username}@securevote.local`, passwordHash, role: 'verifier' });
      console.log(`🖋️  Verifier created -> username: ${username} | password: Verifier@123`);
    }
  }
  console.log('ℹ️  3 signer-eligible accounts exist (admin, verifier1, verifier2). Each must visit');
  console.log('   "Generate Signing Key" once before they can co-sign blocks (2-of-3 required).');

  // --- Candidates ---
  await Candidate.deleteMany({});
  await Candidate.insertMany([
    { name: 'Rajesh Sharma', party: 'BJP', symbol: '🪷', manifestoSummary: 'Focus on infrastructure, national security and digital economy.' },
    { name: 'Priya Gandhi', party: 'INC', symbol: '✋', manifestoSummary: 'Focus on social welfare, employment guarantee and healthcare access.' },
    { name: 'Arvind Kejri', party: 'AAP', symbol: '🧹', manifestoSummary: 'Focus on free utilities, public education and anti-corruption.' }
  ]);
  console.log('🗳️  Candidates seeded');

  // --- Voting phase default ---
  await VotingPhase.deleteMany({});
  await VotingPhase.create({ isActive: true, startTime: '08:00', endTime: '17:00' });

  // --- Past election history (illustrative sample data, All India totals, Lok Sabha-style) ---
  await ElectionHistory.deleteMany({});
  const historyRows = [
    { year: 2014, state: 'All India', party: 'BJP', votesReceived: 171660230, voteSharePercent: 31.0, seatsWon: 282, seatsContested: 428 },
    { year: 2014, state: 'All India', party: 'INC', votesReceived: 106935942, voteSharePercent: 19.3, seatsWon: 44, seatsContested: 464 },
    { year: 2014, state: 'All India', party: 'AAP', votesReceived: 10775464, voteSharePercent: 2.0, seatsWon: 4, seatsContested: 434 },
    { year: 2019, state: 'All India', party: 'BJP', votesReceived: 229234456, voteSharePercent: 37.4, seatsWon: 303, seatsContested: 436 },
    { year: 2019, state: 'All India', party: 'INC', votesReceived: 119281180, voteSharePercent: 19.5, seatsWon: 52, seatsContested: 421 },
    { year: 2019, state: 'All India', party: 'AAP', votesReceived: 3866358, voteSharePercent: 0.6, seatsWon: 1, seatsContested: 38 },
    { year: 2024, state: 'All India', party: 'BJP', votesReceived: 236900000, voteSharePercent: 36.6, seatsWon: 240, seatsContested: 441 },
    { year: 2024, state: 'All India', party: 'INC', votesReceived: 137700000, voteSharePercent: 21.2, seatsWon: 99, seatsContested: 328 },
    { year: 2024, state: 'All India', party: 'AAP', votesReceived: 4200000, voteSharePercent: 0.65, seatsWon: 3, seatsContested: 22 },
    { year: 2020, state: 'Delhi', party: 'AAP', votesReceived: 6237899, voteSharePercent: 53.6, seatsWon: 62, seatsContested: 70 },
    { year: 2020, state: 'Delhi', party: 'BJP', votesReceived: 4256446, voteSharePercent: 38.5, seatsWon: 8, seatsContested: 70 },
    { year: 2020, state: 'Delhi', party: 'INC', votesReceived: 468721, voteSharePercent: 4.3, seatsWon: 0, seatsContested: 66 }
  ];
  await ElectionHistory.insertMany(historyRows);
  console.log(`📊 Election history seeded (${historyRows.length} rows) — illustrative sample data`);

  // --- Manifestos ---
  await Manifesto.deleteMany({});
  await Manifesto.insertMany([
    {
      party: 'BJP', year: 2024,
      keyPromises: ['Housing for all', '3 crore new jobs', 'Expand rural infrastructure', 'Boost manufacturing (Make in India)'],
      focusSectors: ['Infrastructure', 'Economy', 'Defence', 'Digital India'],
      summary: 'Emphasizes infrastructure growth, national security, digital governance and manufacturing-led job creation.'
    },
    {
      party: 'INC', year: 2024,
      keyPromises: ['Right to Apprenticeship', 'Caste census', 'Higher MSP for farmers', 'Increased health spending'],
      focusSectors: ['Health', 'Education', 'Agriculture', 'Employment'],
      summary: 'Emphasizes social welfare schemes, employment guarantees, farmer support and expanded public healthcare.'
    },
    {
      party: 'AAP', year: 2024,
      keyPromises: ['Free electricity & water', 'Mohalla clinics nationwide', 'Free public schooling reforms', 'Anti-corruption governance'],
      focusSectors: ['Education', 'Health', 'Utilities', 'Governance'],
      summary: 'Emphasizes free basic utilities, community healthcare clinics, public education reform and clean governance.'
    }
  ]);
  console.log('📜 Manifestos seeded');

  // --- Sector growth data (illustrative sample indicators, All India) ---
  await SectorData.deleteMany({});
  const sectorRows = [
    // GDP Growth Rate (%)
    { year: 2014, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 7.4, unit: '%', rulingParty: 'BJP' },
    { year: 2016, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 8.3, unit: '%', rulingParty: 'BJP' },
    { year: 2019, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 3.9, unit: '%', rulingParty: 'BJP' },
    { year: 2020, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: -6.6, unit: '%', rulingParty: 'BJP' },
    { year: 2022, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 7.0, unit: '%', rulingParty: 'BJP' },
    { year: 2024, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 8.2, unit: '%', rulingParty: 'BJP' },
    // Health - Life Expectancy
    { year: 2014, state: 'All India', sector: 'Health', indicatorName: 'Life Expectancy at Birth', value: 67.9, unit: 'years', rulingParty: 'BJP' },
    { year: 2018, state: 'All India', sector: 'Health', indicatorName: 'Life Expectancy at Birth', value: 69.4, unit: 'years', rulingParty: 'BJP' },
    { year: 2022, state: 'All India', sector: 'Health', indicatorName: 'Life Expectancy at Birth', value: 70.2, unit: 'years', rulingParty: 'BJP' },
    { year: 2014, state: 'All India', sector: 'Health', indicatorName: 'Infant Mortality Rate', value: 39.0, unit: 'per 1000 births', rulingParty: 'BJP' },
    { year: 2022, state: 'All India', sector: 'Health', indicatorName: 'Infant Mortality Rate', value: 25.5, unit: 'per 1000 births', rulingParty: 'BJP' },
    // Education - Literacy Rate
    { year: 2014, state: 'All India', sector: 'Education', indicatorName: 'Literacy Rate', value: 71.0, unit: '%', rulingParty: 'BJP' },
    { year: 2018, state: 'All India', sector: 'Education', indicatorName: 'Literacy Rate', value: 74.4, unit: '%', rulingParty: 'BJP' },
    { year: 2022, state: 'All India', sector: 'Education', indicatorName: 'Literacy Rate', value: 77.7, unit: '%', rulingParty: 'BJP' },
    // Employment - Unemployment Rate
    { year: 2014, state: 'All India', sector: 'Employment', indicatorName: 'Unemployment Rate', value: 5.4, unit: '%', rulingParty: 'BJP' },
    { year: 2019, state: 'All India', sector: 'Employment', indicatorName: 'Unemployment Rate', value: 5.8, unit: '%', rulingParty: 'BJP' },
    { year: 2021, state: 'All India', sector: 'Employment', indicatorName: 'Unemployment Rate', value: 5.98, unit: '%', rulingParty: 'BJP' },
    { year: 2024, state: 'All India', sector: 'Employment', indicatorName: 'Unemployment Rate', value: 3.2, unit: '%', rulingParty: 'BJP' },
    // Infrastructure - Rural Road Connectivity
    { year: 2014, state: 'All India', sector: 'Infrastructure', indicatorName: 'Rural Roads Built (PMGSY, cumulative km, 000s)', value: 398, unit: 'thousand km', rulingParty: 'BJP' },
    { year: 2024, state: 'All India', sector: 'Infrastructure', indicatorName: 'Rural Roads Built (PMGSY, cumulative km, 000s)', value: 765, unit: 'thousand km', rulingParty: 'BJP' },
    // Delhi state examples for AAP
    { year: 2015, state: 'Delhi', sector: 'Education', indicatorName: 'Government School Pass %', value: 88.0, unit: '%', rulingParty: 'AAP' },
    { year: 2023, state: 'Delhi', sector: 'Education', indicatorName: 'Government School Pass %', value: 97.0, unit: '%', rulingParty: 'AAP' },
    { year: 2015, state: 'Delhi', sector: 'Health', indicatorName: 'Mohalla Clinics Operational', value: 20, unit: 'count', rulingParty: 'AAP' },
    { year: 2023, state: 'Delhi', sector: 'Health', indicatorName: 'Mohalla Clinics Operational', value: 519, unit: 'count', rulingParty: 'AAP' }
  ];
  await SectorData.insertMany(sectorRows);
  console.log(`📈 Sector growth data seeded (${sectorRows.length} rows) — illustrative sample data`);

  console.log('✅ Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
