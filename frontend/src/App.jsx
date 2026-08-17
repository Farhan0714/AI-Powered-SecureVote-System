import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Chatbot from './components/Chatbot.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Register from './pages/Register.jsx';
import Correction from './pages/Correction.jsx';
import Deletion from './pages/Deletion.jsx';
import Submitted from './pages/Submitted.jsx';
import Vote from './pages/Vote.jsx';
import ElectionData from './pages/ElectionData.jsx';
import GrowthAnalysis from './pages/GrowthAnalysis.jsx';
import Results from './pages/Results.jsx';
import AuditTrail from './pages/AuditTrail.jsx';
import BlockSigning from './pages/BlockSigning.jsx';
import VerifierHome from './pages/VerifierHome.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminView from './pages/admin/AdminView.jsx';
import AdminPublishResults from './pages/admin/AdminPublishResults.jsx';
import AdminVotingPhase from './pages/admin/AdminVotingPhase.jsx';
import AdminVerifyBlockchain from './pages/admin/AdminVerifyBlockchain.jsx';
import AdminVerifyVoter from './pages/admin/AdminVerifyVoter.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-container">
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ---- User side ---- */}
            <Route path="/dashboard" element={<ProtectedRoute roles={['user']}><Dashboard /></ProtectedRoute>} />
            <Route path="/register" element={<ProtectedRoute roles={['user']}><Register /></ProtectedRoute>} />
            <Route path="/correct" element={<ProtectedRoute roles={['user']}><Correction /></ProtectedRoute>} />
            <Route path="/delete" element={<ProtectedRoute roles={['user']}><Deletion /></ProtectedRoute>} />
            <Route path="/submitted" element={<ProtectedRoute roles={['user']}><Submitted /></ProtectedRoute>} />
            <Route path="/vote" element={<ProtectedRoute roles={['user']}><Vote /></ProtectedRoute>} />
            <Route path="/election-data" element={<ProtectedRoute roles={['user']}><ElectionData /></ProtectedRoute>} />
            <Route path="/growth-analysis" element={<ProtectedRoute roles={['user']}><GrowthAnalysis /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute roles={['user']}><Results /></ProtectedRoute>} />

            {/* ---- Admin side ---- */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/registrations/:id" element={<ProtectedRoute roles={['admin']}><AdminView /></ProtectedRoute>} />
            <Route path="/admin/verify-voter/:id" element={<ProtectedRoute roles={['admin']}><AdminVerifyVoter /></ProtectedRoute>} />
            <Route path="/admin/publish-results" element={<ProtectedRoute roles={['admin']}><AdminPublishResults /></ProtectedRoute>} />
            <Route path="/admin/voting-phase" element={<ProtectedRoute roles={['admin']}><AdminVotingPhase /></ProtectedRoute>} />
            <Route path="/admin/blockchain" element={<ProtectedRoute roles={['admin']}><AdminVerifyBlockchain /></ProtectedRoute>} />

            {/* ---- Verifier side ---- */}
            <Route path="/verifier" element={<ProtectedRoute roles={['verifier']}><VerifierHome /></ProtectedRoute>} />

            {/* ---- Shared across admin + verifier ---- */}
            <Route path="/block-signing" element={<ProtectedRoute roles={['admin', 'verifier']}><BlockSigning /></ProtectedRoute>} />

            {/* ---- Shared across all authenticated roles ---- */}
            <Route path="/audit-trail" element={<ProtectedRoute roles={['user', 'admin', 'verifier']}><AuditTrail /></ProtectedRoute>} />

            <Route path="*" element={<div className="card"><h2>404 - Page Not Found</h2></div>} />
          </Routes>
        </div>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
