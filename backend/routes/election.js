const express = require('express');
const router = express.Router();

const ElectionHistory = require('../models/ElectionHistory');
const Manifesto = require('../models/Manifesto');
const SectorData = require('../models/SectorData');
const ElectionResult = require('../models/ElectionResult');
const VotingPhase = require('../models/VotingPhase');
const { protect, adminOnly } = require('../middleware/auth');
const { askGemini } = require('../utils/gemini');

// ---- Published election results (current election) ----
// This is the ONLY place vote counts are ever returned by the API, and only once the
// admin has published them - deliberately not exposed via any /admin/* route.
router.get('/results', protect, async (req, res) => {
  try {
    const phase = await VotingPhase.findOne();
    if (!phase?.resultsPublished) {
      return res.json({ success: true, published: false });
    }
    const result = await ElectionResult.findOne().sort({ publishedAt: -1 });
    if (!result) return res.json({ success: true, published: false });
    res.json({ success: true, published: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Past election results ----
router.get('/history', async (req, res) => {
  try {
    const { year, state, party } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (state) filter.state = state;
    if (party) filter.party = party;
    const history = await ElectionHistory.find(filter).sort({ year: -1, voteSharePercent: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/history/years', async (req, res) => {
  const years = await ElectionHistory.distinct('year');
  res.json({ success: true, years: years.sort((a, b) => b - a) });
});

router.get('/history/states', async (req, res) => {
  const states = await ElectionHistory.distinct('state');
  res.json({ success: true, states: states.sort() });
});

// ---- Manifestos ----
router.get('/manifestos', async (req, res) => {
  const manifestos = await Manifesto.find().sort({ party: 1 });
  res.json({ success: true, manifestos });
});

router.get('/manifestos/:party', async (req, res) => {
  const manifesto = await Manifesto.findOne({ party: req.params.party });
  if (!manifesto) return res.status(404).json({ success: false, message: 'Manifesto not found.' });
  res.json({ success: true, manifesto });
});

// ---- Sector growth data ----
router.get('/sector-data', async (req, res) => {
  try {
    const { sector, state } = req.query;
    const filter = {};
    if (sector) filter.sector = sector;
    if (state) filter.state = state;
    const data = await SectorData.find(filter).sort({ year: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/sector-data/sectors', async (req, res) => {
  const sectors = await SectorData.distinct('sector');
  res.json({ success: true, sectors });
});

// ---- AI Growth Evaluation ----
// Takes stored sector indicators and asks Gemini to produce a structured,
// evidence-based narrative evaluation of growth trends across governments/years.
router.post('/growth-analysis', protect, async (req, res) => {
  try {
    const { state = 'All India', sectors } = req.body; // sectors: optional array to focus on
    const filter = { state };
    if (sectors?.length) filter.sector = { $in: sectors };
    const data = await SectorData.find(filter).sort({ year: 1 }).lean();

    if (!data.length) {
      return res.status(404).json({ success: false, message: 'No sector data available for this state yet. Ask an admin to seed data.' });
    }

    const systemInstruction = `You are an impartial policy-data analyst for a civic-education platform called SecureVote.
You will be given year-wise government sector indicators (health, education, GDP, infrastructure, employment, etc.) for an Indian state.
Write a clear, neutral, evidence-based evaluation of growth trends over time, grouped by sector.
Rules:
- Base every claim ONLY on the numeric data provided; do not invent figures.
- Note which ruling party was in power during notable increases/decreases, but stay factual and non-partisan; do not praise or attack any party.
- Structure the answer with short markdown headings per sector and 2-4 bullet points each.
- End with a brief, balanced "Overall Summary" paragraph.
- Keep the entire response under 500 words.`;

    const userPrompt = `State: ${state}\nSector data (JSON):\n${JSON.stringify(data)}\n\nProduce the growth evaluation now.`;

    const analysis = await askGemini(systemInstruction, userPrompt);
    res.json({ success: true, state, dataPoints: data.length, analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Admin: seed/add data manually via API (in addition to seed script) ----
router.post('/history', protect, adminOnly, async (req, res) => {
  const entry = await ElectionHistory.create(req.body);
  res.status(201).json({ success: true, entry });
});

router.post('/manifestos', protect, adminOnly, async (req, res) => {
  const manifesto = await Manifesto.findOneAndUpdate(
    { party: req.body.party }, req.body, { upsert: true, new: true }
  );
  res.status(201).json({ success: true, manifesto });
});

router.post('/sector-data', protect, adminOnly, async (req, res) => {
  const entry = await SectorData.create(req.body);
  res.status(201).json({ success: true, entry });
});

module.exports = router;
