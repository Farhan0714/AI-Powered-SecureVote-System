import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';

// Visible to every role (user/admin/verifier) - block metadata and admin-action history
// only, never vote/candidate data, so it's safe to be fully transparent here.
export default function AuditTrail() {
  const [chain, setChain] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/public/chain').then(({ data }) => setChain(data.chain));
    api.get('/public/audit-log').then(({ data }) => setLogs(data.logs));
  }, []);

  return (
    <div>
      <h1>🔍 Public Audit Trail</h1>
      <p className="section-note">
        For transparency, block metadata and administrative actions are public to every
        account on this platform. Vote counts and transaction contents are never included here.
      </p>

      <div className="card">
        <h3>🔗 Finalized Blocks</h3>
        {chain.length === 0 ? <p>No finalized blocks yet.</p> : (
          <table className="table">
            <thead><tr><th>Index</th><th>Type</th><th>Hash</th><th>Prev Hash</th><th>Time</th></tr></thead>
            <tbody>
              {chain.slice().reverse().map(b => (
                <tr key={b.index}>
                  <td>#{b.index}</td>
                  <td>{b.txType}</td>
                  <td className="block-hash">{b.hash.slice(0, 20)}...</td>
                  <td className="block-hash">{b.prevHash.slice(0, 20)}...</td>
                  <td>{new Date(b.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card mt-8">
        <h3>📋 Administrative Action Log</h3>
        {logs.length === 0 ? <p>No actions logged yet.</p> : (
          <table className="table">
            <thead><tr><th>Actor</th><th>Role</th><th>Action</th><th>Time</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l._id}>
                  <td>{l.actorUsername}</td>
                  <td>{l.actorRole}</td>
                  <td>{l.action.replace(/_/g, ' ')}</td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
