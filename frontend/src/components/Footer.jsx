import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand" style={{ color: 'var(--text-title)' }}>
              <div className="emblem">🗳️</div>
              <div className="brand-text">
                <div className="brand-top">Blockchain Secured</div>
                <div className="brand-bottom">SecureVote</div>
              </div>
            </Link>
            <p>
              A tamper-proof, face-verified, blockchain-anchored democratic voting
              platform — built as a transparent, free and open-source civic project.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/election-data">Election Data</Link>
            <Link to="/growth-analysis">Growth Insights</Link>
            <Link to="/results">Official Results</Link>
            <Link to="/audit-trail">Audit Trail</Link>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/signup">Create Account</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Voter Application</Link>
            <Link to="/vote">Cast Vote</Link>
          </div>

          <div className="footer-col">
            <h4>Security</h4>
            <div className="footer-chips">
              <span>🔗 SHA-256 Chain</span>
              <span>🖋️ 2-of-3 Multi-sig</span>
              <span>😀 Face Verification</span>
              <span>🔐 OTP Verified</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SecureVote — MERN Blockchain Voting Platform</span>
          <span>Made with ❤️ for transparent democracy</span>
        </div>
      </div>
    </footer>
  );
}
