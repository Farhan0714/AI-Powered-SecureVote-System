const natural = require('natural');
const intents = require('./intents');

const Candidate = require('../models/Candidate');
const Manifesto = require('../models/Manifesto');
const ElectionHistory = require('../models/ElectionHistory');
const VotingPhase = require('../models/VotingPhase');
const Registration = require('../models/Registration');
const ApprovedUser = require('../models/ApprovedUser');
const SectorData = require('../models/SectorData');

const { askGemini } = require('../utils/gemini');

const CONFIDENCE_THRESHOLD = 0.35;

const classifier = new natural.BayesClassifier();
intents.forEach(({ tag, patterns }) => {
  patterns.forEach(pattern => classifier.addDocument(pattern, tag));
});
classifier.train();
console.log(`🧠 Chatbot intent classifier trained on ${intents.length} intents / ${intents.reduce((s, i) => s + i.patterns.length, 0)} example phrases`);

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
  const registration = await Registration.findOne({ account: user._id }).sort({ createdAt: -1 }).select('status adminComment');
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

const conversationContext = new Map();

function getContextKey(user, history) {
  if (user) return `user:${String(user._id)}`;
  if (history && history.length > 0) {
    const firstMsg = history[0]?.text || '';
    return `anon:${firstMsg.slice(0, 20)}`;
  }
  return `anon:${Date.now()}`;
}

function detectFollowUp(message, context) {
  const lowerMsg = message.toLowerCase().trim();
  const followUpPatterns = [
    /^tell me more/i, /^what about/i, /^and/i, /^how about/i,
    /^what else/i, /^more/i, /^explain more/i, /^elaborate/i,
    /^also/i, /^can you elaborate/i, /^go on/i, /^continue/i,
    /^what (?:was|is) that/i, /^show me more/i
  ];
  const isFollowUp = followUpPatterns.some(p => p.test(lowerMsg));
  if (isFollowUp && context && context.lastIntent && context.lastIntent !== 'greeting' && context.lastIntent !== 'thanks') {
    return context.lastIntent;
  }
  return null;
}

