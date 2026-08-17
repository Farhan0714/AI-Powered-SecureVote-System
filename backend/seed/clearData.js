// Run with: npm run reset-db or node seed/clearData.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const connectDB = require('../config/db');
const User = require('../models/User');
const Registration = require('../models/Registration');
const ApprovedUser = require('../models/ApprovedUser');
const Vote = require('../models/Vote');
const Block = require('../models/Block');
const PendingBlock = require('../models/PendingBlock');
const Otp = require('../models/Otp');
const AuditLog = require('../models/AuditLog');
const ElectionResult = require('../models/ElectionResult');
const Candidate = require('../models/Candidate');
const ElectionHistory = require('../models/ElectionHistory');
const Manifesto = require('../models/Manifesto');
const SectorData = require('../models/SectorData');
const VotingPhase = require('../models/VotingPhase');

// Helper to compute proof of work and hash for genesis
function calculateHash(index, prevHash, timestamp, txType, txData, nonce) {
  const payload = `${index}${prevHash}${timestamp}${txType}${JSON.stringify(txData)}${nonce}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function proofOfWork(index, prevHash, timestamp, txType, txData, difficulty = 3) {
  let nonce = 0;
  const target = '0'.repeat(difficulty);
  let hash = calculateHash(index, prevHash, timestamp, txType, txData, nonce);
  while (!hash.startsWith(target)) {
    nonce++;
    hash = calculateHash(index, prevHash, timestamp, txType, txData, nonce);
  }
  return { nonce, hash };
}

async function resetDB() {
  await connectDB();
  console.log('🧹 Resetting SecureVote database...');

  // 1. Delete transactional data
  await Registration.deleteMany({});
  await ApprovedUser.deleteMany({});
  await Vote.deleteMany({});
  await PendingBlock.deleteMany({});
  await Otp.deleteMany({});
  await AuditLog.deleteMany({});
  await ElectionResult.deleteMany({});
  console.log('✅ Voter registrations, approvals, votes, OTPs, results, and audit logs cleared.');

  // 2. Delete non-system users (keep admin & verifiers, delete role='user')
  await User.deleteMany({ role: 'user' });
  console.log('✅ All standard voter accounts deleted.');

  // 3. Clear and re-create blockchain blocks (genesis block)
  await Block.deleteMany({});
  const timestamp = new Date().toISOString();
  const txData = { message: 'Genesis Block - SecureVote Blockchain Initialized' };
  const { nonce, hash } = proofOfWork(0, '0', timestamp, 'genesis', txData);
  await Block.create({ index: 0, prevHash: '0', txType: 'genesis', txData, nonce, hash, timestamp });
  console.log('✅ Blockchain reset and Genesis block seeded.');

  // 4. Ensure admin exists with auto-signing keys generated
  const adminExists = await User.findOne({ username: 'admin' });
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  if (adminExists) {
    adminExists.publicKeyPem = publicKey;
    adminExists.privateKeyPem = privateKey;
    await adminExists.save();
    console.log('✅ Admin account updated with automatic signing keys.');
  } else {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@securevote.local',
      passwordHash,
      role: 'admin',
      publicKeyPem: publicKey,
      privateKeyPem: privateKey
    });
    console.log('✅ Admin account created with automatic signing keys.');
  }

  // 5. Ensure verifiers exist
  for (const username of ['verifier1', 'verifier2']) {
    const exists = await User.findOne({ username });
    if (!exists) {
      const passwordHash = await bcrypt.hash('Verifier@123', 10);
      await User.create({ username, email: `${username}@securevote.local`, passwordHash, role: 'verifier' });
      console.log(`✅ Verifier created -> username: ${username} | password: Verifier@123`);
    }
  }

  // 6. Reset voting phase
  await VotingPhase.deleteMany({});
  await VotingPhase.create({ isActive: true, startTime: '08:00', endTime: '17:00' });
  console.log('✅ Voting phase reset (Active, 08:00 to 17:00).');

  // 7. Seed Candidates
  await Candidate.deleteMany({});
  await Candidate.insertMany([
    { name: 'Rajesh Sharma', party: 'BJP', symbol: '🪷', manifestoSummary: 'Focus on infrastructure, national security and digital economy.' },
    { name: 'Priya Gandhi', party: 'INC', symbol: '✋', manifestoSummary: 'Focus on social welfare, employment guarantee and healthcare access.' },
    { name: 'Arvind Kejri', party: 'AAP', symbol: '🧹', manifestoSummary: 'Focus on free utilities, public education and anti-corruption.' }
  ]);
  console.log('✅ Candidates seeded.');

  // 8. Seed Election History
  await ElectionHistory.deleteMany({});
  const historyRows = [
    { year: 2014, state: 'All India', party: 'BJP', votesReceived: 171660230, voteSharePercent: 31.0, seatsWon: 282, seatsContested: 428 },
    { year: 2014, state: 'All India', party: 'INC', votesReceived: 106935942, voteSharePercent: 19.3, seatsWon: 44, seatsContested: 464 },
    { year: 2014, state: 'All India', party: 'AAP', votesReceived: 10775464, voteSharePercent: 2.0, seatsWon: 4, seatsContested: 434 },
    { year: 2019, state: 'All India', party: 'BJP', votesReceived: 229234456, voteSharePercent: 37.4, seatsWon: 303, seatsContested: 436 },
    { year: 2019, state: 'All India', party: 'INC', votesReceived: 119281180, voteSharePercent: 19.5, seatsWon: 52, seatsContested: 421 },
    { year: 2019, state: 'All India', party: 'AAP', votesReceived: 3866358, voteSharePercent: 0.6, seatsWon: 1, seatsContested: 38 },
    { year: 2024, state: 'All India', party: 'BJP', votesReceived: 236900000, voteSharePercent: 36.6, seatsWon: 240, seatsContested: 441 }
  ];
  await ElectionHistory.insertMany(historyRows);
  console.log('✅ Election history seeded.');

  // 9. Seed Manifestos
  await Manifesto.deleteMany({});
  await Manifesto.insertMany([
    {
      party: 'BJP',
      year: 2024,
      summary: 'Focuses on infrastructure growth, national security, digital governance and manufacturing-led job creation.',
      keyPromises: [
        'Expansion of digital infrastructure and 5G networks.',
        'Modernizing defense equipment and border security.',
        'Subsidized loan programs for manufacturing start-ups.'
      ],
      focusSectors: ['Infrastructure', 'National Security', 'Digital Economy', 'Employment']
    },
    {
      party: 'INC',
      year: 2024,
      summary: 'Focuses on social welfare, minimum income guarantees, public health expansion, and youth education support.',
      keyPromises: [
        'Right to Apprenticeship program for college graduates.',
        'Doubling public spending on healthcare access.',
        'Nationwide basic income scheme for below-poverty-line families.'
      ],
      focusSectors: ['Health', 'Education', 'Social Welfare', 'Employment']
    },
    {
      party: 'AAP',
      year: 2024,
      summary: 'Emphasizes subsidized basic utilities, clean governance, and localized community healthcare clinics.',
      keyPromises: [
        'Establishment of Mohalla Clinics in all urban neighborhoods.',
        'Free baseline electricity and clean tap water quota.',
        'Expansion of public school infrastructure and smart classrooms.'
      ],
      focusSectors: ['Health', 'Education', 'Utilities', 'Governance']
    }
  ]);
  console.log('✅ Manifestos seeded.');

  // 10. Seed Sector Data
  await SectorData.deleteMany({});
  const sectorRows = [
    { year: 2014, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 7.4, unit: '%', rulingParty: 'BJP' },
    { year: 2016, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 8.3, unit: '%', rulingParty: 'BJP' },
    { year: 2019, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 3.9, unit: '%', rulingParty: 'BJP' },
    { year: 2020, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: -6.6, unit: '%', rulingParty: 'BJP' },
    { year: 2022, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 7.0, unit: '%', rulingParty: 'BJP' },
    { year: 2024, state: 'All India', sector: 'GDP', indicatorName: 'GDP Growth Rate', value: 8.2, unit: '%', rulingParty: 'BJP' },
    { year: 2014, state: 'All India', sector: 'Health', indicatorName: 'Life Expectancy', value: 68.3, unit: 'Years', rulingParty: 'BJP' },
    { year: 2019, state: 'All India', sector: 'Health', indicatorName: 'Life Expectancy', value: 69.7, unit: 'Years', rulingParty: 'BJP' },
    { year: 2024, state: 'All India', sector: 'Health', indicatorName: 'Life Expectancy', value: 72.0, unit: 'Years', rulingParty: 'BJP' },
    { year: 2014, state: 'All India', sector: 'Education', indicatorName: 'Literacy Rate', value: 74.0, unit: '%', rulingParty: 'BJP' },
    { year: 2024, state: 'All India', sector: 'Education', indicatorName: 'Literacy Rate', value: 77.7, unit: '%', rulingParty: 'BJP' }
  ];
  await SectorData.insertMany(sectorRows);
  console.log('✅ Sector growth data seeded.');

  console.log('🏁 SecureVote Database successfully reset to clean seed state!');
  await mongoose.connection.close();
}

resetDB().catch(err => {
  console.error('❌ Reset failed:', err);
  mongoose.disconnect();
});
