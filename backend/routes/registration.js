const express = require('express');
const multer = require('multer');
const router = express.Router();

const Registration = require('../models/Registration');
const Otp = require('../models/Otp');
const { generateOtp, otpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Request OTP before submitting voter registration
router.post('/request-otp', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOtp();
    await Otp.create({ email, otp, purpose: 'registration', expiresAt: otpExpiry(10) });
    await sendOtpEmail(email, otp, req.user.username, 'registration');
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/submit', protect, upload.fields([
  { name: 'livePhoto', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, fatherName, motherName, address, phone, age, voterId, regEmail, otp, faceDescriptor, livenessVerified } = req.body;

    const record = await Otp.findOne({ email: regEmail, purpose: 'registration', otp }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    const existing = await Registration.findOne({ account: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted a registration.' });
    }

    if (livenessVerified !== 'true' && livenessVerified !== true) {
      return res.status(400).json({ success: false, message: 'Liveness check (head-turn) was not confirmed. Please retake your face scan.' });
    }

    let parsedDescriptor;
    if (faceDescriptor) {
      try {
        parsedDescriptor = JSON.parse(faceDescriptor);
        if (!Array.isArray(parsedDescriptor) || parsedDescriptor.length !== 128) {
          throw new Error('bad shape');
        }
      } catch {
        return res.status(400).json({ success: false, message: 'Face capture failed. Please retake your face scan and try again.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Face capture is required for registration.' });
    }

    const registration = await Registration.create({
      account: req.user._id,
      name, fatherName, motherName, address, phone, age, voterId, regEmail,
      faceDescriptor: parsedDescriptor,
      livenessVerified: true,
      livePhoto: req.files?.livePhoto?.[0]
        ? { data: req.files.livePhoto[0].buffer, contentType: req.files.livePhoto[0].mimetype }
        : undefined,
      identityProof: req.files?.identityProof?.[0]
        ? { data: req.files.identityProof[0].buffer, contentType: req.files.identityProof[0].mimetype }
        : undefined
    });
    await Otp.deleteMany({ email: regEmail, purpose: 'registration' });

    res.status(201).json({ success: true, message: 'Registration submitted for admin approval.', registrationId: registration._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const registration = await Registration.findOne({ account: req.user._id }).select('-livePhoto -identityProof');
    res.json({ success: true, registration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
