import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import { signMessage, downloadTextFile } from '../utils/crypto.js';

export default function BlockSigning() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [hasKey, setHasKey] = useState(null);
  const [pending, setPending] = useState([]);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAll = () => {
    api.get('/verifiers/status').then(({ data }) => setStatus(data));
    api.get('/verifiers/me').then(({ data }) => setHasKey(data.hasSigningKey));
    api.get('/verifiers/blocks/pending').then(({ data }) => setPending(data.pending));
  };
  useEffect(() => { loadAll(); }, []);

  const generateKey = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/verifiers/generate-key');
      setGeneratedKey(data.privateKeyPem);
      setHasKey(true);
      setInfo('Signing key generated. Save the private key shown below — it will not be shown again.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to generate key.'); }
    finally { setLoading(false); }
  };

  const proposeBlock = async () => {
    setError(''); setInfo(''); setLoading(true);
    try {
      const { data } = await api.post('/verifiers/blocks/propose');
      setInfo(`Block #${data.index} proposed. It needs signatures before joining the chain.`);
      loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Failed to propose block.'); }
    finally { setLoading(false); }
  };

  const signBlock = async (blockId, blockHash) => {
    setError(''); setInfo('');
    if (!privateKeyInput.trim()) return setError('Paste or load your private key PEM first.');
    setLoading(true);
    try {
      const signatureBase64 = await signMessage(privateKeyInput.trim(), blockHash);
      const { data } = await api.post(`/verifiers/blocks/${blockId}/sign`, { signatureBase64 });
      setInfo(data.message);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Signing failed. Make sure this is your correct private key.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1>🖋️ Multi-Signature Block Finalization</h1>
      <p className="section-note">
        Votes are queued anonymously and only become part of the trusted chain once a quorum
        (2-of-3) of independent signers — admin and verifier accounts — co-sign the proposed
        block. No single account can finalize a block alone.
      </p>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{info}</Alert>

      <div className="card">
        <h3>Your Signing Key</h3>
        {hasKey ? (
          <p>✅ Your account (<strong>{user?.username}</strong>) has a signing key on file.</p>
        ) : (
          <>
            <p>You don't have a signing key yet. Generate one to be able to co-sign blocks.</p>
            <button className="btn btn-primary" onClick={generateKey} disabled={loading}>🔑 Generate Signing Key</button>
          </>
        )}
        {generatedKey && (
          <div className="key-box mt-8">
            <Alert type="warning">Save this private key now — it is never stored on the server and cannot be recovered.</Alert>
            <textarea readOnly className="form-textarea key-textarea" value={generatedKey} rows={8} />
            <button className="btn btn-secondary btn-sm mt-8" onClick={() => downloadTextFile(`${user?.username}-private-key.pem`, generatedKey)}>
              ⬇️ Download as .pem
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Propose a New Block</h3>
        {status && <p>Pending (unproposed) anonymized votes queued: <strong>{status.pendingVotesQueued}</strong> · Finalized blocks: <strong>{status.totalFinalizedBlocks}</strong></p>}
        <button className="btn btn-secondary" onClick={proposeBlock} disabled={loading || !status?.pendingVotesQueued}>
          ⛏️ Propose Block From Queued Votes
        </button>
      </div>

      <div className="card">
        <h3>Sign a Pending Block</h3>
        <div className="form-group">
          <label className="form-label">Your Private Key (paste PEM, or load the .pem file you downloaded)</label>
          <textarea className="form-textarea key-textarea" rows={6} value={privateKeyInput}
            onChange={e => setPrivateKeyInput(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----..." />
          <input type="file" accept=".pem,.txt" className="mt-8"
            onChange={async e => {
              const file = e.target.files[0];
              if (file) setPrivateKeyInput(await file.text());
            }} />
        </div>

        {pending.length === 0 ? <p>No blocks currently awaiting signatures.</p> : (
          <table className="table">
            <thead><tr><th>Index</th><th>Hash</th><th>Signatures</th><th>Signed By</th><th></th></tr></thead>
            <tbody>
              {pending.map(b => (
                <tr key={b._id}>
                  <td>#{b.index}</td>
                  <td className="block-hash">{b.hash.slice(0, 16)}...</td>
                  <td>{b.signatureCount} / {b.requiredSignatures}</td>
                  <td>{b.signedBy.join(', ') || '—'}</td>
                  <td>
                    {b.alreadySignedByMe ? '✅ Signed' : (
                      <button className="btn btn-sm btn-primary" disabled={loading} onClick={() => signBlock(b._id, b.hash)}>Sign</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
