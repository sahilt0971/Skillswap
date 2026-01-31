import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import './Exchanges.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Exchanges() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchExchanges();
  }, [filter]);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      params.append('userId', user.id);

      const response = await axios.get(`${API_URL}/api/exchanges?${params}`);
      setExchanges(response.data);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateExchangeStatus = async (exchangeId, status) => {
    try {
      await axios.put(`${API_URL}/api/exchanges/${exchangeId}/status`, { status });
      fetchExchanges();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update exchange');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-pending', icon: <FiClock />, text: 'Pending' },
      accepted: { class: 'badge-accepted', icon: <FiCheck />, text: 'Accepted' },
      rejected: { class: 'badge-rejected', icon: <FiX />, text: 'Rejected' },
      completed: { class: 'badge-completed', icon: <FiCheck />, text: 'Completed' },
      cancelled: { class: 'badge-rejected', icon: <FiX />, text: 'Cancelled' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`badge ${badge.class}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading exchanges...</div>;
  }

  return (
    <div className="exchanges-page">
      <div className="container">
        <h1>My Exchanges</h1>

        <div className="exchange-filters">
          <button
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'accepted' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('accepted')}
          >
            Accepted
          </button>
          <button
            className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {exchanges.length > 0 ? (
          <div className="exchanges-list">
            {exchanges.map((exchange) => (
              <div key={exchange._id} className="exchange-card">
                <div className="exchange-header">
                  <div>
                    <h3>
                      {exchange.requesterId === user.id
                        ? 'You requested'
                        : 'Requested from you'}
                    </h3>
                    {getStatusBadge(exchange.status)}
                  </div>
                </div>

                {exchange.message && (
                  <div className="exchange-message">
                    <strong>Message:</strong> {exchange.message}
                  </div>
                )}

                {exchange.status === 'pending' && exchange.providerId === user.id && (
                  <div className="exchange-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => updateExchangeStatus(exchange._id, 'accepted')}
                    >
                      <FiCheck /> Accept
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => updateExchangeStatus(exchange._id, 'rejected')}
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}

                {exchange.status === 'accepted' && (
                  <div className="exchange-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => updateExchangeStatus(exchange._id, 'completed')}
                    >
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-exchanges">
            <p>No exchanges found. Start by browsing skills and requesting swaps!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Exchanges;

