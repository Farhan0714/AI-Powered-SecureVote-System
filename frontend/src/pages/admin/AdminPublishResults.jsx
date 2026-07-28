import React, { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';

// Deliberately never fetches or displays vote counts — the admin can only trigger
// publishing; the actual tally is revealed to voters on the Results page.
export default function AdminPublishResults() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/admin/results/status').then(({ data }) => setStatus(data));
  useEffect(() => { load(); }, []);

  const publish = async () => {
    setError(''); setInfo(''); setLoading(true);
    try {
      const { data } = await api.post('/admin/results/publish');
      setInfo(data.message);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Failed to publish results.'); }
    finally { setLoading(false); }
  };

  if (!status) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2>📢 Publish Election Results</h2>
      <p className="section-note">
        For transparency, vote counts are never shown to the admin — not even here. Once the
        voting phase has been turned OFF, you can publish results directly to voters without
        seeing the tally yourself.
      </p>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      <div className="stats-row">
        <div><strong>Voting Currently Active:</strong> {status.votingActive ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Results Published:</strong> {status.resultsPublished ? '✅ Yes' : '❌ No'}</div>
        {status.resultsPublishedAt && <div><strong>Published At:</strong> {new Date(status.resultsPublishedAt).toLocaleString()}</div>}
      </div>

      {!status.resultsPublished && (
        <button className="btn btn-primary btn-lg mt-8" onClick={publish} disabled={loading || status.votingActive}>
          {loading ? '⏳ Publishing...' : '📢 Publish Results'}
        </button>
      )}
      {status.votingActive && !status.resultsPublished && (
        <Alert type="warning">Turn voting OFF on the Voting Phase page before publishing.</Alert>
      )}
    </div>
  );
}
