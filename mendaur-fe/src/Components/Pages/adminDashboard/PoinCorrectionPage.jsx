/**
 * Superadmin Poin Correction Page
 * Superadmin-only feature to correct user poin with audit trail
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, Trash2, Check, X } from 'lucide-react';
import api from '../../../services/apiClient.js';
import authService from '../../../services/authService.js';
import './PoinCorrectionPage.css';

const PoinCorrectionPage = () => {
  const [users, setUsers] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('correct'); // 'correct' or 'history'

  // Form state for correction
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPoin, setNewPoin] = useState('');
  const [reason, setReason] = useState('');
  const [correctionType, setCorrectionType] = useState('correction');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user is Superadmin
  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      setError('Access Denied. Only Superadmin can access this page.');
      return;
    }

    loadUsers();
    loadCorrections();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=100');
      const usersData = response.data?.users || response.data?.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  const loadCorrections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/poin-corrections?limit=20');
      const correctionsData = response.data?.corrections || response.data?.data || [];
      setCorrections(Array.isArray(correctionsData) ? correctionsData : []);
      setError('');
    } catch (err) {
      console.error('Error loading corrections:', err);
      if (err.status === 403) {
        setError('You do not have permission to view correction history.');
      } else {
        setError('Failed to load correction history.');
      }
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrectPoin = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }
    if (!newPoin || isNaN(newPoin) || parseInt(newPoin) < 0) {
      setError('Please enter a valid poin value (0 or greater)');
      return;
    }
    if (reason.length < 10 || reason.length > 500) {
      setError('Reason must be between 10 and 500 characters');
      return;
    }

    try {
      setSubmitting(true);

      await api.patch(`/admin/users/${selectedUserId}/poin`, {
        new_poin: parseInt(newPoin),
        reason: reason.trim(),
        type: correctionType,
        notes: notes.trim() || null,
      });

      // Success
      alert('Poin correction submitted successfully!');

      // Clear form
      setSelectedUserId('');
      setNewPoin('');
      setReason('');
      setNotes('');
      setCorrectionType('correction');

      // Reload corrections
      await loadCorrections();

      // Switch to history tab
      setActiveTab('history');
    } catch (err) {
      console.error('Error correcting poin:', err);
      if (err.status === 422) {
        const errors = err.response?.errors || {};
        setError(`Validation error: ${Object.values(errors).join(', ')}`);
      } else {
        setError(`Failed to correct poin: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverseCorrection = async (correctionId) => {
    if (!window.confirm('Are you sure you want to reverse this correction?')) {
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/admin/poin-corrections/${correctionId}/reverse`, {
        reason: 'Correction reversed by superadmin',
      });

      alert('Correction reversed successfully!');
      await loadCorrections();
    } catch (err) {
      console.error('Error reversing correction:', err);
      alert(`Failed to reverse correction: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentPoin = (userId) => {
    const user = users.find(u => u.user_id === parseInt(userId));
    return user?.actual_poin ?? user?.display_poin ?? user?.poin ?? 0;
  };

  const getPoinDifference = () => {
    const current = getCurrentPoin(selectedUserId);
    const difference = parseInt(newPoin || 0) - current;
    return difference > 0 ? `+${difference}` : `${difference}`;
  };

  if (error && !selectedUserId && activeTab === 'correct') {
    return (
      <div className="poin-correction-container">
        <div className="poin-error">
          <AlertCircle size={40} />
          <p>{error}</p>
          <a href="/admin/dashboard">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="poin-correction-container">
      <div className="poin-correction-card">
        <h2>💰 Poin Correction Management</h2>
        <p className="subtitle">Superadmin Only - Correct user poin with audit trail</p>

        {error && (
          <div className="poin-error-message">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'correct' ? 'active' : ''}`}
            onClick={() => setActiveTab('correct')}
          >
            ➕ Correct Poin
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Correction History
          </button>
        </div>

        {/* Correct Poin Tab */}
        {activeTab === 'correct' && (
          <form onSubmit={handleCorrectPoin} className="correction-form">
            <div className="form-group">
              <label htmlFor="user">Select User:</label>
              <select
                id="user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="">-- Choose a user --</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.nama} ({user.email}) - Current: {user.actual_poin ?? user.display_poin ?? 0} poin
                  </option>
                ))}
              </select>
            </div>

            {selectedUserId && (
              <div className="current-poin-info">
                <span>Current Poin: <strong>{getCurrentPoin(selectedUserId)}</strong></span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPoin">New Poin Value:</label>
              <input
                id="newPoin"
                type="number"
                min="0"
                max="999999"
                value={newPoin}
                onChange={(e) => setNewPoin(e.target.value)}
                disabled={submitting}
                placeholder="Enter new poin value"
                required
              />
            </div>

            {selectedUserId && newPoin && (
              <div className="poin-difference">
                <span>Difference: <strong>{getPoinDifference()}</strong></span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="type">Correction Type:</label>
              <select
                id="type"
                value={correctionType}
                onChange={(e) => setCorrectionType(e.target.value)}
                disabled={submitting}
              >
                <option value="correction">Correction</option>
                <option value="reversal">Reversal</option>
                <option value="fraud_prevention">Fraud Prevention</option>
                <option value="system_fix">System Fix</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason (10-500 characters):</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
                placeholder="Explain why this correction is needed..."
                rows="4"
                minLength="10"
                maxLength="500"
                required
              />
              <small>{reason.length}/500 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes (Optional):</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
                placeholder="Add any additional information..."
                rows="3"
                maxLength="1000"
              />
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader size={18} className="spinner" />
                  Submitting...
                </>
              ) : (
                '✓ Confirm Correction'
              )}
            </button>
          </form>
        )}

        {/* Correction History Tab */}
        {activeTab === 'history' && (
          <div className="correction-history">
            {loading ? (
              <div className="loading-state">
                <Loader className="spinner" />
                <p>Loading correction history...</p>
              </div>
            ) : corrections.length > 0 ? (
              <div className="corrections-list">
                {corrections.map(correction => (
                  <div key={correction.poin_correction_id} className="correction-item">
                    <div className="correction-header">
                      <h4>{correction.nasabah_name || 'Unknown User'}</h4>
                      <span className={`type-badge badge-${correction.type}`}>
                        {correction.type.toUpperCase()}
                      </span>
                    </div>

                    <div className="correction-details">
                      <div className="detail-row">
                        <span className="label">Old Value:</span>
                        <span className="value">{correction.old_value} poin</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">New Value:</span>
                        <span className="value">{correction.new_value} poin</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Difference:</span>
                        <span className={`value ${correction.difference >= 0 ? 'positive' : 'negative'}`}>
                          {correction.difference >= 0 ? '+' : ''}{correction.difference}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Reason:</span>
                        <span className="value">{correction.reason}</span>
                      </div>
                      {correction.notes && (
                        <div className="detail-row">
                          <span className="label">Notes:</span>
                          <span className="value">{correction.notes}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">Corrected By:</span>
                        <span className="value">{correction.corrected_by_name || 'System'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Date:</span>
                        <span className="value">{new Date(correction.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {!correction.is_reversed && (
                      <button
                        className="btn-reverse"
                        onClick={() => handleReverseCorrection(correction.poin_correction_id)}
                        disabled={submitting}
                        title="Reverse this correction"
                      >
                        <X size={16} /> Reverse
                      </button>
                    )}

                    {correction.is_reversed && (
                      <div className="reversed-badge">
                        ✓ Reversed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No poin corrections found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoinCorrectionPage;
