import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';

// Only exposes integrity status (valid/invalid + block count) — never raw chain or
// transaction contents, so vote data can't be inferred from the blockchain by the admin.
// Proposing/signing new blocks now requires a 2-of-3 quorum — see Block Signing page.
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
    <div className="card">
      <h2>🔗 Blockchain Integrity</h2>
      <p className="section-note">Vote transactions are hashed and chained anonymously. Only the chain's validity and block count are shown here — never the underlying vote data.</p>
      <Alert type="error">{error}</Alert>

      {result && (
        <div className="stats-row">
          <div><strong>Chain Valid:</strong> {result.valid ? '✅ Yes' : '❌ No — tampering detected'}</div>
          <div><strong>Total Finalized Blocks:</strong> {result.totalBlocks}</div>
          <div><strong>Votes Awaiting Proposal:</strong> {result.pendingVotesQueued}</div>
        </div>
      )}

      <button className="btn btn-primary mt-8" onClick={verify} disabled={loading}>
        {loading ? '⏳ Checking...' : '🔍 Verify Blockchain'}
      </button>
      <Link to="/block-signing" className="btn btn-secondary mt-8" style={{ marginLeft: '12px' }}>
        🖋️ Go to Block Signing (Propose / Co-Sign)
      </Link>
    </div>
  );
}
