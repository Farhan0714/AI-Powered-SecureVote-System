const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBotReply } = require('../ml/chatbotEngine');

router.post('/ask', protect, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const { reply, matchedIntent, confidence } = await getBotReply(message, req.user, history);
    res.json({ success: true, reply, matchedIntent, confidence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Chatbot failed to respond.' });
  }
});

router.post('/ask-public', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const { reply, matchedIntent, confidence } = await getBotReply(message, null, history);
    res.json({ success: true, reply, matchedIntent, confidence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Chatbot failed to respond.' });
  }
});

module.exports = router;
