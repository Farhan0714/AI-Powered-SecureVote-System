import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifierHome() {
  const { user } = useAuth();
  return (
    <div>
      <h1>🖋️ Welcome, {user?.username} (Verifier)</h1>
      <p className="section-note">
        As a verifier, your role is to independently co-sign proposed blocks before they can
        be finalized into the blockchain, and to review the public audit trail. You do not
        have access to voter applications or the ability to publish results.
      </p>
      <div className="dashboard-grid">
        <div className="card">
          <h3>🖋️ Block Signing</h3>
          <p>Generate your signing key and co-sign pending blocks.</p>
          <Link to="/block-signing" className="btn btn-primary">Go to Block Signing</Link>
        </div>
        <div className="card">
          <h3>🔍 Public Audit Trail</h3>
          <p>Review finalized block metadata and administrative action history.</p>
          <Link to="/audit-trail" className="btn btn-secondary">View Audit Trail</Link>
        </div>
      </div>
    </div>
  );
}
