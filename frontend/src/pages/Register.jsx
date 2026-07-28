import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import FaceCapture from '../components/FaceCapture.jsx';

function dataUrlToFile(dataUrl, filename) {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', address: '', phone: '',
    age: '', voterId: '', regEmail: user?.email || ''
  });
  const [faceCapture, setFaceCapture] = useState(null); // { descriptor, image }
  const [identityProof, setIdentityProof] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setError(''); setLoading(true);
    try {
      await api.post('/registration/request-otp', { email: form.regEmail });
      setOtpSent(true);
      setInfo('OTP sent to your email.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP.'); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpSent) return setError('Please request and verify OTP first.');
    if (!faceCapture) return setError('Please capture your face before submitting — it will be used to verify you at voting time.');
    if (!faceCapture.livenessVerified) return setError('Liveness check not confirmed. Please retake your face scan and turn your head as prompted.');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('otp', otp);
      fd.append('faceDescriptor', JSON.stringify(faceCapture.descriptor));
      fd.append('livenessVerified', 'true');
      fd.append('livePhoto', dataUrlToFile(faceCapture.image, 'face.jpg'));
      if (identityProof) fd.append('identityProof', identityProof);

      await api.post('/registration/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/submitted');
    } catch (err) { setError(err.response?.data?.message || 'Submission failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card">
      <h2>📝 Voter Registration</h2>
      <Alert type="error">{error}</Alert>
      <Alert type="info">{info}</Alert>
      <form onSubmit={submit} className="registration-form">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Father's Name *</label>
            <input className="form-input" required value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Mother's Name *</label>
            <input className="form-input" required value={form.motherName} onChange={e => setForm({ ...form, motherName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Age *</label>
            <input type="number" min="18" className="form-input" required value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Voter ID *</label>
            <input className="form-input" required value={form.voterId} onChange={e => setForm({ ...form, voterId: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address *</label>
          <textarea className="form-textarea" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Registration Email *</label>
          <input type="email" className="form-input" required value={form.regEmail} onChange={e => setForm({ ...form, regEmail: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Identity Proof *</label>
          <input type="file" accept="image/*,.pdf" required onChange={e => setIdentityProof(e.target.files[0])} />
        </div>

        <div className="form-group">
          <FaceCapture label="Capture Your Face *  (this will be used to verify you when you vote)" onCapture={setFaceCapture} />
        </div>

        {!otpSent ? (
          <button type="button" className="btn btn-secondary" onClick={requestOtp} disabled={loading || !form.regEmail}>
            📱 Send OTP to Verify Email
          </button>
        ) : (
          <div className="form-group">
            <label className="form-label">Enter OTP *</label>
            <input className="form-input otp-input" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg mt-8" disabled={loading || !otpSent}>
          {loading ? '⏳ Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
}
