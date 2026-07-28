import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_HOME = { admin: '/admin', verifier: '/verifier', user: '/dashboard' };

/**
 * roles: optional array of allowed roles, e.g. ['admin'], ['admin','verifier'].
 * If omitted, defaults to the regular 'user' role only (existing behavior preserved).
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const allowed = roles || ['user'];

  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;

  return children;
}
