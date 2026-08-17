import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';

export default function AdminVerifyBlockchain() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.get('/admin/blockchain/verify');
      setResult(data);
    } catch (err) { setError(err.response?.data?.message || 'Verification failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Link to="/admin" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 'var(--space-4)', display: 'inline-block', textDecoration: 'none' }}>← Back to Dashboard</Link>
      
      <div className="card" style={{ maxWidth: '640px', padding: 'var(--space-6) var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: '2.25rem' }}>🔗</span>
          <h2 style={{ margin: 0 }}>Blockchain Integrity Ledger</h2>
        </div>
        <p className="section-note" style={{ background: '#f8fafc', padding: 'var(--space-4)', borderLeft: '4px solid var(--primary-500)', color: 'var(--gray-600)', marginBottom: 'var(--space-6)' }}>
          Verify the cryptographic ledger block chains. SecureVote chains vote transactions anonymously using sha256. Running verification executes proof checks on all finalized blocks to guarantee tamper-resistance.
        </p>

        <Alert type="error">{error}</Alert>

        {result && (
          <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)', border: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)', paddingBottom: 'var(--space-3)' }}>
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: result.valid ? 'var(--success)' : 'var(--error)',
                boxShadow: result.valid ? '0 0 10px var(--success)' : '0 0 10px var(--error)',
                animation: 'pulse 1.5s infinite'
              }} />
              <strong style={{ fontSize: '1.0625rem', color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                {result.valid ? 'INTEGRITY VERIFIED — LEDGER SECURE' : 'SECURITY BREACH — TAMPERING DETECTED'}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, display: 'block' }}>Total Block Count</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)' }}>{result.totalBlocks} Blocks</span>
              </div>
              <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, display: 'block' }}>Verified Votes</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)' }}>{result.totalVotes} Votes</span>
              </div>
              <div style={{ background: '#fff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 600, display: 'block' }}>Unmined Transactions</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)' }}>{result.pendingVotesQueued} queued</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={verify} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Executing Ledger Audits...' : '🔍 Scan & Verify Ledger'}
          </button>
          <Link to="/block-signing" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
            🖋️ Block Signing
          </Link>
        </div>
      </div>
    </div>
  );
}
