const natural = require('natural');
const intents = require('./intents');

const Candidate = require('../models/Candidate');
const Manifesto = require('../models/Manifesto');
const ElectionHistory = require('../models/ElectionHistory');
const VotingPhase = require('../models/VotingPhase');
const Registration = require('../models/Registration');
const ApprovedUser = require('../models/ApprovedUser');

const CONFIDENCE_THRESHOLD = 0.35; // below this, treat as "didn't understand" (fallback)

// ---------------------------------------------------------------------------
// 1. TRAIN the classifier once at startup, from backend/ml/intents.js.
//    This is a genuine, from-scratch-trained Naive Bayes text classifier -
//    no external API, no pretrained weights, fully reproducible.
// ---------------------------------------------------------------------------
const classifier = new natural.BayesClassifier();
intents.forEach(({ tag, patterns }) => {
  patterns.forEach(pattern => classifier.addDocument(pattern, tag));
});
classifier.train();
console.log(`🧠 Chatbot intent classifier trained on ${intents.length} intents / ${intents.reduce((s, i) => s + i.patterns.length, 0)} example phrases`);

// Naive Bayes classification scores aren't probabilities out of the box; softmax-normalize
// them so we get a genuine 0-1 confidence figure to threshold against.
function classifyWithConfidence(text) {
  const classifications = classifier.getClassifications(text);
  if (!classifications.length) return { tag: 'fallback', confidence: 0 };
  const maxVal = Math.max(...classifications.map(c => c.value));
  const expScores = classifications.map(c => Math.exp(c.value - maxVal));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const ranked = classifications
    .map((c, i) => ({ tag: c.label, confidence: expScores[i] / sumExp }))
    .sort((a, b) => b.confidence - a.confidence);
  return ranked[0];
}

// ---------------------------------------------------------------------------
// 2. RESPOND: per-intent handlers, grounded in live MongoDB data where relevant,
//    so answers stay accurate and (for logged-in users) personalized.
// ---------------------------------------------------------------------------

async function isVotingActive() {
  const phase = await VotingPhase.findOne();
  if (!phase || !phase.isActive) return { active: false, phase };
  const now = new Date();
  const [sh, sm] = phase.startTime.split(':').map(Number);
  const [eh, em] = phase.endTime.split(':').map(Number);
  const start = new Date(now); start.setHours(sh, sm, 0, 0);
  const end = new Date(now); end.setHours(eh, em, 0, 0);
  return { active: now >= start && now <= end, phase };
}

const STATIC_RESPONSES = {
  greeting: "Hi! I'm VoteBot 🤖. Ask me about candidates, manifestos, past election results, sector-wise growth, or how to register and vote on this platform.",
  thanks: "You're welcome! Let me know if you have any other questions about elections or using the platform. 🗳️",
  how_to_signup: "To create an account:\n1. Go to the **Sign Up** page.\n2. Enter a username, email and password.\n3. Verify the OTP sent to your email.\n4. You'll be logged in and taken to your Dashboard.",
  how_to_register_voter: "To register as a voter:\n1. Go to **Application** (Register) from your Dashboard.\n2. Fill in your personal details and upload an identity proof.\n3. Capture your face live via webcam — this is stored and later used to verify you at voting time.\n4. Verify the OTP sent to your registration email, then submit.\n5. Your application goes to the admin for approval.",
  how_to_vote: "To cast your vote (once approved):\n1. Go to the **Vote** page and select a candidate.\n2. Enter the unique 6-character code emailed to you when you were approved.\n3. Complete a live face scan — it's checked against the face captured during registration.\n4. Confirm, and your vote is recorded and added to the blockchain.\nYou can only vote once.",
  unique_code_info: "Your unique voting code is a 6-character alphanumeric code emailed to you (and shown on your Dashboard) once the admin approves your voter registration. You'll need it, along with a live face scan, to cast your vote. Keep it private — it can only be used once.",
  face_verification_help: "Face verification compares a live webcam scan against the face captured during your registration, using an on-device face-recognition model — no photo ever leaves your browser unprocessed; only a mathematical descriptor (not the raw image) is sent for comparison at registration and voting time. If it's failing, make sure you're in good lighting and centered in frame, and that you allowed camera access.",
  blockchain_info: "Every cast vote is anonymized and hashed, then chained together using a proof-of-work blockchain, so once recorded a vote can't be silently altered — changing any past vote would break every hash link after it. To keep results confidential until official publication, the blockchain's contents aren't browsable by anyone, including admins.",
  password_help: "You can reset your password from the **Forgot Password** link on the Login page. You'll verify an OTP sent to your registered email, then set a new password."
};

