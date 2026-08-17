import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';

export default function AdminVotingPhase() {
  const [phase, setPhase] = useState(null);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/admin/voting-phase').then(({ data }) => setPhase(data.phase));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    try {
      await api.put('/admin/voting-phase', phase);
      setInfo('Voting phase updated successfully.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to update.'); }
  };

  if (!phase) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <Link to="/admin" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 'var(--space-4)', display: 'inline-block' }}>← Back to Admin</Link>
      <div className="card" style={{ maxWidth: '560px' }}>
        <h2>Voting Phase Control</h2>
        <p className="section-note">
          Configure when voting is active and toggle the election phase. Turn voting OFF before publishing results.
        </p>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{info}</Alert>
        <form onSubmit={save}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={phase.isActive}
                onChange={e => setPhase({ ...phase, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              Voting Enabled
            </label>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', margin: 'var(--space-1) 0 0' }}>
              {phase.isActive ? 'Voting is open to approved voters' : 'Voting is closed'}
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Daily Start Time</label>
            <input type="time" className="form-input" value={phase.startTime}
              onChange={e => setPhase({ ...phase, startTime: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Daily End Time</label>
            <input type="time" className="form-input" value={phase.endTime}
              onChange={e => setPhase({ ...phase, endTime: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}
