import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="gov-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <div className="emblem">🗳️</div>
          <div className="brand-text">
            <div className="brand-top">Blockchain Secured</div>
            <div className="brand-bottom">SecureVote Platform</div>
          </div>
        </Link>
        <nav className="nav-links">
          {user ? (
            user.role === 'admin' ? (
              <>
                <Link to="/admin" className="nav-link">📋 Applications</Link>
                <Link to="/admin/voting-phase" className="nav-link">⏱️ Voting Phase</Link>
                <Link to="/admin/publish-results" className="nav-link">📢 Publish Results</Link>
                <Link to="/admin/blockchain" className="nav-link">🔗 Verify Blockchain</Link>
                <Link to="/block-signing" className="nav-link">🖋️ Block Signing</Link>
                <Link to="/audit-trail" className="nav-link">🔍 Audit Trail</Link>
                <button onClick={handleLogout} className="nav-link nav-link-btn">👋 Logout</button>
              </>
            ) : user.role === 'verifier' ? (
              <>
                <Link to="/verifier" className="nav-link">🖋️ Verifier Home</Link>
                <Link to="/block-signing" className="nav-link">🖋️ Block Signing</Link>
                <Link to="/audit-trail" className="nav-link">🔍 Audit Trail</Link>
                <button onClick={handleLogout} className="nav-link nav-link-btn">👋 Logout</button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="nav-link">🏠 Dashboard</Link>
                <Link to="/register" className="nav-link">📝 Application</Link>
                <Link to="/vote" className="nav-link">🗳️ Vote</Link>
                <Link to="/election-data" className="nav-link">📈 Election Data</Link>
                <Link to="/growth-analysis" className="nav-link">🤖 AI Growth Insights</Link>
                <Link to="/results" className="nav-link">📊 Results</Link>
                <Link to="/audit-trail" className="nav-link">🔍 Audit Trail</Link>
                <button onClick={handleLogout} className="nav-link nav-link-btn">👋 Logout</button>
              </>
            )
          ) : (
            <>
              <Link to="/" className="nav-link">🏠 Home</Link>
              <Link to="/login" className="nav-link">🔐 Login</Link>
              <Link to="/signup" className="nav-link">✨ Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
