import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiPlus, FiTrendingUp, FiUsers, FiBook } from 'react-icons/fi';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    mySkills: 0,
    exchanges: 0,
    pending: 0,
  });
  const [recentSkills, setRecentSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [skillsRes, exchangesRes] = await Promise.all([
        axios.get(`${API_URL}/api/skills?userId=${user.id}`),
        axios.get(`${API_URL}/api/exchanges?userId=${user.id}`),
      ]);

      const exchanges = exchangesRes.data;
      setStats({
        mySkills: skillsRes.data.length,
        exchanges: exchanges.length,
        pending: exchanges.filter((e) => e.status === 'pending').length,
      });

      const recent = skillsRes.data.slice(0, 3);
      setRecentSkills(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user.firstName}!</h1>
          <Link to="/create-skill" className="btn btn-primary">
            <FiPlus /> Add New Skill
          </Link>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <FiBook className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.mySkills}</h3>
              <p>My Skills</p>
            </div>
          </div>
          <div className="stat-card">
            <FiUsers className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.exchanges}</h3>
              <p>Total Exchanges</p>
            </div>
          </div>
          <div className="stat-card">
            <FiTrendingUp className="stat-icon" />
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending Requests</p>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>My Recent Skills</h2>
            {recentSkills.length > 0 ? (
              <div className="skills-list">
                {recentSkills.map((skill) => {
                  const skillId = skill.id || skill._id;
                  return (
                    <div key={skillId} className="skill-item">
                      <h3>{skill.title}</h3>
                      <span className="category">{skill.category}</span>
                      <Link to={`/skills/${skillId}`} className="btn btn-secondary btn-sm">
                        View Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No skills yet. <Link to="/create-skill">Add your first skill!</Link></p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Link to="/skills" className="action-card">
                <FiBook />
                <span>Browse Skills</span>
              </Link>
              <Link to="/exchanges" className="action-card">
                <FiUsers />
                <span>View Exchanges</span>
              </Link>
              <Link to="/profile" className="action-card">
                <FiTrendingUp />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

