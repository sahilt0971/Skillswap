import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUser, FiLogOut, FiBell, FiBriefcase } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FiBriefcase className="brand-icon" />
          SkillSwap
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                <FiHome /> Dashboard
              </Link>
              <Link to="/skills" className="nav-link">
                Browse Skills
              </Link>
              <Link to="/exchanges" className="nav-link">
                <FiBell /> Exchanges
              </Link>
              <Link to="/profile" className="nav-link">
                <FiUser /> Profile
              </Link>
              <button onClick={handleLogout} className="nav-link btn-logout">
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/skills" className="nav-link">
                Browse Skills
              </Link>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link btn-register">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

