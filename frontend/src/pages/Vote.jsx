import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';
import Alert from '../components/Alert.jsx';
import FaceCapture from '../components/FaceCapture.jsx';

export default function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState(null);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('select'); // select -> verify -> done
  const [uniqueCode, setUniqueCode] = useState('');
  const [faceCapture, setFaceCapture] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get('/vote/candidates').then(({ data }) => setCandidates(data.candidates));
    api.get('/vote/status').then(({ data }) => setStatus(data));
  }, []);

  const proceedToVerify = () => {
    if (!selected) return setError('Please select a candidate first.');
    setError('');
    setStep('verify');
  };

  const castVote = async (e) => {
    e.preventDefault();
    setError('');
    if (!uniqueCode.trim()) return setError('Please enter your unique voting code.');
    if (!faceCapture) return setError('Please capture your face to verify your identity.');
    if (!faceCapture.livenessVerified) return setError('Liveness check not confirmed. Please retake your face scan and turn your head as prompted.');
    setLoading(true);
    try {
      await api.post('/vote/cast', {
        candidateId: selected,
        uniqueCode: uniqueCode.trim(),
        faceDescriptor: faceCapture.descriptor,
        faceImage: faceCapture.image,
        livenessVerified: faceCapture.livenessVerified
      });
      setDone(true);
    } catch (err) { setError(err.response?.data?.message || 'Vote failed.'); }
    finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="card text-center">
        <h2>🎉 Vote Cast Successfully!</h2>
        <p>Thank you for participating in the democratic process. Your vote has been recorded on the blockchain.</p>
      </div>
    );
  }

  if (status && !status.isApprovedVoter) {
    return <div className="card"><Alert type="warning">You are not an approved voter yet. Please complete registration and wait for admin approval.</Alert></div>;
  }
  if (status && status.hasVoted) {
    return <div className="card"><Alert type="info">You have already cast your vote. Thank you!</Alert></div>;
  }
  if (status && !status.votingActive) {
    return <div className="card"><Alert type="warning">Voting is not currently active. Please check back during the official voting window.</Alert></div>;
  }

  return (
    <div className="card">
      <h2>🗳️ Cast Your Vote</h2>
      <Alert type="error">{error}</Alert>

      {step === 'select' && (
        <>
          <div className="candidate-list">
            {candidates.map(c => (
              <label key={c._id} className={`candidate-card ${selected === c._id ? 'selected' : ''}`}>
                <input type="radio" name="candidate" value={c._id} checked={selected === c._id}
                  onChange={() => setSelected(c._id)} />
                <span className="candidate-symbol">{c.symbol}</span>
                <div>
                  <div className="candidate-name">{c.name}</div>
                  <div className="candidate-party">{c.party}</div>
                </div>
              </label>
            ))}
          </div>
          <button type="button" className="btn btn-primary mt-8" onClick={proceedToVerify} disabled={!selected}>
            Continue to Verification →
          </button>
        </>
      )}

      {step === 'verify' && (
        <form onSubmit={castVote}>
          <div className="alert alert-info">
            <div className="alert-icon">ℹ️</div>
            <div>Enter the unique code you received by email when your registration was approved, and complete a live face scan to confirm your identity.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Unique Voting Code *</label>
            <input className="form-input otp-input" required maxLength={6}
              value={uniqueCode} onChange={e => setUniqueCode(e.target.value.toUpperCase())} placeholder="e.g. A3F9K2" />
          </div>
          <div className="form-group">
            <FaceCapture label="Face Verification *" onCapture={setFaceCapture} />
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep('select')}>← Back</button>
          <button type="submit" className="btn btn-success btn-lg mt-8" disabled={loading}>
            {loading ? '⏳ Casting Vote...' : '✅ Confirm & Cast Vote'}
          </button>
        </form>
      )}
    </div>
  );
}
