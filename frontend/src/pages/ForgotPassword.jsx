import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Alert from '../components/Alert.jsx';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/send-otp', { email });
      if (data.devBypassOtp) {
        setInfo(`OTP sent. [Dev Mode Bypass]: Use OTP code: ${data.devBypassOtp}`);
      } else {
        setInfo('OTP sent to your registered email.');
      }
      setStep('otp');
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify-otp', { email, otp });
      setInfo('OTP verified. Enter your new password.');
      setStep('reset');
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { email, newPassword });
      navigate('/login');
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="card-icon">🔐</div>
        <h2 className="forgot-title">Reset Your Password</h2>
        <Alert type="error">{error}</Alert>
        <Alert type="info">{info}</Alert>

        {step === 'email' && (
          <form onSubmit={sendOtp}>
            <div className="form-group">
              <label className="form-label">Registered Email Address</label>
              <input type="email" className="form-input" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
            </div>
            <button className="btn btn-primary btn-lg" disabled={loading}>Send OTP</button>
          </form>
        )}
        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input className="form-input otp-input" required maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
            </div>
            <button className="btn btn-primary btn-lg" disabled={loading}>Verify OTP</button>
          </form>
        )}
        {step === 'reset' && (
          <form onSubmit={resetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" required value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" required value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <button className="btn btn-primary btn-lg" disabled={loading}>Reset Password</button>
          </form>
        )}
        <p className="login-link"><Link to="/login">← Back to Login</Link></p>
      </div>
    </div>
  );
}
