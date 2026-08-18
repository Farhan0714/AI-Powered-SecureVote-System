import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: '📝',
    title: 'Create your account',
    text: 'Sign up in seconds with an email OTP — no long forms, no friction. Your identity stays protected from day one.'
  },
  {
    icon: '😀',
    title: 'Verify your identity',
    text: 'Submit your voter application with an ID proof and a live face scan. A 2-of-3 multi-sig panel approves it.'
  },
  {
    icon: '🔑',
    title: 'Get your unique code',
    text: 'Once approved, you receive a private 6-character voting code — your key to the ballot box.'
  },
  {
    icon: '🗳️',
    title: 'Cast your vote on-chain',
    text: 'Enter your code and complete a fresh face check. Your vote is anonymously hashed into the blockchain.'
  }
];

const features = [
  {
    icon: '🔗',
    title: 'Tamper-proof blockchain ledger',
    text: 'Every vote becomes a SHA-256 proof-of-work block, chained to the previous one — edit one, and the whole chain breaks.'
  },
  {
    icon: '😀',
    title: 'Face recognition + liveness',
    text: 'Your live face must match your registered descriptor before a vote is accepted. Head-turning liveness blocks static photos.'
  },
  {
    icon: '🖋️',
    title: '2-of-3 multi-signature blocks',
    text: 'No single account can finalize a block. Three independent signers must approve with their own private keys.'
  },
  {
    icon: '🤖',
    title: 'VoteBot — AI assistant',
    text: 'A from-scratch trained Naive-Bayes assistant answers questions about elections, registration, and results — for free.'
  },
  {
    icon: '📖',
    title: 'Public audit trail',
    text: 'Every approval, phase change, and block finalization is appended to an inspectable log. No hidden actions, ever.'
  },
  {
    icon: '📊',
    title: 'Election analytics',
    text: 'Historical vote shares, party manifestos, and AI-generated growth narratives — all in one beautiful dashboard.'
  }
];

export default function Home() {
  return (
    <div className="lp">
      {}
      <section className="lp-hero">
        <div className="lp-hero-badge">
          <span>🔗 Blockchain Secured</span>
          <span>·</span>
          <span>😀 Face Verified</span>
          <span>·</span>
          <span>🤖 AI Powered</span>
        </div>

        <h1 className="lp-hero-title">
          Voting, reimagined for the <span className="grad-text">digital age</span>
        </h1>

        <p className="lp-hero-sub">
          SecureVote makes elections transparent, tamper-proof and accessible —
          combining blockchain integrity, face-recognition verification and an AI
          assistant on one free, open-source platform.
        </p>

        <div className="lp-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">Create Your Account →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>

        <div className="lp-stats">
          <div className="lp-stat">
            <span>SHA-256</span>
            <label>Proof-of-work chain</label>
          </div>
          <div className="lp-stat">
            <span>2-of-3</span>
            <label>Multi-sig block approval</label>
          </div>
          <div className="lp-stat">
            <span>&lt; 0.60</span>
            <label>Face-match threshold</label>
          </div>
          <div className="lp-stat">
            <span>100%</span>
            <label>Audit transparency</label>
          </div>
        </div>
      </section>

      {}
      <section className="lp-section">
        <p className="lp-eyebrow">How it works</p>
        <h2 className="lp-title">Four steps to a verified vote</h2>
        <p className="lp-subtitle">
          From account creation to a blockchain-anchored ballot — every step is
          designed around one idea: <strong>your vote, provably yours</strong>.
        </p>

        <div className="lp-steps">
          {steps.map((s, i) => (
            <div className="lp-step" key={s.title}>
              <div className="lp-step-num">{i + 1}</div>
              <span className="lp-step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="lp-section">
        <p className="lp-eyebrow">Platform</p>
        <h2 className="lp-title">Security you can actually see</h2>
        <p className="lp-subtitle">
          No black boxes. Every security layer is open, inspectable, and
          designed to earn your trust.
        </p>

        <div className="bento">
          {features.map((f, i) => (
            <div className={`bento-card ${i === 0 ? 'feature-highlight' : ''}`} key={f.title}>
              <div className="bento-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {}
      <section className="lp-cta">
        <h2>Ready to make your voice count?</h2>
        <p>
          Join SecureVote today and take part in elections that are transparent
          by design — not by promise.
        </p>
        <div className="lp-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>
    </div>
  );
}
