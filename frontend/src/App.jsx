import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';

/**
 * App.jsx — Root router.
 *
 * Current routes:
 *  /login      → Login page
 *  /register   → Register page
 *  /dashboard  → Dashboard placeholder (post-auth)
 *  /           → Redirects to /login
 *
 * The supabaseClient.js is preserved and can be wired into authService.js
 * when the real backend integration begins.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Catch-all: redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
