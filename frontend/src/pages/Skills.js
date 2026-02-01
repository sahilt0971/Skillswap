import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Skills.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Skills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchSkills();
  }, [selectedCategory, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`${API_URL}/api/skills?${params}`);
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skills-page">
      <div className="container">
        <div className="skills-header">
          <h1>Browse Skills</h1>
          {user && (
            <Link to="/create-skill" className="btn btn-primary">
              <FiPlus /> Add Skill
            </Link>
          )}
        </div>

        <div className="skills-filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading skills...</div>
        ) : skills.length > 0 ? (
          <div className="grid">
            {skills.map((skill) => {
              const skillId = skill.id || skill._id;
              return (
                <Link key={skillId} to={`/skills/${skillId}`} className="skill-card">
                  <h3>{skill.title}</h3>
                  <span className="category">{skill.category}</span>
                  <span className="level">{skill.level}</span>
                  <p>{skill.description}</p>
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="tags">
                      {skill.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="no-results">
            <p>No skills found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Skills;

