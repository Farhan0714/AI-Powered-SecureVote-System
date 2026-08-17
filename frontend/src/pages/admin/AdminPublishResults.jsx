import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';

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

  if (!status) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <Link to="/admin" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: 'var(--space-4)', display: 'inline-block' }}>← Back to Admin</Link>
      <div className="card" style={{ maxWidth: '560px' }}>
        <h2>Publish Election Results</h2>
        <p className="section-note">
          For transparency, vote counts are never shown to the admin. Once the voting phase has been
          turned OFF, you can publish results directly to voters without seeing the tally yourself.
        </p>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{info}</Alert>

        <div className="stats-row" style={{ marginBottom: 'var(--space-6)' }}>
          <div><strong>Voting Active:</strong> {status.votingActive ? 'Yes' : 'No'}</div>
          <div><strong>Results Published:</strong> {status.resultsPublished ? 'Yes' : 'No'}</div>
          {status.resultsPublishedAt && <div><strong>Published:</strong> {new Date(status.resultsPublishedAt).toLocaleString()}</div>}
        </div>

        {!status.resultsPublished ? (
          <>
            {status.votingActive ? (
              <Alert type="warning">Turn voting OFF on the Voting Phase page before publishing results.</Alert>
            ) : (
              <button className="btn btn-primary" onClick={publish} disabled={loading}>
                {loading ? 'Publishing...' : 'Publish Results'}
              </button>
            )}
          </>
        ) : (
          <Alert type="info">Results have already been published. Voters can view them on the Results page.</Alert>
        )}
      </div>
    </div>
  );
}
