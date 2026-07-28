import React from 'react';
import { Link } from 'react-router-dom';

export default function Submitted() {
  return (
    <div className="card text-center">
      <h2>✅ Registration Submitted</h2>
      <p>Your voter registration has been submitted and is pending admin approval. You'll be able to vote once approved.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  );
}
