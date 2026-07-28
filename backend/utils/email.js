const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const PURPOSE_TEXT = {
  signup: { subject: 'Signup Verification OTP - SecureVote', title: 'Signup Verification', desc: 'Use the OTP below to verify your email and finish creating your account.' },
  registration: { subject: 'Registration Verification OTP - SecureVote', title: 'Registration Verification', desc: 'Use the OTP below to verify your email for voter registration.' },
  voting: { subject: 'Voting Verification OTP - SecureVote', title: 'Voting Verification', desc: 'You are about to cast your vote. Use the OTP below to verify your identity.' },
  forgot_password: { subject: 'Password Reset OTP - SecureVote', title: 'Password Reset Request', desc: 'Use the OTP below to reset your password.' }
};

async function sendOtpEmail(toEmail, otp, username = 'User', purpose = 'signup') {
  const t = PURPOSE_TEXT[purpose] || PURPOSE_TEXT.signup;
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1);">
      <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🗳️ SecureVote</h1>
        <p style="color:rgba(255,255,255,.9);margin:8px 0 0;">MERN Blockchain Voting Platform</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1e40af;margin-top:0;">${t.title}</h2>
        <p style="color:#374151;">Hello <strong>${username}</strong>,</p>
        <p style="color:#374151;">${t.desc}</p>
        <div style="background:#eff6ff;padding:24px;border-radius:10px;text-align:center;margin:24px 0;border:2px dashed #3b82f6;">
          <p style="margin:0 0 8px;color:#1e40af;font-weight:600;">YOUR OTP CODE</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#1e40af;font-family:'Courier New',monospace;">${otp}</div>
        </div>
        <p style="color:#92400e;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:5px;">⏰ This OTP expires in 10 minutes.</p>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `SecureVote <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
      subject: t.subject,
      html
    });
    console.log(`✅ OTP email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err.message);
    return false;
  }
}

async function sendApprovalEmail(toEmail, username, uniqueCode) {
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1);">
      <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🗳️ SecureVote</h1>
        <p style="color:rgba(255,255,255,.9);margin:8px 0 0;">Your registration has been approved!</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1e40af;margin-top:0;">You're Approved to Vote</h2>
        <p style="color:#374151;">Hello <strong>${username}</strong>,</p>
        <p style="color:#374151;">Your voter registration has been reviewed and approved. You will need the unique code below, together with a live face verification, to cast your vote.</p>
        <div style="background:#eff6ff;padding:24px;border-radius:10px;text-align:center;margin:24px 0;border:2px dashed #3b82f6;">
          <p style="margin:0 0 8px;color:#1e40af;font-weight:600;">YOUR UNIQUE VOTING CODE</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e40af;font-family:'Courier New',monospace;">${uniqueCode}</div>
        </div>
        <p style="color:#92400e;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:5px;">⚠️ Keep this code private. You will also be asked to verify your face via webcam when you vote. This code can only be used once.</p>
      </div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `SecureVote <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
      subject: 'You are Approved to Vote - SecureVote',
      html
    });
    console.log(`✅ Approval email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send approval email:', err.message);
    return false;
  }
}

module.exports = { sendOtpEmail, sendApprovalEmail };
