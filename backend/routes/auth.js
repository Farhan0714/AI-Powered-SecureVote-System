const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtp, otpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/email');
const { signToken, sendTokenCookie } = require('../utils/token');
const { protect } = require('../middleware/auth');

// STEP 1: request OTP for signup
router.post('/signup/request-otp', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid username, email and password (6+ chars) are required.' });
    }
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username or email already registered.' });
    }
    const otp = generateOtp();
    await Otp.create({ email, otp, purpose: 'signup', expiresAt: otpExpiry(10) });
    await sendOtpEmail(email, otp, username, 'signup');
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// STEP 2: verify OTP + create account
router.post('/signup/verify', async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;
    const record = await Otp.findOne({ email, purpose: 'signup', otp }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, role: 'user' });
    await Otp.deleteMany({ email, purpose: 'signup' });

    const token = signToken(user._id, user.role);
    sendTokenCookie(res, token);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
    const token = signToken(user._id, user.role);
    sendTokenCookie(res, token);
    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out.' });
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Forgot password flow
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email.' });
    const otp = generateOtp();
    await Otp.create({ email, otp, purpose: 'forgot_password', expiresAt: otpExpiry(10) });
    await sendOtpEmail(email, otp, user.username, 'forgot_password');
    res.json({ success: true, message: 'OTP sent to your registered email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email, purpose: 'forgot_password', otp }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    record.verified = true;
    await record.save();
    res.json({ success: true, message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const verifiedOtp = await Otp.findOne({ email, purpose: 'forgot_password', verified: true }).sort({ createdAt: -1 });
    if (!verifiedOtp) return res.status(400).json({ success: false, message: 'OTP not verified. Please verify first.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Otp.deleteMany({ email, purpose: 'forgot_password' });
    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