async function handleRegistrationStatus(user) {
  if (!user) return "You'll need to be logged in for me to check your application status — try logging in first, or sign up if you haven't yet.";
  const registration = await Registration.findOne({ account: user._id }).select('status adminComment');
  if (!registration) return "I don't see a voter registration submitted yet on your account. You can start one from the **Application** page on your Dashboard.";
  if (registration.status === 'pending') return "Your voter registration is currently **pending** admin review. You'll be notified by email once it's approved.";
  if (registration.status === 'approved') return "Good news — your voter registration is **approved**! Check your Dashboard for your unique voting code, or your email for the code we sent you.";
  return `Your registration was **rejected**.${registration.adminComment ? ` Admin note: "${registration.adminComment}"` : ''} You may be able to contact the election admin for details.`;
}

async function handleVotingPhase() {
  const { active, phase } = await isVotingActive();
  if (!phase) return "Voting phase information isn't configured yet — please check back soon.";
  return active
    ? `Voting is **open right now**, daily between ${phase.startTime} and ${phase.endTime}.`
    : `Voting is **not currently open**. The configured window is ${phase.startTime}–${phase.endTime} daily, and voting is presently ${phase.isActive ? 'within that window\'s off-hours' : 'disabled by the admin'}.`;
}

async function handleCandidates() {
  const candidates = await Candidate.find().limit(10);
  if (!candidates.length) return "Candidate information hasn't been added yet — please check back later.";
  const lines = candidates.map(c => `• **${c.name}** (${c.party || 'Independent'}) ${c.symbol || ''}`);
  return `Here are the candidates for this election:\n${lines.join('\n')}`;
}

async function handleManifesto(message) {
  const manifestos = await Manifesto.find().limit(10);
  if (!manifestos.length) return "Manifesto information hasn't been added yet.";
  const mentioned = manifestos.find(m => message.toUpperCase().includes(m.party.toUpperCase()));
  if (mentioned) {
    return `**${mentioned.party} (${mentioned.year}) manifesto:**\n${mentioned.summary}\nFocus sectors: ${mentioned.focusSectors.join(', ')}\nKey promises: ${mentioned.keyPromises.slice(0, 4).join('; ')}`;
  }
  const lines = manifestos.map(m => `• **${m.party}**: ${m.summary}`);
  return `Here's a quick overview of each party's manifesto (ask about a specific party by name for more detail):\n${lines.join('\n')}`;
}

async function handleElectionHistory() {
  const rows = await ElectionHistory.find({ state: 'All India' }).sort({ year: -1 }).limit(9);
  if (!rows.length) return "I don't have historical election data loaded yet.";
  const byYear = {};
  rows.forEach(r => { byYear[r.year] = byYear[r.year] || []; byYear[r.year].push(r); });
  const lines = Object.entries(byYear).map(([year, entries]) =>
    `${year}: ` + entries.map(e => `${e.party} ${e.voteSharePercent}% (${e.seatsWon} seats)`).join(', ')
  );
  return `Past All-India election results:\n${lines.join('\n')}\n\nFor state-wise data and charts, check the **Election Data** page.`;
}

function handleGrowthAnalysisInfo() {
  return "For a data-grounded look at sector-wise growth (health, education, GDP, employment, infrastructure) across years, visit the **AI Growth Insights** page — it charts the underlying indicators and can generate a written evaluation.";
}

async function handleResultsInfo() {
  const phase = await VotingPhase.findOne();
  if (!phase?.resultsPublished) {
    return "Official results haven't been published yet. They'll be released once the voting phase ends and the admin publishes them — check the **Results** page after that.";
  }
  return "Results have been published! Head to the **Results** page to see the official vote counts and turnout.";
}

async function buildResponse(tag, message, user) {
  switch (tag) {
    case 'registration_status': return handleRegistrationStatus(user);
    case 'voting_phase_info': return handleVotingPhase();
    case 'candidates_info': return handleCandidates();
    case 'manifesto_query': return handleManifesto(message);
    case 'election_history': return handleElectionHistory();
    case 'growth_analysis_info': return handleGrowthAnalysisInfo();
    case 'results_info': return handleResultsInfo();
    default: return STATIC_RESPONSES[tag] ||
      "I'm not sure about that one. I can help with: signing up, voter registration, your unique code, face verification, voting steps, candidates, manifestos, past election results, sector growth data, or published results.";
  }
}

/**
 * Main entry point used by the chatbot routes.
 * @param {string} message - the user's message
 * @param {object|null} user - the authenticated Mongoose user doc, or null for public/anonymous
 */
async function getBotReply(message, user = null) {
  const { tag, confidence } = classifyWithConfidence(message);
  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      reply: "I'm not quite sure I understood that. I can help with signing up, voter registration, your unique voting code, face verification, how to vote, candidates, manifestos, past election results, sector growth data, or published results — try rephrasing around one of those topics!",
      matchedIntent: 'fallback',
      confidence
    };
  }
  const reply = await buildResponse(tag, message, user);
  return { reply, matchedIntent: tag, confidence };
}

module.exports = { getBotReply, classifyWithConfidence };
