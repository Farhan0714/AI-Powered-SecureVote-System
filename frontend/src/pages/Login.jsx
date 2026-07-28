import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login(form.username, form.password);
      const home = user.role === 'admin' ? '/admin' : user.role === 'verifier' ? '/verifier' : '/dashboard';
      navigate(home);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your secure voting dashboard</p>
        </div>
        <Alert type="error">{error}</Alert>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" required value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Enter your username" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" />
          </div>
          <div className="form-options">
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? '⏳ Signing in...' : 'Sign In'}
          </button>
          <div className="auth-alternative">
            <p>Don't have an account?</p>
            <Link to="/signup" className="btn btn-secondary btn-lg">✨ Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
