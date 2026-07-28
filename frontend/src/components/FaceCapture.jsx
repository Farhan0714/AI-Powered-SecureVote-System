import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

// Free, publicly-hosted face-api.js model weights (loaded once per session, cached by the browser).
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

// Liveness check tuning: how much horizontal head movement (relative to face width)
// counts as a genuine head turn, vs. how many samples we track.
const LIVENESS_SAMPLE_MS = 180;
const LIVENESS_WINDOW = 30; // ~5.4s of samples at the interval above
const LIVENESS_DISPLACEMENT_THRESHOLD = 0.12; // normalized by face box width

let modelsLoadedPromise = null;
function loadModels() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
  }
  return modelsLoadedPromise;
}

/**
 * Webcam-based face capture WITH a basic active-liveness check: the user must visibly
 * turn their head left/right before the Capture button unlocks, which helps reject a
 * static printed photo held up to the camera (a known weakness of descriptor-only face
 * matching - see project README for the honest limitations of this approach).
 *
 * Calls onCapture({ descriptor, image, livenessVerified }) once captured, or
 * onCapture(null) if the user retakes.
 */
export default function FaceCapture({ onCapture, label = 'Face Verification' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const livenessSamplesRef = useRef([]);
  const livenessIntervalRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | scanning | captured | error
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(null);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0); // 0-1, for a simple progress hint

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await loadModels();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
        startLivenessTracking();
      } catch (err) {
        setError('Could not access camera or load face models. Please allow camera access and check your connection.');
        setStatus('error');
      }
    }
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startLivenessTracking() {
    livenessSamplesRef.current = [];
    livenessIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || livenessVerified) return;
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        if (!detection) return;

        const box = detection.detection.box;
        const nose = detection.landmarks.getNose();
        const noseTipX = nose[3]?.x ?? nose[0].x; // tip of the nose landmark
        const normalizedX = (noseTipX - box.x) / box.width;

        const samples = livenessSamplesRef.current;
        samples.push(normalizedX);
        if (samples.length > LIVENESS_WINDOW) samples.shift();

        if (samples.length >= 6) {
          const displacement = Math.max(...samples) - Math.min(...samples);
          setLivenessProgress(Math.min(1, displacement / LIVENESS_DISPLACEMENT_THRESHOLD));
          if (displacement >= LIVENESS_DISPLACEMENT_THRESHOLD) {
            setLivenessVerified(true);
            clearInterval(livenessIntervalRef.current);
          }
        }
      } catch {
        // ignore transient detection failures between frames
      }
    }, LIVENESS_SAMPLE_MS);
  }

  const capture = async () => {
    if (!videoRef.current) return;
    setStatus('scanning');
    setError('');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please center your face in the frame and try again.');
        setStatus('ready');
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/jpeg', 0.8);
      const descriptor = Array.from(detection.descriptor);

      setCaptured(image);
      setStatus('captured');
      onCapture({ descriptor, image, livenessVerified });
    } catch (err) {
      setError('Face capture failed. Please try again.');
      setStatus('ready');
    }
  };

  const retake = () => {
    setCaptured(null);
    setStatus('ready');
    setLivenessVerified(false);
    setLivenessProgress(0);
    onCapture(null);
    startLivenessTracking();
  };

  return (
    <div className="face-capture">
      <p className="form-label">{label}</p>
      {error && <div className="alert alert-error"><div className="alert-icon">❌</div><div>{error}</div></div>}

      {captured ? (
        <div className="face-capture-preview">
          <img src={captured} alt="Captured face" />
          <p className="liveness-status">{livenessVerified ? '✅ Liveness verified (head-turn detected)' : '⚠️ Liveness not confirmed'}</p>
          <button type="button" className="btn btn-secondary btn-sm mt-8" onClick={retake}>🔄 Retake</button>
        </div>
      ) : (
        <div className="face-capture-live">
          <video ref={videoRef} muted playsInline className="face-video" />

          {status === 'ready' && !livenessVerified && (
            <div className="liveness-hint">
              <p>👉 Slowly turn your head left, then right, to verify you're a live person.</p>
              <div className="liveness-bar"><div className="liveness-bar-fill" style={{ width: `${livenessProgress * 100}%` }} /></div>
            </div>
          )}
          {livenessVerified && <p className="liveness-status">✅ Liveness verified!</p>}

          <button
            type="button"
            className="btn btn-primary btn-sm mt-8"
            onClick={capture}
            disabled={status === 'loading' || status === 'scanning' || status === 'error' || !livenessVerified}
          >
            {status === 'loading' && '⏳ Loading camera...'}
            {status === 'ready' && !livenessVerified && '↔️ Turn head to unlock capture'}
            {status === 'ready' && livenessVerified && '📸 Capture Face'}
            {status === 'scanning' && '🔍 Scanning...'}
            {status === 'error' && '⚠️ Camera Unavailable'}
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
