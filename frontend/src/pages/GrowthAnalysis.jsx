import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios.js';
import Alert from '../components/Alert.jsx';

export default function GrowthAnalysis() {
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [data, setData] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/election/sector-data/sectors').then(({ data }) => setSectors(data.sectors));
  }, []);

  useEffect(() => {
    api.get('/election/sector-data', { params: selectedSector ? { sector: selectedSector } : {} })
      .then(({ data }) => setData(data.data));
  }, [selectedSector]);

  const runAiAnalysis = async () => {
    setLoading(true); setError(''); setAnalysis('');
    try {
      const { data } = await api.post('/election/growth-analysis', {
        state: 'All India',
        sectors: selectedSector ? [selectedSector] : undefined
      });
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.response?.data?.message || 'AI analysis failed. Make sure GEMINI_API_KEY is set on the server.');
    } finally { setLoading(false); }
  };

  // group by indicatorName for chart lines
  const indicators = [...new Set(data.map(d => d.indicatorName))];
  const years = [...new Set(data.map(d => d.year))].sort();
  const chartData = years.map(year => {
    const row = { year };
    indicators.forEach(ind => {
      const rec = data.find(d => d.year === year && d.indicatorName === ind);
      if (rec) row[ind] = rec.value;
    });
    return row;
  });

  return (
    <div>
      <h1>🤖 AI Growth Evaluation</h1>
      <div className="card">
        <div className="form-group">
          <label className="form-label">Sector</label>
          <select className="form-select" value={selectedSector} onChange={e => setSelectedSector(e.target.value)}>
            <option value="">All Sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {indicators.map((ind, i) => (
                <Line key={ind} type="monotone" dataKey={ind} stroke={['#2563eb','#f59e0b','#10b981','#ef4444','#8b5cf6'][i % 5]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        <button className="btn btn-primary mt-8" onClick={runAiAnalysis} disabled={loading}>
          {loading ? '⏳ Analyzing with Gemini AI...' : '🤖 Generate AI Growth Evaluation'}
        </button>
        <Alert type="error">{error}</Alert>

        {analysis && (
          <div className="ai-analysis-box mt-8">
            <h3>AI Evaluation</h3>
            <div style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
          </div>
        )}
      </div>
    </div>
  );
}
