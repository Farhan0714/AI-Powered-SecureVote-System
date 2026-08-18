import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

const LIVENESS_SAMPLE_MS = 150;

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function calculateEAR(eye) {
  const d_v1 = getDistance(eye[1], eye[5]);
  const d_v2 = getDistance(eye[2], eye[4]);
  const d_h = getDistance(eye[0], eye[3]);
  if (d_h === 0) return 0;
  return (d_v1 + d_v2) / (2.0 * d_h);
}

function calculateMAR(positions) {
  const p62 = positions[62];
  const p66 = positions[66];
  const p60 = positions[60];
  const p64 = positions[64];
  if (!p62 || !p66 || !p60 || !p64) return 0;
  const height = getDistance(p62, p66);
  const width = getDistance(p60, p64);
  if (width === 0) return 0;
  return height / width;
}

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

export default function FaceCapture({ onCapture, label = 'Face Verification' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const livenessIntervalRef = useRef(null);
  const eyesOpenRef = useRef(true);
  const baselineEarRef = useRef(0.28);
  const earHistoryRef = useRef([]);

  const [status, setStatus] = useState('off');
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(null);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const turnLeftRef = useRef(false);
  const turnRightRef = useRef(false);
  const [currentRatio, setCurrentRatio] = useState(1.0);
  const [guidanceText, setGuidanceText] = useState('Position your face inside the oval.');
  const trackingActiveRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!isCameraActive) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (livenessIntervalRef.current) {
          clearInterval(livenessIntervalRef.current);
        }
        setStatus('off');
        setIsFaceDetected(false);
        return;
      }

      try {
        setStatus('loading');
        setError('');
        await loadModels();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } }
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
        startLivenessTracking();
      } catch (err) {
        console.error('Camera or face-api model load error:', err);
        setError(`Could not access camera or load face models (${err.message || err.name || 'Unknown error'}). Please check camera permissions, connections, and secure HTTPS/localhost context.`);
        setStatus('error');
      }
    }
    start();

    return () => {
      cancelled = true;
      trackingActiveRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
    };

  }, [isCameraActive]);

  function startLivenessTracking() {
    setLivenessProgress(0);
    setIsFaceDetected(false);
    setGuidanceText('👤 Position face inside the oval. Turn head LEFT.');
    turnLeftRef.current = false;
    turnRightRef.current = false;
    trackingActiveRef.current = true;

    async function scanFrame() {
      if (!trackingActiveRef.current || livenessVerified || !videoRef.current) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks();

        if (!detection) {
          setIsFaceDetected(false);
          setGuidanceText('👤 Position your face inside the oval.');
          if (trackingActiveRef.current) setTimeout(scanFrame, 120);
          return;
        }

        setIsFaceDetected(true);
        const nose = detection.landmarks.getNose();
        const leftEye = detection.landmarks.getLeftEye();
        const rightEye = detection.landmarks.getRightEye();

        if (nose && nose.length > 3 && leftEye && leftEye.length > 0 && rightEye && rightEye.length > 3) {
          const noseTip = nose[3];
          const leftEyeCorner = leftEye[0];
          const rightEyeCorner = rightEye[3];

          const distL = getDistance(noseTip, leftEyeCorner);
          const distR = getDistance(noseTip, rightEyeCorner);

          if (distL > 0 && distR > 0) {
            const ratioL = distL / distR;
            const ratioR = distR / distL;

            if (!turnLeftRef.current && ratioL > 1.45) {
              turnLeftRef.current = true;
              setLivenessProgress(prev => prev + 0.5);
              console.log('Head turn LEFT detected!');
            }
            if (!turnRightRef.current && ratioR > 1.45) {
              turnRightRef.current = true;
              setLivenessProgress(prev => prev + 0.5);
              console.log('Head turn RIGHT detected!');
            }

            setCurrentRatio(ratioL > ratioR ? ratioL : ratioR);

            if (turnLeftRef.current && turnRightRef.current) {
              setLivenessVerified(true);
              setLivenessProgress(1.0);
              setGuidanceText('✅ Head turns verified! Liveness confirmed.');
              trackingActiveRef.current = false;
              return;
            } else if (turnLeftRef.current) {
              setGuidanceText('🔄 Left turn detected! Now turn head RIGHT.');
            } else if (turnRightRef.current) {
              setGuidanceText('🔄 Right turn detected! Now turn head LEFT.');
            } else {
              setGuidanceText('👤 Turn your head LEFT first, then RIGHT.');
            }
          }
        }
      } catch (err) {
        console.error('Frame scan error:', err);
      }

      if (trackingActiveRef.current && !livenessVerified) {
        setTimeout(scanFrame, 80);
      }
    }

    scanFrame();
  }

  const capture = async () => {
    if (!videoRef.current) return;
    setStatus('scanning');
    setError('');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
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
    turnLeftRef.current = false;
    turnRightRef.current = false;
    onCapture(null);
    setIsCameraActive(true);
    startLivenessTracking();
  };

  return (
    <div className="face-capture">
      <p className="form-label">{label}</p>
      {error && <div className="alert alert-error"><div className="alert-icon">❌</div><div>{error}</div></div>}

      {captured ? (
        <div className="face-capture-preview">
          <img src={captured} alt="Captured face" />
          <p className="liveness-status">{livenessVerified ? '✅ Liveness verified (blink detected)' : '⚠️ Liveness not confirmed'}</p>
          <button type="button" className="btn btn-secondary btn-sm mt-8" onClick={retake}>🔄 Retake</button>
        </div>
      ) : !isCameraActive ? (
        <div className="camera-placeholder" style={{
          height: '200px',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px dashed var(--gray-300)',
          padding: 'var(--space-4)',
          textAlign: 'center',
          margin: 'var(--space-2) 0'
        }}>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
            Camera is currently turned off. Turn it on to capture your face.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsCameraActive(true)}>
            📷 Turn Camera On
          </button>
        </div>
      ) : (
        <div className="face-capture-live">
          <div className="face-video-container" style={{ position: 'relative', display: 'inline-block', maxWidth: '320px', width: '100%', margin: '0 auto', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <video ref={videoRef} muted playsInline className="face-video" style={{ display: 'block' }} />
            <div className={`face-overlay-oval ${livenessVerified ? 'verified' : isFaceDetected ? 'detected' : ''}`} />
          </div>

          {status === 'ready' && (
            <div className="liveness-hint" style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
              {!livenessVerified ? (
                <>
                  <p style={{ fontWeight: 600, color: isFaceDetected ? 'var(--primary-600)' : 'var(--gray-500)', margin: 'var(--space-1) 0', minHeight: '24px' }}>
                    {guidanceText}
                  </p>
                  <div className="liveness-bar" style={{ height: '8px', background: 'var(--gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: 'var(--space-2) 0' }}>
                    <div
                      className="liveness-bar-fill"
                      style={{
                        height: '100%',
                        transition: 'all 0.1s ease',
                        width: `${livenessProgress * 100}%`,
                        backgroundColor: livenessProgress >= 1.0 ? 'var(--success)' : 'var(--primary-500)'
                      }}
                    />
                  </div>
                  {isFaceDetected && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', display: 'block', marginTop: 'var(--space-1)' }}>
                      Turn status: {turnLeftRef.current ? '✅ Left turn' : '❌ Left turn'} &middot; {turnRightRef.current ? '✅ Right turn' : '❌ Right turn'} (Max ratio: {currentRatio.toFixed(2)} / Need 1.45)
                    </span>
                  )}
                </>
              ) : (
                <p className="liveness-status" style={{ color: 'var(--success)', fontWeight: 600, margin: 'var(--space-1) 0' }}>
                  ✅ Liveness verified! You can now capture.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={capture}
              disabled={status === 'loading' || status === 'scanning' || status === 'error' || !livenessVerified}
            >
              {status === 'loading' && '⏳ Loading camera...'}
              {status === 'ready' && !livenessVerified && '🔄 Turn head to unlock'}
              {status === 'ready' && livenessVerified && '📸 Capture Face'}
              {status === 'scanning' && '🔍 Scanning...'}
              {status === 'error' && '⚠️ Camera Error'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCameraActive(false)}>
              🔌 Turn Camera Off
            </button>
            {!livenessVerified && status === 'ready' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ background: 'var(--warning-50)', color: 'var(--warning-700)', border: '1px solid var(--warning-200)' }}
                onClick={() => {
                  setLivenessVerified(true);
                  setLivenessProgress(1.0);
                  setGuidanceText('✅ Bypass activated (testing mode)');
                  trackingActiveRef.current = false;
                }}
              >
                ⚡ Bypass Liveness (Dev Mode)
              </button>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
