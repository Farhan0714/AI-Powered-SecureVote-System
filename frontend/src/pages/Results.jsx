import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios.js';

const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#e11d48', '#8b5cf6', '#0ea5e9', '#f97316', '#14b8a6'];

export default function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/election/results').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading...</div>;

  if (!data?.published) {
    return (
      <div className="card text-center">
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>📊</div>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Official Election Results</h2>
        <p style={{ color: 'var(--gray-500)', maxWidth: '480px', margin: '0 auto' }}>
          Results have not been published yet. Please check back after the voting phase has ended
          and the admin publishes the official results.
        </p>
      </div>
    );
  }

  const { result } = data;
  return (
    <div>
      <h1>Official Election Results</h1>
      <div className="card">
        <div className="stats-row" style={{ marginBottom: 'var(--space-6)' }}>
          <div><strong>Total Votes Cast:</strong><br />{result.totalVotes.toLocaleString()}</div>
          <div><strong>Approved Voters:</strong><br />{result.totalApprovedVoters.toLocaleString()}</div>
          <div><strong>Turnout:</strong><br />{result.turnoutPercent}%</div>
          <div><strong>Published:</strong><br />{new Date(result.publishedAt).toLocaleString()}</div>
        </div>

        {result.results.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie data={result.results} dataKey="count" nameKey="name" outerRadius={130} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {result.results.map((r, i) => <Cell key={r.candidateId} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No votes were cast.</p>
        )}

        <div className="table-wrapper mt-8">
          <table className="table">
            <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th>Share</th></tr></thead>
            <tbody>
              {result.results.map(r => (
                <tr key={r.candidateId}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>{r.party}</td>
                  <td>{r.count.toLocaleString()}</td>
                  <td>{result.totalVotes > 0 ? ((r.count / result.totalVotes) * 100).toFixed(1) + '%' : '0%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
