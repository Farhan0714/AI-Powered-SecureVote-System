import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  const links = user ? (
    user.role === 'admin' ? (
      <>
        <Link to="/admin" className="nav-link" onClick={closeMobile}>Applications</Link>
        <Link to="/admin/voting-phase" className="nav-link" onClick={closeMobile}>Voting Phase</Link>
        <Link to="/admin/publish-results" className="nav-link" onClick={closeMobile}>Publish Results</Link>
        <Link to="/admin/blockchain" className="nav-link" onClick={closeMobile}>Verify Blockchain</Link>
        <Link to="/block-signing" className="nav-link" onClick={closeMobile}>Block Signing</Link>
        <Link to="/audit-trail" className="nav-link" onClick={closeMobile}>Audit Trail</Link>
        <button onClick={handleLogout} className="nav-link nav-ghost">Logout</button>
      </>
    ) : user.role === 'verifier' ? (
      <>
        <Link to="/verifier" className="nav-link" onClick={closeMobile}>Verifier Home</Link>
        <Link to="/block-signing" className="nav-link" onClick={closeMobile}>Block Signing</Link>
        <Link to="/audit-trail" className="nav-link" onClick={closeMobile}>Audit Trail</Link>
        <button onClick={handleLogout} className="nav-link nav-ghost">Logout</button>
      </>
    ) : (
      <>
        <Link to="/dashboard" className="nav-link" onClick={closeMobile}>Dashboard</Link>
        <Link to="/register" className="nav-link" onClick={closeMobile}>Application</Link>
        <Link to="/vote" className="nav-link" onClick={closeMobile}>Vote</Link>
        <Link to="/election-data" className="nav-link" onClick={closeMobile}>Election Data</Link>
        <Link to="/results" className="nav-link" onClick={closeMobile}>Results</Link>
        <button onClick={handleLogout} className="nav-link nav-ghost">Logout</button>
      </>
    )
  ) : (
    <>
      <Link to="/" className="nav-link" onClick={closeMobile}>Home</Link>
      <Link to="/login" className="nav-link nav-ghost" onClick={closeMobile}>Sign In</Link>
      <Link to="/signup" className="nav-link nav-cta" onClick={closeMobile}>Get Started</Link>
    </>
  );

  return (
    <header className="gov-header">
      <div className="header-inner">
        <Link to="/" className="brand" onClick={closeMobile}>
          <div className="emblem">🗳️</div>
          <div className="brand-text">
            <div className="brand-top">Blockchain Secured</div>
            <div className="brand-bottom">SecureVote</div>
          </div>
        </Link>

        <button
          type="button"
          className={`nav-toggle ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          {links}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Toggle Light/Dark Theme"
            aria-label="Toggle light or dark theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </nav>
      </div>
    </header>
  );
}
