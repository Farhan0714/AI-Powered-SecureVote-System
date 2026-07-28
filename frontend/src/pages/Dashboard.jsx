import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [registration, setRegistration] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);

  useEffect(() => {
    api.get('/registration/mine').then(({ data }) => setRegistration(data.registration)).catch(() => {});
    api.get('/vote/status').then(({ data }) => setVoteStatus(data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Welcome, {user?.username} 👋</h1>
      <div className="dashboard-grid">
        <div className="card">
          <h3>📝 Voter Registration</h3>
          {registration ? (
            <p>Status: <span className={`status-badge status-${registration.status}`}>{registration.status}</span></p>
          ) : (
            <p>You haven't submitted your voter registration yet.</p>
          )}
          {!registration && <Link to="/register" className="btn btn-primary">Register Now</Link>}
        </div>

        <div className="card">
          <h3>🗳️ Voting Status</h3>
          {voteStatus ? (
            <>
              <p>Approved Voter: {voteStatus.isApprovedVoter ? '✅ Yes' : '❌ Not yet'}</p>
              <p>Voting Window Active: {voteStatus.votingActive ? '✅ Yes' : '❌ No'}</p>
              <p>Has Voted: {voteStatus.hasVoted ? '✅ Yes' : '❌ No'}</p>
              {voteStatus.isApprovedVoter && voteStatus.uniqueCode && !voteStatus.hasVoted && (
                <div className="unique-code-box">
                  <p className="form-label">Your Unique Voting Code (also emailed to you)</p>
                  <div className="unique-code">{voteStatus.uniqueCode}</div>
                  <p className="unique-code-hint">Keep this private — you'll need it, plus a live face scan, to vote.</p>
                </div>
              )}
              {voteStatus.isApprovedVoter && !voteStatus.hasVoted && (
                <Link to="/vote" className="btn btn-success">Cast Your Vote</Link>
              )}
            </>
          ) : <p>Loading...</p>}
        </div>

        <div className="card">
          <h3>📈 Explore</h3>
          <p>Check historical results, manifestos, AI-powered growth insights, and official election results.</p>
          <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/election-data" className="btn btn-secondary btn-sm">Election Data</Link>
            <Link to="/growth-analysis" className="btn btn-secondary btn-sm">AI Growth Insights</Link>
            <Link to="/results" className="btn btn-secondary btn-sm">Official Results</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
