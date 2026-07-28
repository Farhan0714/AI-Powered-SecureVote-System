// Compares two face-api.js descriptors (128-length float arrays) using Euclidean distance.
// This mirrors face-api.js's own euclideanDistance() so the same threshold semantics apply
// (face-api.js recommends ~0.6 as the standard match threshold for its recognition model).
const MATCH_THRESHOLD = 0.6;

function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    throw new Error('Invalid face descriptors supplied for comparison.');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function isFaceMatch(referenceDescriptor, liveDescriptor) {
  const distance = euclideanDistance(referenceDescriptor, liveDescriptor);
  return { isMatch: distance <= MATCH_THRESHOLD, distance };
}

module.exports = { euclideanDistance, isFaceMatch, MATCH_THRESHOLD };
