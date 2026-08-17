import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';

export default function AdminView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reg, setReg] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/admin/registrations/${id}`).then(({ data }) => setReg(data.registration));
  }, [id]);

  const decide = async (decision) => {
    setError(''); setLoading(true);
    try {
      await api.post(`/admin/registrations/${id}/decision`, { decision, comment });
      navigate('/admin');
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  if (!reg) return <div className="page-loading">Loading application...</div>;

  const InfoRow = ({ label, value }) => (
    <div style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>{label}</span>
      <span style={{ color: 'var(--gray-800)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <Link to="/admin" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 'var(--space-4)', display: 'inline-block' }}>← Back to Applications</Link>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
              <h2 style={{ margin: 0 }}>{reg.name}</h2>
              <span className={`badge badge-${reg.type || 'new'}`} style={{
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: reg.type === 'deletion' ? '#fee2e2' : reg.type === 'correction' ? '#fef3c7' : '#dbeafe',
                color: reg.type === 'deletion' ? '#991b1b' : reg.type === 'correction' ? '#92400e' : '#1e40af'
              }}>
                {reg.type === 'new' ? 'New Registration' : reg.type}
              </span>
            </div>
            <p style={{ color: 'var(--gray-500)', margin: 0, fontSize: '0.875rem' }}>
              Voter ID: {reg.voterId} &middot; Submitted: {new Date(reg.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`status-badge status-${reg.status}`}>{reg.status}</span>
        </div>

        {reg.type === 'deletion' && (
          <div style={{ background: '#fef2f2', borderLeft: '4px solid var(--error)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', color: '#991b1b' }}>
            <h4 style={{ margin: '0 0 var(--space-1) 0', color: '#991b1b' }}>⚠️ Request for Deletion of Voter Record</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              <strong>Reason:</strong> {reg.reasonForDeletion}
            </p>
          </div>
        )}

        <Alert type="error">{error}</Alert>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div>
            <h4 style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-3)' }}>Personal Details</h4>
            <InfoRow label="Father's Name" value={reg.fatherName} />
            <InfoRow label="Mother's Name" value={reg.motherName} />
            <InfoRow label="Address" value={reg.address} />
            <InfoRow label="Phone" value={reg.phone} />
            <InfoRow label="Age" value={reg.age} />
            <InfoRow label="Email" value={reg.regEmail} />
          </div>
          <div>
            <h4 style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-3)' }}>Uploaded Documents</h4>
            {reg.livePhoto && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 'var(--space-2)' }}>Live Photo</p>
                <img src={reg.livePhoto} alt="Live" className="review-img" />
              </div>
            )}
            {reg.identityProof && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 'var(--space-2)' }}>Identity Proof</p>
                <img src={reg.identityProof} alt="ID Proof" className="review-img" />
              </div>
            )}
            {!reg.livePhoto && !reg.identityProof && (
              <p style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>No documents uploaded.</p>
            )}
          </div>
        </div>

        {reg.status === 'pending' && (
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--gray-200)' }}>
            <h4 style={{ marginBottom: 'var(--space-3)' }}>Make a Decision</h4>
            <div className="form-group">
              <label className="form-label">Admin Comment (optional)</label>
              <textarea
                className="form-textarea"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a note explaining the decision..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-success" disabled={loading} onClick={() => decide('approved')}>
                {loading ? 'Processing...' : reg.type === 'deletion' ? 'Approve Deletion (Delete Record)' : reg.type === 'correction' ? 'Approve Corrections' : 'Approve Application'}
              </button>
              <button className="btn btn-danger" disabled={loading} onClick={() => decide('rejected')}>
                {loading ? 'Processing...' : reg.type === 'deletion' ? 'Reject Deletion' : reg.type === 'correction' ? 'Reject Corrections' : 'Reject Application'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
