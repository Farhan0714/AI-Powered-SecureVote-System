import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup/request-otp', form);
      if (data.devBypassOtp) {
        setInfo(`OTP sent to email. [Dev Mode Bypass]: Use OTP code: ${data.devBypassOtp}`);
      } else {
        setInfo('OTP sent to your email. Check your inbox.');
      }
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup/verify', { ...form, otp });
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">✨</div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join SecureVote to participate in secure elections</p>
        </div>
        <Alert type="error">{error}</Alert>
        <Alert type="info">{info}</Alert>

        {step === 'form' && (
          <form onSubmit={requestOtp}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" required value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Choose a unique username" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-input" required value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input className="form-input otp-input" required maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>
        )}

        <p className="login-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
