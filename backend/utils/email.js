const nodemailer = require('nodemailer');
const qrcode = require('qrcode');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Port 587 with STARTTLS is highly compatible with Render/Cloud firewall restrictions
  auth: {
    user: process.env.SMTP_EMAIL || 'securevote363@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'syxutrswhkxgmhlh'
  },
  tls: {
    rejectUnauthorized: false
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
      from: `SecureVote <${process.env.SMTP_EMAIL || 'securevote363@gmail.com'}>`,
      to: toEmail,
      subject: t.subject,
      html
    });
    console.log(`✅ OTP email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send OTP email:', err.message);
    console.log(`💡 [TEST RUN BYPASS] Generated OTP for ${toEmail} is: ${otp}`);
    return true;
  }
}

async function sendApprovalEmail(toEmail, username, uniqueCode, approvedUserId, voterId) {
  const scanUrl = `https://localhost:5173/admin/verify-voter/${approvedUserId}?voterId=${voterId || ''}&code=${uniqueCode}`;
  let qrBuffer = null;
  try {
    qrBuffer = await qrcode.toBuffer(scanUrl, { width: 300, margin: 2 });
  } catch (qrErr) {
    console.error('Failed to generate QR code:', qrErr.message);
  }

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

        ${qrBuffer ? `
        <div style="text-align:center;margin:24px 0;">
          <p style="color:#374151;font-weight:600;margin-bottom:8px;">YOUR VOTER QR CODE (FOR POLLING BOOTHS)</p>
          <img src="cid:voter-qr" alt="Voter QR Code" style="width:200px;height:200px;border:1px solid #e5e7eb;padding:4px;border-radius:8px;" />
          <p style="color:#6b7280;font-size:12px;margin-top:6px;">Scan this at the physical polling station to vote.</p>
        </div>
        ` : ''}

        <p style="color:#92400e;background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:5px;">⚠️ Keep this code and QR code private. You will also be asked to verify your face via webcam when you vote. This code can only be used once.</p>
      </div>
    </div>
  </div>`;

  const attachments = qrBuffer ? [{
    filename: 'voter-qr.png',
    content: qrBuffer,
    cid: 'voter-qr'
  }] : [];

  try {
    await transporter.sendMail({
      from: `SecureVote <${process.env.SMTP_EMAIL || 'securevote363@gmail.com'}>`,
      to: toEmail,
      subject: 'You are Approved to Vote - SecureVote',
      html,
      attachments
    });
    console.log(`✅ Approval email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send approval email:', err.message);
    console.log(`💡 [TEST RUN BYPASS] Approved unique voting code for ${username} (${toEmail}) is: ${uniqueCode}`);
    return true;
  }
}

async function sendCorrectionApprovalEmail(toEmail, username) {
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1);">
      <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🗳️ SecureVote</h1>
        <p style="color:rgba(255,255,255,.9);margin:8px 0 0;">Correction request approved!</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1e40af;margin-top:0;">Voter Details Updated</h2>
        <p style="color:#374151;">Hello <strong>${username}</strong>,</p>
        <p style="color:#374151;">Your request to correct/update your voter registration details has been reviewed and approved. Your voter record has been updated successfully.</p>
        <p style="color:#374151;">You can view your updated details on your Dashboard.</p>
      </div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `SecureVote <${process.env.SMTP_EMAIL || 'securevote363@gmail.com'}>`,
      to: toEmail,
      subject: 'Voter Details Updated - SecureVote',
      html
    });
    console.log(`✅ Correction approval email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send correction approval email:', err.message);
    return true;
  }
}

async function sendDeletionApprovalEmail(toEmail, username) {
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1);">
      <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🗳️ SecureVote</h1>
        <p style="color:rgba(255,255,255,.9);margin:8px 0 0;">Voter record deleted</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#dc2626;margin-top:0;">Voter Registration Deletion Approved</h2>
        <p style="color:#374151;">Hello <strong>${username}</strong>,</p>
        <p style="color:#374151;">Your request to delete your voter registration has been approved. Your voter record (including your face profile) has been completely removed from our platform database.</p>
        <p style="color:#374151;">If you wish to register again in the future, you will need to submit a new voter application.</p>
      </div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `SecureVote <${process.env.SMTP_EMAIL || 'securevote363@gmail.com'}>`,
      to: toEmail,
      subject: 'Voter Record Deleted - SecureVote',
      html
    });
    console.log(`✅ Deletion approval email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send deletion approval email:', err.message);
    return true;
  }
}

async function sendRejectionEmail(toEmail, username, comment, type) {
  const typeText = type === 'correction' ? 'correction request' : type === 'deletion' ? 'deletion request' : 'voter registration';
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.1);">
      <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🗳️ SecureVote</h1>
        <p style="color:rgba(255,255,255,.9);margin:8px 0 0;">Application Rejected</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#dc2626;margin-top:0;">Your application has been rejected</h2>
        <p style="color:#374151;">Hello <strong>${username}</strong>,</p>
        <p style="color:#374151;">Your recent <strong>${typeText}</strong> was reviewed by the administrator and unfortunately could not be approved at this time.</p>
        ${comment ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:18px 0;color:#991b1b;border-radius:5px;"><strong>Reason/Note:</strong> ${comment}</div>` : ''}
        <p style="color:#374151;">You may correct and resubmit your application via your Dashboard.</p>
      </div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `SecureVote <${process.env.SMTP_EMAIL || 'securevote363@gmail.com'}>`,
      to: toEmail,
      subject: `Application Update: Rejected - SecureVote`,
      html
    });
    console.log(`✅ Rejection email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send rejection email:', err.message);
    return true;
  }
}

module.exports = { 
  sendOtpEmail, 
  sendApprovalEmail, 
  sendCorrectionApprovalEmail, 
  sendDeletionApprovalEmail, 
  sendRejectionEmail 
};
