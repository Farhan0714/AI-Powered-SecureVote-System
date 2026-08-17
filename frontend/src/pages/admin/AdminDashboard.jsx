import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('new');
  const [pendingCounts, setPendingCounts] = useState({ new: 0, correction: 0, deletion: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    
    api.get('/admin/registrations', { params })
      .then(({ data }) => {
        setRegistrations(data.registrations);
        if (data.pendingCounts) {
          setPendingCounts(data.pendingCounts);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)', background: 'linear-gradient(135deg, var(--primary-900), var(--primary-700))', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', color: '#fff' }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0 }}>🛡️ Admin Panel</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 'var(--space-1) 0 0 0', fontSize: '0.9375rem' }}>Review voter registrations and oversee election phases</p>
        </div>
        <div className="admin-links" style={{ margin: 0, display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Link to="/admin/voting-phase" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>⚙️ Voting Phase</Link>
          <Link to="/admin/publish-results" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>📢 Publish Results</Link>
          <Link to="/admin/blockchain" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>🔍 Verify Blockchain</Link>
          <Link to="/block-signing" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>🖋️ Block Finalization</Link>
          <Link to="/audit-trail" className="btn btn-secondary btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>📖 Audit Trail</Link>
        </div>
      </div>

      {/* Summary / Filter Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div 
          className="card" 
          onClick={() => setTypeFilter('new')}
          style={{ 
            borderLeft: '5px solid var(--primary-500)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: 'var(--space-5) var(--space-6)',
            cursor: 'pointer',
            transform: typeFilter === 'new' ? 'scale(1.02)' : 'none',
            boxShadow: typeFilter === 'new' ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'none',
            border: typeFilter === 'new' ? '1.5px solid var(--primary-300)' : '1px solid var(--gray-200)',
            transition: 'all 0.2s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Registrations</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-800)', margin: 'var(--space-1) 0 0 0' }}>{pendingCounts.new} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-400)' }}>pending</span></h2>
          </div>
          <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>🗳️</div>
        </div>

        <div 
          className="card" 
          onClick={() => setTypeFilter('correction')}
          style={{ 
            borderLeft: '5px solid var(--warning)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: 'var(--space-5) var(--space-6)',
            cursor: 'pointer',
            transform: typeFilter === 'correction' ? 'scale(1.02)' : 'none',
            boxShadow: typeFilter === 'correction' ? '0 10px 15px -3px rgba(245, 158, 11, 0.2)' : 'none',
            border: typeFilter === 'correction' ? '1.5px solid var(--warning-300)' : '1px solid var(--gray-200)',
            transition: 'all 0.2s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correction Requests</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-800)', margin: 'var(--space-1) 0 0 0' }}>{pendingCounts.correction} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-400)' }}>pending</span></h2>
          </div>
          <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>📝</div>
        </div>

        <div 
          className="card" 
          onClick={() => setTypeFilter('deletion')}
          style={{ 
            borderLeft: '5px solid var(--error)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: 'var(--space-5) var(--space-6)',
            cursor: 'pointer',
            transform: typeFilter === 'deletion' ? 'scale(1.02)' : 'none',
            boxShadow: typeFilter === 'deletion' ? '0 10px 15px -3px rgba(239, 68, 68, 0.2)' : 'none',
            border: typeFilter === 'deletion' ? '1.5px solid var(--error-300)' : '1px solid var(--gray-200)',
            transition: 'all 0.2s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deletion Requests</div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--gray-800)', margin: 'var(--space-1) 0 0 0' }}>{pendingCounts.deletion} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gray-400)' }}>pending</span></h2>
          </div>
          <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>❌</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
            {typeFilter === 'new' ? '🆕 New Registration Applications' : typeFilter === 'correction' ? '✏️ Correction Applications' : '❌ Deletion Applications'}
          </h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <div className="form-group" style={{ margin: 0, width: '180px' }}>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="pending">⏳ Pending Review</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
                <option value="">📁 All Statuses</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Voter ID</th><th>Email</th><th>Type</th><th>Status</th><th>Submitted</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-400)' }}>Loading...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--gray-400)' }}>No registrations found.</td></tr>
              ) : (
                registrations.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{r.voterId}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{r.regEmail}</td>
                    <td>
                      <span className={`badge badge-sm badge-${r.type || 'new'}`} style={{
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background: r.type === 'deletion' ? '#fee2e2' : r.type === 'correction' ? '#fef3c7' : '#dbeafe',
                        color: r.type === 'deletion' ? '#991b1b' : r.type === 'correction' ? '#92400e' : '#1e40af'
                      }}>
                        {r.type === 'new' ? 'New Reg' : r.type}
                      </span>
                    </td>
                    <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><Link to={`/admin/registrations/${r._id}`} className="btn btn-sm btn-primary">Review</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
