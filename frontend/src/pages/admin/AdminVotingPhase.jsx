import React, { useEffect, useState } from 'react';
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
      setInfo('Voting phase updated.');
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
  };

  if (!phase) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2>⏱️ Voting Phase Control</h2>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>
      <form onSubmit={save}>
        <div className="form-group">
          <label className="form-label">
            <input type="checkbox" checked={phase.isActive}
              onChange={e => setPhase({ ...phase, isActive: e.target.checked })} /> Voting Enabled
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Start Time</label>
          <input type="time" className="form-input" value={phase.startTime}
            onChange={e => setPhase({ ...phase, startTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">End Time</label>
          <input type="time" className="form-input" value={phase.endTime}
            onChange={e => setPhase({ ...phase, endTime: e.target.value })} />
        </div>
        <button className="btn btn-primary">Save</button>
      </form>
    </div>
  );
}
