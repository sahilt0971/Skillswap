import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiUsers, FiBook, FiRefreshCw } from 'react-icons/fi';
import './Home.css';

function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to SkillSwap</h1>
        <p className="hero-subtitle">Exchange your skills with others and learn something new!</p>
        {!user && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started <FiArrowRight />
            </Link>
            <Link to="/skills" className="btn btn-secondary btn-large">
              Browse Skills
            </Link>
          </div>
        )}
        {user && (
          <div className="hero-actions">
            <Link to="/dashboard" className="btn btn-primary btn-large">
              Go to Dashboard <FiArrowRight />
            </Link>
          </div>
        )}
      </div>

      <div className="features">
        <div className="container">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <FiUsers className="feature-icon" />
              <h3>Connect</h3>
              <p>Connect with people who have skills you want to learn</p>
            </div>
            <div className="feature-card">
              <FiBook className="feature-icon" />
              <h3>Learn</h3>
              <p>Exchange your expertise for new knowledge and skills</p>
            </div>
            <div className="feature-card">
              <FiRefreshCw className="feature-icon" />
              <h3>Swap</h3>
              <p>Create skill swap requests and start learning together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;



