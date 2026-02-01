import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import SkillDetail from './pages/SkillDetail';
import Profile from './pages/Profile';
import Exchanges from './pages/Exchanges';
import CreateSkill from './pages/CreateSkill';
import Diagnostics from './pages/Diagnostics';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/skills" element={<Skills />} />
      <Route path="/skills/:id" element={<SkillDetail />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exchanges"
        element={
          <ProtectedRoute>
            <Exchanges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-skill"
        element={
          <ProtectedRoute>
            <CreateSkill />
          </ProtectedRoute>
        }
      />
      <Route path="/diagnostics" element={<Diagnostics />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <div className="App">
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

