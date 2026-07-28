import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-badge"><span>🔗</span> Blockchain Secured</div>
        <h1 className="hero-title">The Future of <span className="highlight-text">Democratic Voting</span></h1>
        <p className="hero-description">
          Experience secure, transparent, and tamper-proof elections powered by blockchain technology and
          an AI assistant that helps you understand elections, past results, and party manifestos.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">✨ Get Started</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">🔐 Login</Link>
        </div>
        <div className="hero-features">
          <div className="feature-chip">🤖 AI Election Chatbot</div>
          <div className="feature-chip">📊 Historical Results & Manifestos</div>
          <div className="feature-chip">📈 AI Growth Evaluation</div>
          <div className="feature-chip">🔗 Blockchain-Verified Votes</div>
        </div>
      </div>
    </div>
  );
}
