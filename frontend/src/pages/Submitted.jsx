import React from 'react';
import { Link } from 'react-router-dom';

export default function Submitted() {
  return (
    <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
      <h2 style={{ marginBottom: 'var(--space-3)' }}>Registration Submitted</h2>
      <p style={{ color: 'var(--gray-500)', maxWidth: '400px', margin: '0 auto var(--space-6)' }}>
        Your voter registration has been submitted and is pending admin approval.
        You will be notified by email once it's been reviewed.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ width: 'auto' }}>Back to Dashboard</Link>
    </div>
  );
}
