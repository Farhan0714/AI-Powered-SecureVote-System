import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import Alert from '../components/Alert.jsx';
import FaceCapture from '../components/FaceCapture.jsx';

function getEuclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

export default function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [status, setStatus] = useState(null);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('select');
  const [uniqueCode, setUniqueCode] = useState('');
  const [faceCapture, setFaceCapture] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [faceMatchOk, setFaceMatchOk] = useState(false);
  const [matchDistance, setMatchDistance] = useState(null);

  useEffect(() => {
    api.get('/vote/candidates').then(({ data }) => setCandidates(data.candidates));
    api.get('/vote/status').then(({ data }) => setStatus(data));
  }, []);

  useEffect(() => {
    if (faceCapture && faceCapture.descriptor && status?.faceDescriptor) {
      const dist = getEuclideanDistance(faceCapture.descriptor, status.faceDescriptor);
      setMatchDistance(dist);
      const match = dist < 0.6;
      setFaceMatchOk(match);
      if (!match) {
        setError('❌ Identity Verification Failed! Your live scan does not match your registered voter photo.');
      } else {
        setError('');
      }
    } else {
      setFaceMatchOk(false);
      setMatchDistance(null);
    }
  }, [faceCapture, status]);

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
    if (!faceCapture.livenessVerified) return setError('Liveness check not confirmed. Please retake your face scan.');
    if (!faceMatchOk) return setError('Identity verification failed. You cannot proceed with casting a vote.');

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
    const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];
    return (
      <div className="card text-center" style={{ padding: 'var(--space-12)', position: 'relative' }}>
        <div className="confetti-container">
          {Array.from({ length: 35 }).map((_, i) => {
            const color = confettiColors[i % confettiColors.length];
            const left = `${Math.random() * 100}%`;
            const delay = `${Math.random() * 3}s`;
            const duration = `${2.5 + Math.random() * 2}s`;
            return (
              <div 
                key={i} 
                className="confetti-piece" 
                style={{ 
                  backgroundColor: color, 
                  left: left, 
                  animationDelay: delay,
                  animationDuration: duration 
                }} 
              />
            );
          })}
        </div>

        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🎉</div>
        <h2 style={{ marginBottom: 'var(--space-3)', color: 'var(--success)' }}>Vote Cast Successfully!</h2>
        <p style={{ color: 'var(--gray-600)', maxWidth: '480px', margin: '0 auto var(--space-6)' }}>
          Thank you for participating in the democratic process. Your vote has been securely recorded on the blockchain.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ width: 'auto' }}>Back to Dashboard</Link>
      </div>
    );
  }

  if (status && !status.isApprovedVoter) {
    return (
      <div className="card">
        <Alert type="warning">
          You are not an approved voter yet. Please complete your voter registration and wait for admin approval.
        </Alert>
      </div>
    );
  }
  if (status && status.hasVoted) {
    return (
      <div className="card">
        <Alert type="info">You have already cast your vote. Thank you for participating!</Alert>
      </div>
    );
  }
  if (status && !status.votingActive) {
    return (
      <div className="card">
        <Alert type="warning">
          Voting is not currently active. Please check back during the official voting window.
        </Alert>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Cast Your Vote</h2>
      <Alert type="error">{error}</Alert>

      {step === 'select' && (
        <>
          <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-6)' }}>
            Select your preferred candidate below, then proceed to verify your identity.
          </p>
          <div className="candidate-list">
            {candidates.map(c => (
              <label key={c._id} className={`candidate-card ${selected === c._id ? 'selected' : ''}`}>
                <input type="radio" name="candidate" value={c._id} checked={selected === c._id}
                  onChange={() => setSelected(c._id)} />
                <span className="candidate-symbol">{c.symbol || '🏛️'}</span>
                <div>
                  <div className="candidate-name">{c.name}</div>
                  <div className="candidate-party">{c.party || 'Independent'}</div>
                </div>
              </label>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={proceedToVerify} disabled={!selected} style={{ width: 'auto' }}>
            Continue to Verification →
          </button>
        </>
      )}

      {step === 'verify' && (
        <form onSubmit={castVote}>
          <div className="alert alert-info">
            <span className="alert-icon">ℹ️</span>
            <div>Enter the unique code you received when your registration was approved, and complete a live face scan to confirm your identity.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Unique Voting Code</label>
            <input className="form-input otp-input" required maxLength={6}
              value={uniqueCode} onChange={e => setUniqueCode(e.target.value.toUpperCase())} placeholder="A3F9K2" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', margin: 'var(--space-5) 0' }}>
            <div style={{ textAlign: 'center', background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 'var(--space-2)', color: 'var(--gray-500)' }}>📷 REGISTERED FACE PHOTO</div>
              {status?.livePhoto ? (
                <img src={status.livePhoto} alt="Registered" style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--gray-300)' }} />
              ) : (
                <div style={{ width: '130px', height: '130px', margin: '0 auto', background: 'var(--gray-200)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>No Image</div>
              )}
            </div>

            <div style={{ textAlign: 'center', background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 'var(--space-2)', color: 'var(--gray-500)' }}>🎥 LIVE WEB-CAM SCAN</div>
              {faceCapture?.image ? (
                <img src={faceCapture.image} alt="Webcam Live" style={{ width: '130px', height: '130px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: faceMatchOk ? '2px solid var(--success)' : '2px solid var(--error)' }} />
              ) : (
                <div style={{ width: '130px', height: '130px', margin: '0 auto', background: 'var(--gray-200)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>No Scan Yet</div>
              )}
            </div>
          </div>

          {faceCapture && (
            <div style={{ margin: 'var(--space-4) 0' }}>
              {faceMatchOk ? (
                <div className="alert alert-success" style={{ margin: 0 }}>
                  <span className="alert-icon">✅</span>
                  <div><strong>Identity Verified!</strong> Face matches registered profile (Distance: {matchDistance?.toFixed(2)} &lt; 0.60).</div>
                </div>
              ) : (
                <div className="alert alert-error" style={{ margin: 0 }}>
                  <span className="alert-icon">❌</span>
                  <div><strong>Identity Match Failed!</strong> Distance: {matchDistance?.toFixed(2)} &ge; 0.60. Proceeding blocked.</div>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <FaceCapture label="Face Verification" onCapture={setFaceCapture} />
          </div>
          <div className="flex gap-3" style={{ marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep('select')}>← Back</button>
            <button type="submit" className="btn btn-success" disabled={loading || (faceCapture && !faceMatchOk)}>
              {loading ? 'Casting Vote...' : 'Confirm & Cast Vote'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
