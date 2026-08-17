import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifierHome() {
  const { user } = useAuth();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)', background: 'linear-gradient(135deg, var(--gray-900), var(--gray-800))', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', color: '#fff' }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0 }}>🖋️ Verifier Workspace</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 'var(--space-1) 0 0 0', fontSize: '0.9375rem' }}>Welcome, {user?.username} &middot; Secure Ledger Validator</p>
        </div>
      </div>
      
      <p className="section-note" style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary-500)', padding: 'var(--space-4)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
        As an independent verifier, you participate in the decentralized block finalization process. You can review block hashes, provide co-signing signatures, and audit the public cryptographic trail to confirm data integrity.
      </p>

      <div className="dashboard-grid" style={{ marginTop: 'var(--space-6)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '240px' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🖋️</div>
            <h3 style={{ margin: '0 0 var(--space-2) 0' }}>Block Signing Booth</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>
              Generate your RSA credentials, paste your private key, and co-sign newly proposed blocks to commit votes to the chain.
            </p>
          </div>
          <Link to="/block-signing" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Go to Block Signing →</Link>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '240px' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🔍</div>
            <h3 style={{ margin: '0 0 var(--space-2) 0' }}>Public Audit Trail</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0 }}>
              Review block indices, timestamps, cryptographic parent hashes, and validation logs to verify chain consistency.
            </p>
          </div>
          <Link to="/audit-trail" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>View Audit Trail →</Link>
        </div>
      </div>
    </div>
  );
}
