import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';

export default function AuditTrail() {
  const { user } = useAuth();
  const [chain, setChain] = useState([]);
  const [logs, setLogs] = useState([]);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/chain').then(({ data }) => setChain(data.chain)).catch(() => {});
    if (user?.role !== 'user') {
      api.get('/public/audit-log').then(({ data }) => setLogs(data.logs)).catch(() => {});
    }
  }, [user]);

  const verifyBlockchain = async () => {
    setVerifyLoading(true);
    setError('');
    try {
      const { data } = await api.get('/public/chain/verify');
      setVerifyResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>🔗 Blockchain Audit & Verification</h1>
        <p style={{ color: 'var(--gray-500)', margin: 0 }}>
          Examine block hashes and verify the cryptographic integrity of the SecureVote ledger.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'user' ? '1fr' : '1fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {}
        <div className="card">
          <h3>🔍 Cryptographic Ledger Audit</h3>
          <p className="section-note" style={{ background: '#f8fafc', padding: 'var(--space-4)', borderLeft: '4px solid var(--primary-500)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
            Verify that vote transactions have not been modified. Clicking the audit scanner below executes a complete block-by-block hash verification.
          </p>

          {error && <Alert type="error">{error}</Alert>}

          {verifyResult && (
            <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)', border: '1px solid var(--gray-200)', marginTop: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)', paddingBottom: 'var(--space-3)' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: verifyResult.valid ? 'var(--success)' : 'var(--error)',
                  boxShadow: verifyResult.valid ? '0 0 10px var(--success)' : '0 0 10px var(--error)'
                }} />
                <strong style={{ fontSize: '1.0625rem', color: verifyResult.valid ? 'var(--success)' : 'var(--error)' }}>
                  {verifyResult.valid ? 'INTEGRITY VERIFIED — LEDGER SECURE' : 'TAMPER DETECTED — LEDGER INCONSISTENT'}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, display: 'block' }}>Total Blocks</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)' }}>{verifyResult.totalBlocks} Blocks</span>
                </div>
                <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, display: 'block' }}>Verified Votes</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)' }}>{verifyResult.totalVotes} Votes</span>
                </div>
                <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, display: 'block' }}>Pending Queue</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)' }}>{verifyResult.pendingVotesQueued} votes</span>
                </div>
              </div>
            </div>
          )}

          <button className="btn btn-primary w-full mt-4" onClick={verifyBlockchain} disabled={verifyLoading}>
            {verifyLoading ? 'Auditing Ledger...' : '🔍 Scan & Verify Ledger Integrity'}
          </button>
        </div>

        {}
        <div className="card">
          <h3>🧱 Finalized Block Metadata</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
            List of cryptographic blocks. To preserve secrecy of the ballot, all actual transaction data is fully anonymized.
          </p>
          {chain.length === 0 ? (
            <p style={{ color: 'var(--gray-400)' }}>No finalized blocks yet.</p>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table">
                <thead><tr><th>Index</th><th>Type</th><th>Hash</th><th>Time</th></tr></thead>
                <tbody>
                  {chain.slice().reverse().map(b => (
                    <tr key={b.index}>
                      <td style={{ fontWeight: 700 }}>#{b.index}</td>
                      <td>
                        <span className="status-badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', textTransform: 'capitalize', fontSize: '0.75rem' }}>
                          {b.txType}
                        </span>
                      </td>
                      <td className="block-hash" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{b.hash.slice(0, 16)}...</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{new Date(b.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {}
      {user?.role !== 'user' && (
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <h3>📋 Administrative Action Logs</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
            Audit trail of admin and verifier system actions. Excluded from standard voter view.
          </p>
          {logs.length === 0 ? (
            <p style={{ color: 'var(--gray-400)' }}>No actions logged yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Actor</th><th>Role</th><th>Action</th><th>Time</th></tr></thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l._id}>
                      <td style={{ fontWeight: 600 }}>{l.actorUsername}</td>
                      <td><span className="status-badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>{l.actorRole}</span></td>
                      <td style={{ fontWeight: 500 }}>{l.action.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
