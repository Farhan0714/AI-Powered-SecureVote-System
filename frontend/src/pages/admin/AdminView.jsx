import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  if (!reg) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2>Review Registration — {reg.name}</h2>
      <Alert type="error">{error}</Alert>
      <div className="review-grid">
        <div>
          <p><strong>Father's Name:</strong> {reg.fatherName}</p>
          <p><strong>Mother's Name:</strong> {reg.motherName}</p>
          <p><strong>Address:</strong> {reg.address}</p>
          <p><strong>Phone:</strong> {reg.phone}</p>
          <p><strong>Age:</strong> {reg.age}</p>
          <p><strong>Voter ID:</strong> {reg.voterId}</p>
          <p><strong>Email:</strong> {reg.regEmail}</p>
          <p><strong>Status:</strong> <span className={`status-badge status-${reg.status}`}>{reg.status}</span></p>
        </div>
        <div>
          {reg.livePhoto && <div><p><strong>Live Photo</strong></p><img src={reg.livePhoto} alt="Live" className="review-img" /></div>}
          {reg.identityProof && <div><p><strong>Identity Proof</strong></p><img src={reg.identityProof} alt="ID Proof" className="review-img" /></div>}
        </div>
      </div>

      {reg.status === 'pending' && (
        <div className="mt-8">
          <div className="form-group">
            <label className="form-label">Admin Comment (optional)</label>
            <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <button className="btn btn-success" disabled={loading} onClick={() => decide('approved')}>✅ Approve</button>
          <button className="btn btn-danger" disabled={loading} onClick={() => decide('rejected')} style={{ marginLeft: '12px' }}>❌ Reject</button>
        </div>
      )}
    </div>
  );
}
