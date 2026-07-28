import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = () => {
    api.get('/admin/registrations', { params: statusFilter ? { status: statusFilter } : {} })
      .then(({ data }) => setRegistrations(data.registrations));
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div>
      <h1>📊 Admin Dashboard</h1>
      <div className="admin-links">
        <Link to="/admin/voting-phase" className="btn btn-secondary btn-sm">⏱️ Voting Phase</Link>
        <Link to="/admin/publish-results" className="btn btn-secondary btn-sm">📢 Publish Results</Link>
        <Link to="/admin/blockchain" className="btn btn-secondary btn-sm">🔗 Verify Blockchain</Link>
        <Link to="/block-signing" className="btn btn-secondary btn-sm">🖋️ Block Signing</Link>
        <Link to="/audit-trail" className="btn btn-secondary btn-sm">🔍 Audit Trail</Link>
      </div>

      <div className="card mt-8">
        <div className="form-group">
          <label className="form-label">Filter by Status</label>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
        </div>

        <table className="table">
          <thead>
            <tr><th>Name</th><th>Voter ID</th><th>Email</th><th>Status</th><th>Submitted</th><th></th></tr>
          </thead>
          <tbody>
            {registrations.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>{r.voterId}</td>
                <td>{r.regEmail}</td>
                <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><Link to={`/admin/registrations/${r._id}`} className="btn btn-sm btn-primary">Review</Link></td>
              </tr>
            ))}
            {!registrations.length && <tr><td colSpan="6">No registrations found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
