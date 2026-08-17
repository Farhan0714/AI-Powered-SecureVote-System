const crypto = require('crypto');
const Block = require('../models/Block');
const PendingBlock = require('../models/PendingBlock');

// In-memory chain of FINALIZED (multi-signed) blocks, mirrored to MongoDB so it survives restarts.
let chain = [];
let pendingVotes = [];

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

async function createGenesisBlock() {
  const timestamp = new Date().toISOString();
  const txData = { message: 'Genesis Block - SecureVote Blockchain Initialized' };
  const { nonce, hash } = proofOfWork(0, '0', timestamp, 'genesis', txData);
  const genesis = { index: 0, prevHash: '0', txType: 'genesis', txData, nonce, hash, timestamp };
  chain.push(genesis);
  await Block.create(genesis);
  return genesis;
}

async function initBlockchain() {
  const stored = await Block.find().sort({ index: 1 }).lean();
  if (stored.length) {
    chain = stored.map(b => ({
      index: b.index, prevHash: b.prevHash, txType: b.txType,
      txData: b.txData, nonce: b.nonce, hash: b.hash, timestamp: b.timestamp
    }));
    console.log(`🔗 Blockchain loaded from DB: ${chain.length} finalized block(s)`);
  } else {
    await createGenesisBlock();
    console.log('🔗 Genesis block created');
  }
}

function addPendingVote(voteData) {
  pendingVotes.push({ ...voteData, addedAt: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Multi-signature block finalization.
// A block is only PROPOSED here (PoW computed, but not yet part of the trusted chain).
// It must collect `requiredSignatures` independent verifier/admin signatures
// (see routes/verifiers.js) before finalizeBlock() moves it into the real chain.
// ---------------------------------------------------------------------------
async function proposeBlock(requiredSignatures = 2) {
  if (pendingVotes.length === 0) return null;
  const lastBlock = chain[chain.length - 1];
  const index = lastBlock.index + 1;
  const timestamp = new Date().toISOString();
  const txData = { votes: pendingVotes };
  const { nonce, hash } = proofOfWork(index, lastBlock.hash, timestamp, 'vote_batch', txData);

  const pendingBlock = await PendingBlock.create({
    index, prevHash: lastBlock.hash, txType: 'vote_batch', txData, nonce, hash, timestamp,
    requiredSignatures
  });
  pendingVotes = []; // votes are now "in flight" inside this proposal
  return pendingBlock;
}

async function getPendingBlocks() {
  return PendingBlock.find({ status: 'pending_signatures' }).sort({ index: 1 }).lean();
}

async function addSignature(pendingBlockId, verifierUser, signatureBase64) {
  const pendingBlock = await PendingBlock.findById(pendingBlockId);
  if (!pendingBlock || pendingBlock.status !== 'pending_signatures') {
    throw new Error('Pending block not found or already finalized.');
  }
  if (!verifierUser.publicKeyPem) {
    throw new Error('Your account has no signing key. Generate one first.');
  }
  if (pendingBlock.signatures.some(s => String(s.verifier) === String(verifierUser._id))) {
    throw new Error('You have already signed this block.');
  }

  const isValid = crypto.verify(
    'RSA-SHA256',
    Buffer.from(pendingBlock.hash),
    { key: verifierUser.publicKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(signatureBase64, 'base64')
  );
  if (!isValid) throw new Error('Signature verification failed - this signature does not match your key or this block.');

  pendingBlock.signatures.push({ verifier: verifierUser._id, verifierUsername: verifierUser.username, signatureBase64 });

  let finalized = false;
  if (pendingBlock.signatures.length >= pendingBlock.requiredSignatures) {
    const finalBlock = {
      index: pendingBlock.index, prevHash: pendingBlock.prevHash, txType: pendingBlock.txType,
      txData: pendingBlock.txData, nonce: pendingBlock.nonce, hash: pendingBlock.hash, timestamp: pendingBlock.timestamp
    };
    chain.push(finalBlock);
    await Block.create(finalBlock);
    pendingBlock.status = 'finalized';
    finalized = true;
  }
  await pendingBlock.save();
  return { pendingBlock, finalized };
}

function isChainValid() {
  for (let i = 1; i < chain.length; i++) {
    const current = chain[i];
    const prev = chain[i - 1];
    const recalculated = calculateHash(current.index, current.prevHash, current.timestamp, current.txType, current.txData, current.nonce);
    if (recalculated !== current.hash) return false;
    if (current.prevHash !== prev.hash) return false;
  }
  return true;
}

function getStats() {
  let totalVotes = 0;
  for (const block of chain) {
    if (block.txType === 'vote_batch' && block.txData && Array.isArray(block.txData.votes)) {
      for (const tx of block.txData.votes) {
        if (tx.voteHash) {
          totalVotes++;
        }
      }
    }
  }

  return {
    totalBlocks: chain.length,
    totalVotes,
    pendingVotes: pendingVotes.length,
    isValid: isChainValid(),
    lastBlockHash: chain[chain.length - 1]?.hash || null
  };
}

// Public-safe metadata only - no transaction contents.
function getPublicChainMeta() {
  return chain.map(b => ({ index: b.index, hash: b.hash, prevHash: b.prevHash, timestamp: b.timestamp, txType: b.txType }));
}

async function resetBlockchain() {
  chain = [];
  pendingVotes = [];
  await Block.deleteMany({});
  await PendingBlock.deleteMany({});
  await createGenesisBlock();
}

async function autoProposeAndAdminSign() {
  const pendingBlock = await proposeBlock(2);
  if (!pendingBlock) return null;

  const User = require('../models/User');
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser || !adminUser.privateKeyPem) {
    console.warn('⚠️ Auto-signing warning: Admin user or private key not found.');
    return pendingBlock;
  }

  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(pendingBlock.hash);
    const signatureBase64 = sign.sign(adminUser.privateKeyPem, 'base64');

    await addSignature(pendingBlock._id, adminUser, signatureBase64);
    console.log(`✅ Block #${pendingBlock.index} proposed and auto-signed by admin.`);
  } catch (err) {
    console.error('❌ Failed to auto-sign block:', err.message);
  }
  return pendingBlock;
}

module.exports = {
  initBlockchain, addPendingVote, proposeBlock, getPendingBlocks, addSignature,
  isChainValid, getStats, getPublicChainMeta, resetBlockchain, autoProposeAndAdminSign
};
