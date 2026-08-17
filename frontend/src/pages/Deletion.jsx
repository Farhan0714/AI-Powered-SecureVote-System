import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Alert from '../components/Alert.jsx';

export default function Deletion() {
  const navigate = useNavigate();
  const [approvedUser, setApprovedUser] = useState(null);
  const [reasonForDeletion, setReasonForDeletion] = useState('Voluntary Removal');
  const [reasonDetails, setReasonDetails] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/registration/mine')
      .then(({ data }) => {
        if (!data.approvedUser) {
          setError('No approved voter record found. You must be an approved voter to request deletion.');
          setLoading(false);
          return;
        }
        setApprovedUser(data.approvedUser);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load your approved voter profile.');
        setLoading(false);
      });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!confirmed) return setError('Please check the confirmation box before submitting.');
    setSubmitting(true);
    try {
      await api.post('/registration/delete', { reasonForDeletion, reasonDetails });
      navigate('/submitted');
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit deletion request.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="page-loading">Loading approved voter profile...</div>;

  return (
    <div>
      <h1>Request Deletion of Voter Record</h1>
      <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-6)' }}>
        Submit this application if you wish to remove your voter registration from the platform. Deletion requests require review and approval by the administrator.
      </p>

      <div className="card">
        <Alert type="error">{error}</Alert>
        <Alert type="info">{info}</Alert>
        {!error && approvedUser && (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
              <h4 style={{ margin: '0 0 var(--space-2) 0' }}>Voter Record Details (Read-only)</h4>
              <p style={{ margin: 'var(--space-1) 0', fontSize: '0.875rem' }}><strong>Name:</strong> {approvedUser.name}</p>
              <p style={{ margin: 'var(--space-1) 0', fontSize: '0.875rem' }}><strong>Voter ID:</strong> {approvedUser.voterId}</p>
              <p style={{ margin: 'var(--space-1) 0', fontSize: '0.875rem' }}><strong>Phone:</strong> {approvedUser.phone}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Primary Reason for Deletion</label>
              <select className="form-select" value={reasonForDeletion} onChange={e => setReasonForDeletion(e.target.value)}>
                <option value="Voluntary Removal">Voluntary Removal / Opt-out</option>
                <option value="Went Overseas">Went Overseas / Change of Nationality</option>
                <option value="Deceased (reporting on behalf)">Deceased (Reporting on behalf of family member)</option>
                <option value="Incorrect Entry">Incorrect / Duplicate Entry</option>
                <option value="Other">Other (Please specify below)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Details / Reasons (Optional)</label>
              <textarea 
                className="form-textarea" 
                value={reasonDetails} 
                onChange={e => setReasonDetails(e.target.value)} 
                placeholder="Explain the reasons for deletion in detail..."
                rows={4}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
              <input 
                type="checkbox" 
                id="confirm-chk"
                checked={confirmed} 
                onChange={e => setConfirmed(e.target.checked)} 
                style={{ marginTop: '3px' }}
              />
              <label htmlFor="confirm-chk" style={{ fontSize: '0.875rem', color: 'var(--gray-600)', userSelect: 'none', cursor: 'pointer' }}>
                I confirm that I want to submit this deletion request. I understand that once approved, my approved voter profile will be deleted and my voting ability will be removed.
              </label>
            </div>

            <button type="submit" className="btn btn-danger btn-lg mt-6" disabled={submitting || !confirmed}>
              {submitting ? 'Submitting Request...' : 'Submit Deletion Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
