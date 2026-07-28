import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios.js';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/election/results').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card">Loading...</div>;

  if (!data?.published) {
    return (
      <div className="card text-center">
        <h2>📊 Official Results</h2>
        <p>Results have not been published yet. Please check back after the voting phase has ended and the admin publishes the official results.</p>
      </div>
    );
  }

  const { result } = data;
  return (
    <div>
      <h1>📊 Official Election Results</h1>
      <div className="card">
        <div className="stats-row">
          <div><strong>Total Votes Cast:</strong> {result.totalVotes}</div>
          <div><strong>Approved Voters:</strong> {result.totalApprovedVoters}</div>
          <div><strong>Turnout:</strong> {result.turnoutPercent}%</div>
          <div><strong>Published:</strong> {new Date(result.publishedAt).toLocaleString()}</div>
        </div>
        {result.results.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie data={result.results} dataKey="count" nameKey="name" outerRadius={120} label>
                {result.results.map((r, i) => <Cell key={r.candidateId} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : <p>No votes were cast.</p>}

        <table className="table mt-8">
          <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th></tr></thead>
          <tbody>
            {result.results.map(r => <tr key={r.candidateId}><td>{r.name}</td><td>{r.party}</td><td>{r.count}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