async function buildRAGContext(user) {
  const docs = [
    { id: 'greeting', title: 'VoteBot Greeting / Introduction', content: STATIC_RESPONSES.greeting },
    { id: 'thanks', title: 'Thanking the user / Closing', content: STATIC_RESPONSES.thanks },
    { id: 'how_to_signup', title: 'How to sign up and create a user account', content: STATIC_RESPONSES.how_to_signup },
    { id: 'how_to_register_voter', title: 'How to register or apply to become a voter', content: STATIC_RESPONSES.how_to_register_voter },
    { id: 'how_to_vote', title: 'How to cast a vote and follow voting steps', content: STATIC_RESPONSES.how_to_vote },
    { id: 'unique_code_info', title: 'Unique voting code information and usage', content: STATIC_RESPONSES.unique_code_info },
    { id: 'face_verification_help', title: 'Face verification, camera access, and liveness check instructions', content: STATIC_RESPONSES.face_verification_help },
    { id: 'blockchain_info', title: 'Blockchain security, proof-of-work, and vote tamper-proofing', content: STATIC_RESPONSES.blockchain_info },
    { id: 'password_help', title: 'Resetting or changing account password', content: STATIC_RESPONSES.password_help },

    { id: 'guide_dashboard', title: 'SecureVote Dashboard Navigation and Features Guide', content: "The Dashboard is the central home page for logged-in users. Here you can: 1. View your voter registration status (approved, pending, or rejected). 2. View your unique 6-character voting code (if approved). 3. View whether voting is currently active or if you have already voted. 4. Access quick links to 'Apply to Vote' (Register), the 'Vote' page, 'Election Data' (past results), and 'Official Results'." },
    { id: 'guide_application', title: 'Voter Registration / Application Page Navigation Guide', content: "To register as a voter, navigate to the 'Application' page in the navbar: 1. Fill in personal details (Full Name, Father's Name, Mother's Name, Age, Phone, Voter ID, Address, Email). 2. Upload an Identity Proof (Image or PDF). 3. Perform a live face capture with webcam liveness check (turn head left/right). 4. Request and verify the OTP sent to your registration email. 5. Submit the application for admin approval." },
    { id: 'guide_voting', title: 'How to Vote / Voting Page Navigation Guide', content: "To cast your vote, go to the 'Vote' page in the navbar (available to approved voters): 1. Choose your preferred candidate. 2. Enter your unique 6-character voting code shown on your Dashboard or sent to your email. 3. Scan your face live with the webcam face verification. 4. Confirm and submit. Your vote is anonymized, hashed, and recorded on the blockchain." },
    { id: 'guide_results', title: 'Election Results Page Guide', content: "The 'Results' page displays the final vote counts and turnout once the election is concluded. Results are published by the admin after the voting phase ends. If results are not published yet, the page will state so." },
    { id: 'guide_insights', title: 'AI Growth Insights / Election Data Page Guide', content: "The 'Election Data' (or 'AI Growth Insights') page lets you analyze past election outcomes, vote shares, and turnout. You can select a state (like All India) and request an AI-powered evaluation of sector-wise growth indicators (GDP, health, education, infrastructure, employment) comparing different years and governments." },
    { id: 'guide_audit_trail', title: 'Audit Trail / Blockchain integrity verification Guide', content: "The Audit Trail page lists the blockchain block-by-block integrity details, displaying the block indices, previous hashes, current hashes, timestamp, and proof-of-work values. This lets any user verify that the records have not been tampered with." }
  ];

  try {

    const candidates = await Candidate.find();
    candidates.forEach(c => {
      docs.push({
        id: `candidate_${c._id}`,
        title: `Candidate: ${c.name} (${c.party || 'Independent'})`,
        content: `Candidate Name: ${c.name}, Party: ${c.party || 'Independent'}, Symbol: ${c.symbol || 'None'}. Description: ${c.description || 'No description available.'}`
      });
    });

    const manifestos = await Manifesto.find();
    manifestos.forEach(m => {
      docs.push({
        id: `manifesto_${m._id}`,
        title: `Manifesto of ${m.party}`,
        content: `Party: ${m.party} (${m.year}). Manifesto Summary: ${m.summary}. Key Promises: ${m.keyPromises.join(', ')}. Focus Sectors: ${m.focusSectors.join(', ')}`
      });
    });

    const historyList = await ElectionHistory.find();
    historyList.forEach(h => {
      docs.push({
        id: `history_${h._id}`,
        title: `Past Election Results for ${h.year} in ${h.state}`,
        content: `In the ${h.year} election in state/region ${h.state}, the party ${h.party} won ${h.seatsWon} seats with a vote share of ${h.voteSharePercent}%.`
      });
    });

    const sectorData = await SectorData.find();
    sectorData.forEach(s => {
      docs.push({
        id: `sector_${s._id}`,
        title: `${s.sector} Sector Indicator Growth: ${s.indicatorName} in ${s.year} (${s.state})`,
        content: `In the year ${s.year}, the ${s.sector} sector indicator "${s.indicatorName}" in ${s.state} was measured at ${s.value}${s.unit || '%'}. The ruling party was ${s.rulingParty || 'N/A'}.`
      });
    });

    const phase = await VotingPhase.findOne();
    if (phase) {
      const activeText = phase.isActive ? 'active' : 'inactive';
      const resultsText = phase.resultsPublished ? 'published' : 'not published yet';
      docs.push({
        id: 'voting_phase',
        title: 'Current Voting Phase Status and Hours',
        content: `Voting window timing: daily between ${phase.startTime} and ${phase.endTime}. Currently active: ${activeText}. Results published: ${resultsText}.`
      });
    }

    if (user) {
      const reg = await Registration.findOne({ account: user._id }).sort({ createdAt: -1 });
      if (reg) {
        docs.push({
          id: 'user_registration_status',
          title: `Registration Status for logged-in user ${user.username}`,
          content: `Logged-in User Profile: Username: ${user.username}, Email: ${user.email}. Voter Registration Application Status: ${reg.status}. Admin comments/reason: ${reg.adminComment || 'None'}. Unique Voting Code: ${reg.status === 'approved' ? 'Assigned and visible on dashboard' : 'Not assigned yet'}.`
        });
      } else {
        docs.push({
          id: 'user_registration_status',
          title: `Registration Status for logged-in user ${user.username}`,
          content: `Logged-in User Profile: Username: ${user.username}, Email: ${user.email}. The user has NOT submitted any voter registration application yet.`
        });
      }
    }
  } catch (err) {
    console.error('Error fetching database records for RAG:', err);
  }

  return docs;
}

