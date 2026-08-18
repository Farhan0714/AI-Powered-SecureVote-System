import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [registration, setRegistration] = useState(null);
  const [approvedUser, setApprovedUser] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [chain, setChain] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = () => {
    api.get('/registration/mine').then(({ data }) => {
      setRegistration(data.registration);
      setApprovedUser(data.approvedUser);
    }).catch(() => {});
    api.get('/vote/status').then(({ data }) => setVoteStatus(data)).catch(() => {});
    api.get('/public/chain').then(({ data }) => setChain(data.chain)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>Welcome, {user?.username}</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem', margin: 0 }}>
          {user?.email} &middot; Voter Account Dashboard
        </p>
      </div>

      <div className="dashboard-grid-advanced" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>

        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {}
          <div className="card">
            <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-3)' }}>📝</div>
            <h3>Voter Registration</h3>

            {error && <div className="alert alert-error" style={{ margin: 'var(--space-2) 0' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ margin: 'var(--space-2) 0' }}>{success}</div>}

            {registration && registration.status === 'pending' ? (
              <div>
                <p style={{ marginBottom: 'var(--space-3)' }}>
                  Status: <span className="status-badge status-pending">Pending Review</span>
                </p>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ marginBottom: 'var(--space-1)' }}>
                    <strong>Application Type:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{registration.type === 'new' ? 'New Registration' : registration.type}</span>
                  </div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Name:</strong> {registration.name}</div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Voter ID:</strong> {registration.voterId}</div>
                  {registration.type === 'deletion' && (
                    <div style={{ marginBottom: 'var(--space-1)' }}><strong>Reason for Deletion:</strong> {registration.reasonForDeletion}</div>
                  )}
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 'var(--space-3)' }}>
                  Your {registration.type} application is under review. You'll be notified by email once the admin approves it.
                </p>
              </div>
            ) : approvedUser ? (
              <div>
                <p style={{ marginBottom: 'var(--space-3)' }}>
                  Status: <span className="status-badge status-approved">Approved Voter</span>
                </p>

                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Name:</strong> {approvedUser.name}</div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Voter ID:</strong> {approvedUser.voterId}</div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Age:</strong> {approvedUser.age}</div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Phone:</strong> {approvedUser.phone}</div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Address:</strong> {approvedUser.address}</div>
                </div>

                {registration && registration.status === 'rejected' && registration.adminComment && (
                  <div style={{ background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', borderLeft: '3px solid var(--error)' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--error)', margin: 0 }}>
                      <strong>Latest request was rejected:</strong> {registration.adminComment}
                    </p>
                  </div>
                )}

                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <Link to="/correct" className="btn btn-secondary btn-sm">
                    ✏️ Correct Voter Details
                  </Link>
                  <Link to="/delete" className="btn btn-danger btn-sm" style={{ background: 'var(--error-50)', color: 'var(--error-700)', border: '1px solid var(--error-200)' }}>
                    ❌ Request Deletion
                  </Link>
                </div>
              </div>
            ) : registration && registration.status === 'rejected' ? (
              <div>
                <p style={{ marginBottom: 'var(--space-3)' }}>
                  Status: <span className="status-badge status-rejected">Rejected</span>
                </p>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Name:</strong> {registration.name}</div>
                  <div style={{ marginBottom: 'var(--space-1)' }}><strong>Voter ID:</strong> {registration.voterId}</div>
                </div>
                {registration.adminComment && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
                    <strong>Admin note:</strong> {registration.adminComment}
                  </p>
                )}
                <Link to="/register" className="btn btn-primary">Apply to Vote Again</Link>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>
                  You haven't submitted your voter registration yet.
                </p>
                <Link to="/register" className="btn btn-primary">Apply to Vote</Link>
              </div>
            )}
          </div>

          {}
          <div className="card">
            <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-3)' }}>🗳️</div>
            <h3>Voting Status</h3>
            {voteStatus ? (
              <div>
                <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: '0.8125rem' }}><strong>Approved:</strong> {voteStatus.isApprovedVoter ? '✅ Yes' : '❌ No'}</div>
                  <div style={{ fontSize: '0.8125rem' }}><strong>Active:</strong> {voteStatus.votingActive ? '✅ Yes' : '❌ No'}</div>
                  <div style={{ fontSize: '0.8125rem' }}><strong>Voted:</strong> {voteStatus.hasVoted ? '✅ Yes' : '❌ No'}</div>
                </div>

                {voteStatus.isApprovedVoter && voteStatus.uniqueCode && !voteStatus.hasVoted && (
                  <div className="unique-code-box" style={{ background: 'var(--primary-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)', border: '1.5px dashed var(--primary-300)' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary-700)', marginBottom: 'var(--space-1)', textAlign: 'center' }}>
                      Your Unique Voting Code
                    </p>
                    <div className="unique-code" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '4px', textAlign: 'center', color: 'var(--primary-900)' }}>{voteStatus.uniqueCode}</div>
                    <p className="unique-code-hint" style={{ fontSize: '0.75rem', color: 'var(--gray-400)', margin: '4px 0 0', textAlign: 'center' }}>Keep this private — needed along with face scan to cast your vote</p>
                  </div>
                )}

                {voteStatus.isApprovedVoter && !voteStatus.hasVoted && voteStatus.votingActive && (
                  <Link to="/vote" className="btn btn-success w-full text-center" style={{ display: 'block' }}>Cast Your Vote</Link>
                )}
                {voteStatus.isApprovedVoter && !voteStatus.hasVoted && !voteStatus.votingActive && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: 0 }}>
                    Voting is not currently active. Check back during the voting window.
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--gray-400)' }}>Loading...</p>
            )}
          </div>

          {}
          <div className="card">
            <div style={{ fontSize: '1.75rem', marginBottom: 'var(--space-3)' }}>📊</div>
            <h3>Election Resources</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
              Explore historical election data, party manifestos, AI-powered growth insights, and official results.
            </p>
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <Link to="/election-data" className="btn btn-secondary btn-sm">Election Data</Link>
              <Link to="/results" className="btn btn-secondary btn-sm">Official Results</Link>
              <Link to="/audit-trail" className="btn btn-secondary btn-sm">Audit Trail</Link>
            </div>
          </div>
        </div>

        {}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-4)' }}>

            <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center', background: 'var(--navbar-bg)', color: '#fff', border: 'none' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>🛡️</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, display: 'block', fontWeight: 600 }}>Security</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', display: 'block' }}>Ledger Secured</span>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>👥</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', display: 'block', fontWeight: 600 }}>Registered</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', display: 'block', color: 'var(--text-title)' }}>100% Secure</span>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>🏁</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', display: 'block', fontWeight: 600 }}>Elections</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', display: 'block', color: 'var(--text-title)' }}>1 Active</span>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}>⏳</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', display: 'block', fontWeight: 600 }}>Avg. Block</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', display: 'block', color: 'var(--text-title)' }}>Instant</span>
            </div>
          </div>

          {}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0 }}>⛓️ Live Ledger Blocks</h3>
              <span className="status-badge status-approved" style={{ fontSize: '0.6875rem' }}>Synchronized</span>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', marginBottom: 'var(--space-4)' }}>
              Audit the latest blocks generated and validated by decentralised voting nodes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {chain.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>No finalized blocks yet.</p>
              ) : (
                chain.slice(-3).reverse().map((block) => (
                  <div key={block.index} style={{
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--text-title)' }}>Block #{block.index}</strong>
                      <span className="status-badge status-approved" style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                        Verified
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      Hash: {block.hash}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      Timestamp: {new Date(block.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
