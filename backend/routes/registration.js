const express = require('express');
const multer = require('multer');
const router = express.Router();

const Registration = require('../models/Registration');
const Otp = require('../models/Otp');
const { generateOtp, otpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/request-otp', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOtp();
    await Otp.create({ email, otp, purpose: 'registration', expiresAt: otpExpiry(10) });
    await sendOtpEmail(email, otp, req.user.username, 'registration');
    res.json({ success: true, message: 'OTP sent to your email.', devBypassOtp: otp });
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

    const ApprovedUser = require('../models/ApprovedUser');

    const voterIdTrimmed = voterId ? voterId.trim() : '';
    const existingApprovedVoterId = await ApprovedUser.findOne({ voterId: voterIdTrimmed });
    if (existingApprovedVoterId) {
      return res.status(400).json({ success: false, message: 'This Voter ID is already registered to an approved voter.' });
    }

    const existingPendingVoterId = await Registration.findOne({ voterId: voterIdTrimmed, status: 'pending' });
    if (existingPendingVoterId) {
      return res.status(400).json({ success: false, message: 'An application with this Voter ID is already pending review.' });
    }

    const existingPending = await Registration.findOne({ account: req.user._id, status: 'pending' });
    if (existingPending) {
      return res.status(409).json({ success: false, message: `You already have a pending ${existingPending.type} application.` });
    }

    const existingApproved = await ApprovedUser.findOne({ account: req.user._id });
    if (existingApproved) {
      return res.status(409).json({ success: false, message: 'You are already an approved voter. Use the Correction form to request updates.' });
    }

    if (livenessVerified !== 'true' && livenessVerified !== true) {
      return res.status(400).json({ success: false, message: 'Liveness check (blinking) was not confirmed. Please retake your face scan.' });
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
      type: 'new',
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
    const registration = await Registration.findOne({ account: req.user._id }).sort({ createdAt: -1 }).select('-livePhoto -identityProof');
    const ApprovedUser = require('../models/ApprovedUser');
    const approvedUser = await ApprovedUser.findOne({ account: req.user._id }).select('-livePhoto');
    res.json({ success: true, registration, approvedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/correct', protect, upload.fields([
  { name: 'livePhoto', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, fatherName, motherName, address, phone, age, voterId, regEmail, otp, faceDescriptor, livenessVerified } = req.body;

    const record = await Otp.findOne({ email: regEmail, purpose: 'registration', otp }).sort({ createdAt: -1 });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });

    const ApprovedUser = require('../models/ApprovedUser');
    const approved = await ApprovedUser.findOne({ account: req.user._id });
    if (!approved) {
      return res.status(400).json({ success: false, message: 'You must be an approved voter to request corrections.' });
    }

    const pending = await Registration.findOne({ account: req.user._id, status: 'pending' });
    if (pending) {
      return res.status(409).json({ success: false, message: `You already have a pending ${pending.type} application.` });
    }

    const voterIdTrimmed = voterId ? voterId.trim() : '';

    const existingApprovedVoterId = await ApprovedUser.findOne({ voterId: voterIdTrimmed, account: { $ne: req.user._id } });
    if (existingApprovedVoterId) {
      return res.status(400).json({ success: false, message: 'This Voter ID is already registered to another approved voter.' });
    }

    const existingPendingVoterId = await Registration.findOne({ voterId: voterIdTrimmed, status: 'pending', account: { $ne: req.user._id } });
    if (existingPendingVoterId) {
      return res.status(400).json({ success: false, message: 'An application with this Voter ID is already pending review.' });
    }

    if (livenessVerified !== 'true' && livenessVerified !== true) {
      return res.status(400).json({ success: false, message: 'Liveness check (blinking) was not confirmed. Please retake your face scan.' });
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
      return res.status(400).json({ success: false, message: 'Face capture is required.' });
    }

    const registration = await Registration.create({
      account: req.user._id,
      name, fatherName, motherName, address, phone, age, voterId, regEmail,
      type: 'correction',
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

    res.status(201).json({ success: true, message: 'Correction request submitted for admin review.', registrationId: registration._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/delete', protect, async (req, res) => {
  try {
    const { reasonForDeletion, reasonDetails } = req.body;
    if (!reasonForDeletion) {
      return res.status(400).json({ success: false, message: 'Reason for deletion is required.' });
    }

    const ApprovedUser = require('../models/ApprovedUser');
    const approved = await ApprovedUser.findOne({ account: req.user._id });
    if (!approved) {
      return res.status(400).json({ success: false, message: 'You must be an approved voter to request deletion.' });
    }

    const pending = await Registration.findOne({ account: req.user._id, status: 'pending' });
    if (pending) {
      return res.status(409).json({ success: false, message: `You already have a pending ${pending.type} application.` });
    }

    const registration = await Registration.create({
      account: req.user._id,
      name: approved.name,
      fatherName: approved.fatherName,
      motherName: approved.motherName,
      address: approved.address,
      phone: approved.phone,
      age: approved.age,
      voterId: approved.voterId,
      regEmail: req.user.email,
      type: 'deletion',
      reasonForDeletion: `${reasonForDeletion}${reasonDetails ? `: ${reasonDetails}` : ''}`,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Deletion request submitted for admin review.', registrationId: registration._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