async function getNaiveBayesReply(message, user = null, history = null) {
  const contextKey = getContextKey(user, history);
  const context = conversationContext.get(contextKey) || { lastIntent: null, turnCount: 0 };

  const followUpIntent = detectFollowUp(message, context);
  let tag, confidence;

  if (followUpIntent) {
    tag = followUpIntent;
    confidence = 0.8;
  } else {
    const classification = classifyWithConfidence(message);
    tag = classification.tag;
    confidence = classification.confidence;
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    const electionKeywords = ['vote', 'election', 'candidate', 'party', 'register', 'signup', 'login',
      'result', 'blockchain', 'face', 'code', 'otp', 'admin', 'approve', 'manifesto', 'growth'];
    const hasKeyword = electionKeywords.some(kw => message.toLowerCase().includes(kw));

    const fallbackReply = hasKeyword
      ? `I heard you mention something about "${message.slice(0, 50)}" — try being more specific! I can help with: signing up, voter registration, your unique voting code, face verification, how to vote, candidates list, party manifestos, past election results, sector growth analysis, or published election results.`
      : "I'm not quite sure I understood that. I can help with signing up, voter registration, your unique voting code, face verification, how to vote, candidates, manifestos, past election results, sector growth data, or published results — try rephrasing around one of those topics!";

    context.lastIntent = 'fallback';
    context.turnCount++;
    conversationContext.set(contextKey, context);

    return { reply: fallbackReply, matchedIntent: 'fallback', confidence };
  }

  const reply = await buildResponse(tag, message, user);
  context.lastIntent = tag;
  context.turnCount++;
  conversationContext.set(contextKey, context);

  return { reply, matchedIntent: tag, confidence };
}

async function getBotReply(message, user = null, history = null) {

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set in .env. Falling back to Naive Bayes intent classifier.');
    return getNaiveBayesReply(message, user, history);
  }

  try {

    const docs = await buildRAGContext(user);

    const tfidf = new natural.TfIdf();
    docs.forEach(doc => {
      tfidf.addDocument(`${doc.title} ${doc.content}`);
    });

    const scores = [];
    tfidf.tfidfs(message, (i, score) => {
      scores.push({ index: i, score });
    });

    let relevantDocs = scores
      .sort((a, b) => b.score - a.score)
      .filter(item => item.score > 0)
      .slice(0, 5)
      .map(item => docs[item.index]);

    if (relevantDocs.length === 0) {
      relevantDocs = docs.slice(0, 4);
    }

    const contextText = relevantDocs
      .map(d => `--- \nDocument: ${d.title}\nContent: ${d.content}`)
      .join('\n\n');

    const systemInstruction = `You are VoteBot 🤖, the official AI assistant for the SecureVote blockchain-based voting platform.
Your task is to answer user queries accurately based on the provided Context and User information.

Here is the retrieved context from the platform's knowledge base and database:
[START CONTEXT]
${contextText}
[END CONTEXT]

Guidelines:
1. Ground your answers strictly in the provided Context.
2. If the user asks about candidates, manifestos, or voting phase, check the Context for candidates list, manifesto details, or current voting window and answer accordingly.
3. If the user asks about their voter registration application status, check if the Context contains "Registration Status for logged-in user". If it does, tell the user their status (e.g. approved, pending, rejected) and any comments. If not, and they are logged in, tell them no application is found. If they are not logged in, remind them to log in to see their registration status.
4. Be professional, friendly, and concise. Use clear markdown formatting.
5. If the query is a simple greeting or thanks, respond politely and explain how you can help.`;

    let userPrompt = '';
    if (history && Array.isArray(history) && history.length > 0) {
      userPrompt += "Previous conversation history for context:\n";

      const recentHistory = history.slice(-4);
      recentHistory.forEach(h => {
        const role = h.role === 'user' ? 'User' : 'VoteBot';
        userPrompt += `${role}: ${h.text}\n`;
      });
      userPrompt += "\n";
    }
    userPrompt += `Current User Query: ${message}`;

    const reply = await askGemini(systemInstruction, userPrompt);

    return {
      reply: reply.trim(),
      matchedIntent: 'rag_gemini',
      confidence: 1.0
    };
  } catch (err) {
    console.error('Error in Gemini RAG reply, falling back to Naive Bayes:', err);
    return getNaiveBayesReply(message, user, history);
  }
}

module.exports = { getBotReply, classifyWithConfidence };
