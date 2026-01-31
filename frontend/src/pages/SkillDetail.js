import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SkillDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SkillDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [skillOwner, setSkillOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkillDetails();
  }, [id]);

  const fetchSkillDetails = async () => {
    try {
      const skillRes = await axios.get(`${API_URL}/api/skills/${id}`);
      const skillData = skillRes.data;
      setSkill(skillData);

      // Fetch skill owner details
      if (skillData.userId) {
        try {
          const ownerRes = await axios.get(`${API_URL}/api/users/${skillData.userId}`);
          // Normalize owner object
          const owner = ownerRes.data;
          if (owner._id && !owner.id) {
            owner.id = owner._id;
          }
          setSkillOwner(owner);
        } catch (error) {
          console.error('Error fetching owner:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching skill:', error);
      console.error('Error response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    const userId = user.id || user._id;
    const skillId = skill.id || skill._id;
    const skillUserId = skill.userId;

    if (skillUserId === userId) {
      alert("You can't request a swap for your own skill!");
      return;
    }

    setSubmitting(true);
    try {
      console.log('Creating exchange request:', {
        requesterId: userId,
        providerId: skillUserId,
        requestedSkillId: skillId,
        message: message || 'I would like to learn this skill!',
      });

      const response = await axios.post(`${API_URL}/api/exchanges`, {
        requesterId: userId,
        providerId: skillUserId,
        requestedSkillId: skillId,
        message: message || 'I would like to learn this skill!',
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Exchange request created:', response.data);
      alert('Skill swap request sent successfully!');
      navigate('/exchanges');
    } catch (error) {
      console.error('Error creating exchange:', error);
      console.error('Error response:', error.response);
      alert(error.response?.data?.error || error.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading skill details...</div>;
  }

  if (!skill) {
    return <div className="container">Skill not found</div>;
  }

  return (
    <div className="skill-detail-page">
      <div className="container">
        <div className="skill-detail-card">
          <div className="skill-header">
            <div>
              <h1>{skill.title}</h1>
              <div className="skill-meta">
                <span className="category">{skill.category}</span>
                <span className="level">{skill.level}</span>
              </div>
            </div>
          </div>

          <div className="skill-content">
            <div className="skill-description">
              <h2>Description</h2>
              <p>{skill.description}</p>
            </div>

            {skill.tags && skill.tags.length > 0 && (
              <div className="skill-tags">
                <h3>Tags</h3>
                <div className="tags">
                  {skill.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {skillOwner && (
              <div className="skill-owner">
                <h3>Offered by</h3>
                <div className="owner-info">
                  <p><strong>{skillOwner.firstName} {skillOwner.lastName}</strong></p>
                  <p className="username">@{skillOwner.username}</p>
                  {skillOwner.bio && <p className="bio">{skillOwner.bio}</p>}
                </div>
              </div>
            )}

            {user && skill.userId !== (user.id || user._id) && (
              <div className="request-section">
                <h3>Request Skill Swap</h3>
                <form onSubmit={handleRequestSwap}>
                  <div className="form-group">
                    <label>Message (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell them why you're interested in learning this skill..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Sending...' : 'Request Skill Swap'}
                  </button>
                </form>
              </div>
            )}

            {user && skill.userId === (user.id || user._id) && (
              <div className="own-skill-notice">
                <p>This is your skill listing. You can manage it from your dashboard.</p>
              </div>
            )}

            {!user && (
              <div className="login-prompt">
                <p>Please <a href="/login">login</a> to request a skill swap.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillDetail;

