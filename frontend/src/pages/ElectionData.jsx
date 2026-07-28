import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios.js';

export default function ElectionData() {
  const [history, setHistory] = useState([]);
  const [manifestos, setManifestos] = useState([]);
  const [states, setStates] = useState([]);
  const [state, setState] = useState('All India');

  useEffect(() => {
    api.get('/election/history/states').then(({ data }) => setStates(data.states));
    api.get('/election/manifestos').then(({ data }) => setManifestos(data.manifestos));
  }, []);

  useEffect(() => {
    api.get('/election/history', { params: { state } }).then(({ data }) => setHistory(data.history));
  }, [state]);

  // reshape for grouped bar chart: one row per year, one bar per party
  const years = [...new Set(history.map(h => h.year))].sort();
  const parties = [...new Set(history.map(h => h.party))];
  const chartData = years.map(year => {
    const row = { year };
    parties.forEach(p => {
      const rec = history.find(h => h.year === year && h.party === p);
      row[p] = rec ? rec.voteSharePercent : 0;
    });
    return row;
  });
  const colors = { BJP: '#f59e0b', INC: '#3b82f6', AAP: '#10b981' };

  return (
    <div>
      <h1>📊 Election Data & Manifestos</h1>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Filter by State</label>
          <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <h3>Vote Share % by Year</h3>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis unit="%" />
              <Tooltip />
              <Legend />
              {parties.map(p => <Bar key={p} dataKey={p} fill={colors[p] || '#6b7280'} />)}
            </BarChart>
          </ResponsiveContainer>
        ) : <p>No data for this state yet.</p>}

        <table className="table mt-8">
          <thead>
            <tr><th>Year</th><th>Party</th><th>Votes</th><th>Vote Share %</th><th>Seats Won</th></tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h._id}>
                <td>{h.year}</td><td>{h.party}</td>
                <td>{h.votesReceived.toLocaleString()}</td>
                <td>{h.voteSharePercent}%</td>
                <td>{h.seatsWon}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-8">
        <h3>📜 Party Manifestos</h3>
        <div className="manifesto-grid">
          {manifestos.map(m => (
            <div key={m._id} className="manifesto-card">
              <h4>{m.party} ({m.year})</h4>
              <p>{m.summary}</p>
              <p><strong>Focus Sectors:</strong> {m.focusSectors.join(', ')}</p>
              <ul>{m.keyPromises.map((k, i) => <li key={i}>{k}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
