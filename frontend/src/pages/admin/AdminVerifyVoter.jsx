import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import Alert from '../../components/Alert.jsx';
import FaceCapture from '../../components/FaceCapture.jsx';

function getEuclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

export default function AdminVerifyVoter() {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(window.location.search);
  const codeParam = queryParams.get('code') || '';

  const [voter, setVoter] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [faceCapture, setFaceCapture] = useState(null);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [uniqueCode, setUniqueCode] = useState(codeParam);

  const [faceMatchOk, setFaceMatchOk] = useState(false);
  const [matchDistance, setMatchDistance] = useState(null);

  useEffect(() => {

    api.get(`/admin/approved-voters/${id}`)
      .then(({ data }) => setVoter(data.voter))
      .catch(err => setError(err.response?.data?.message || 'Failed to load voter details.'));

    api.get('/vote/candidates')
      .then(({ data }) => setCandidates(data.candidates))
      .catch(err => setError('Failed to load candidates.'));
  }, [id]);

  useEffect(() => {
    if (faceCapture && faceCapture.descriptor && voter?.faceDescriptor) {
      const dist = getEuclideanDistance(faceCapture.descriptor, voter.faceDescriptor);
      setMatchDistance(dist);
      const match = dist < 0.6;
      setFaceMatchOk(match);
      setIsFaceVerified(match);
      if (!match) {
        setError('❌ Face Match Failed! This person does not match the registered voter profile.');
      } else {
        setError('');
      }
    } else {
      setFaceMatchOk(false);
      setMatchDistance(null);
      setIsFaceVerified(false);
    }
  }, [faceCapture, voter]);

  const handleCastVote = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCandidate) return setError('Please select a candidate.');
    if (!uniqueCode.trim()) return setError('Unique voting code is required.');
    if (!faceCapture) return setError('Face capture verification is required.');

    setLoading(true);
    try {
      const { data } = await api.post('/admin/cast-vote-for-voter', {
        voterId: id,
        candidateId: selectedCandidate,
        uniqueCode: uniqueCode.trim(),
        faceDescriptor: faceCapture.descriptor,
        faceImage: faceCapture.image,
        livenessVerified: faceCapture.livenessVerified
      });
      setSuccess(data.message);

      setVoter(prev => prev ? { ...prev, hasVoted: true } : null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cast vote.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !voter) {
    return (
      <div className="card">
        <Alert type="error">{error}</Alert>
        <Link to="/admin" className="btn btn-secondary mt-8">Back to Dashboard</Link>
      </div>
    );
  }

  if (!voter) return <div className="page-loading">Loading voter records...</div>;

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/admin" style={{ fontSize: '0.875rem', color: 'var(--gray-500)', textDecoration: 'none' }}>← Back to Admin Dashboard</Link>
        <h1 style={{ marginTop: 'var(--space-2)' }}>🗳️ Polling Booth Verification</h1>
        <p style={{ color: 'var(--gray-500)', margin: 0 }}>Scan, verify identity, and cast vote in-person</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {}
        <div className="card">
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            {voter.livePhoto && (
              <img
                src={voter.livePhoto}
                alt={voter.name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-500)' }}
              />
            )}
            <div>
              <h3 style={{ margin: 0 }}>{voter.name}</h3>
              <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.875rem' }}>Voter ID: {voter.voterId}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: '0.9375rem', borderTop: '1px solid var(--gray-100)', paddingTop: 'var(--space-3)' }}>
            <div><strong>Age:</strong> {voter.age}</div>
            <div><strong>Phone:</strong> {voter.phone}</div>
            <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {voter.address}</div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Status:</strong> {voter.hasVoted ? (
                <span className="status-badge status-rejected">Already Voted</span>
              ) : (
                <span className="status-badge status-approved">Eligible to Vote</span>
              )}
            </div>
          </div>

          {success && (
            <div className="alert alert-success" style={{ marginTop: 'var(--space-6)' }}>
              <span className="alert-icon">🎉</span>
              <div>{success}</div>
            </div>
          )}

          {error && <Alert type="error">{error}</Alert>}

          {}
          {!voter.hasVoted && isFaceVerified && (
            <form onSubmit={handleCastVote} style={{ marginTop: 'var(--space-6)', borderTop: '1.5px dashed var(--gray-200)', paddingTop: 'var(--space-6)' }}>
              <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--success)' }}>🔓 Booth Access Unlocked</h4>

              <div className="form-group">
                <label className="form-label">Unique Voting Code</label>
                <input
                  className="form-input otp-input"
                  required
                  maxLength={6}
                  value={uniqueCode}
                  onChange={e => setUniqueCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Candidate</label>
                <div className="candidate-list">
                  {candidates.map(c => (
                    <label key={c._id} className={`candidate-card ${selectedCandidate === c._id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="candidate"
                        value={c._id}
                        checked={selectedCandidate === c._id}
                        onChange={() => setSelectedCandidate(c._id)}
                      />
                      <span className="candidate-symbol">{c.symbol || '🏛️'}</span>
                      <div>
                        <div className="candidate-name">{c.name}</div>
                        <div className="candidate-party">{c.party || 'Independent'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-success w-full mt-4" disabled={loading}>
                {loading ? 'Submitting Vote...' : 'Confirm & Submit Vote'}
              </button>
            </form>
          )}

          {voter.hasVoted && (
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-200)', paddingTop: 'var(--space-4)' }}>
              🚫 Voting complete. No further actions allowed.
            </div>
          )}
        </div>

        {}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {!voter.hasVoted ? (
            <div>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>📷 Identity Verification</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                Voter must turn their head left and right in front of the camera to confirm liveness.
              </p>

              {}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', margin: 'var(--space-4) 0' }}>
                <div style={{ textAlign: 'center', background: 'var(--gray-50)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>REGISTERED PHOTO</span>
                  {voter.livePhoto ? (
                    <img src={voter.livePhoto} alt="Registered" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', background: 'var(--gray-200)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>No Image</div>
                  )}
                </div>
                <div style={{ textAlign: 'center', background: 'var(--gray-50)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>LIVE WEB-CAM SCAN</span>
                  {faceCapture?.image ? (
                    <img src={faceCapture.image} alt="Live Scan" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: faceMatchOk ? '2px solid var(--success)' : '2px solid var(--error)' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', background: 'var(--gray-200)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>No Scan</div>
                  )}
                </div>
              </div>

              {faceCapture && (
                <div style={{ margin: 'var(--space-3) 0' }}>
                  {faceMatchOk ? (
                    <div className="alert alert-success" style={{ margin: 0, padding: 'var(--space-2)' }}>
                      <strong>✅ Match Success:</strong> Identity Verified (Dist: {matchDistance?.toFixed(2)}).
                    </div>
                  ) : (
                    <div className="alert alert-error" style={{ margin: 0, padding: 'var(--space-2)' }}>
                      <strong>❌ Match Failed:</strong> Face does not match profile (Dist: {matchDistance?.toFixed(2)}).
                    </div>
                  )}
                </div>
              )}

              <FaceCapture label="Polling Booth Face Scan" onCapture={setFaceCapture} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
              <h3>Vote Confirmed on Blockchain</h3>
              <p style={{ color: 'var(--gray-500)', maxWidth: '300px', margin: '0 auto' }}>
                This voter's unique transaction hash has been committed to the ledger blocks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
