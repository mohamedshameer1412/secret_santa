import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreateRoomModal.css';

const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: 20,
    drawDate: '',
    giftBudget: 50,
    theme: 'christmas',
    isPrivate: false,
    allowWishlist: true,
    allowChat: true,
    anonymousMode: true
  });

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Room name is required');
      return false;
    }
    if (formData.name.trim().length < 3) {
      setError('Room name must be at least 3 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.maxParticipants < 3) {
      setError('At least 3 participants are required');
      return false;
    }
    if (formData.maxParticipants > 100) {
      setError('Maximum 100 participants allowed');
      return false;
    }
    if (formData.giftBudget < 0) {
      setError('Gift budget must be a positive number');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleCreateRoom = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setIsCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/chat/create',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onRoomCreated) {
        onRoomCreated(response.data.room);
      }
      
      handleClose();
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err.response?.data?.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError('');
    setFormData({
      name: '',
      description: '',
      maxParticipants: 20,
      drawDate: '',
      giftBudget: 50,
      theme: 'christmas',
      isPrivate: false,
      allowWishlist: true,
      allowChat: true,
      anonymousMode: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="create-room-backdrop" onClick={handleClose}></div>

      {/* Modal Container */}
      <div className="create-room-container">
        <div className="create-room-content">
          
          {/* Close Button */}
          <button className="create-room-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>

          {/* Header */}
          <div className="create-room-header">
            <h2 className="create-room-title">
              <i className="fas fa-plus-circle me-3"></i>Create New Room
            </h2>
            <p className="create-room-subtitle">Set up your Secret Santa event</p>
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <span className="step-label">Basic Info</span>
            </div>
            <div className={`progress-line ${step > 1 ? 'completed' : ''}`}></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div>
              <span className="step-label">Settings</span>
            </div>
            <div className={`progress-line ${step > 2 ? 'completed' : ''}`}></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <span className="step-label">Review</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger glass-alert">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </div>
          )}

          {/* Step Content */}
          <div className="step-content">
            
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="step-form">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-info-circle me-2"></i>Basic Information
                  </h5>

                  <div className="form-group mb-3">
                    <label className="form-label">Room Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control glass-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Office Secret Santa 2024"
                      autoFocus
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control glass-input"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell participants about this Secret Santa event..."
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Theme</label>
                    <div className="theme-selector">
                      <label className={`theme-option ${formData.theme === 'christmas' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="christmas"
                          checked={formData.theme === 'christmas'}
                          onChange={handleInputChange}
                        />
                        <div className="theme-card christmas-theme">
                          <i className="fas fa-tree"></i>
                          <span>Christmas</span>
                        </div>
                      </label>

                      <label className={`theme-option ${formData.theme === 'winter' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="winter"
                          checked={formData.theme === 'winter'}
                          onChange={handleInputChange}
                        />
                        <div className="theme-card winter-theme">
                          <i className="fas fa-snowflake"></i>
                          <span>Winter</span>
                        </div>
                      </label>

                      <label className={`theme-option ${formData.theme === 'festive' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="festive"
                          checked={formData.theme === 'festive'}
                          onChange={handleInputChange}
                        />
                        <div className="theme-card festive-theme">
                          <i className="fas fa-gifts"></i>
                          <span>Festive</span>
                        </div>
                      </label>

                      <label className={`theme-option ${formData.theme === 'elegant' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="theme"
                          value="elegant"
                          checked={formData.theme === 'elegant'}
                          onChange={handleInputChange}
                        />
                        <div className="theme-card elegant-theme">
                          <i className="fas fa-gem"></i>
                          <span>Elegant</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Settings */}
            {step === 2 && (
              <div className="step-form">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-sliders-h me-2"></i>Event Settings
                  </h5>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Maximum Participants *</label>
                        <input
                          type="number"
                          name="maxParticipants"
                          className="form-control glass-input"
                          value={formData.maxParticipants}
                          onChange={handleInputChange}
                          min="3"
                          max="100"
                        />
                        <small className="text-muted">Minimum 3 required</small>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Gift Budget ($)</label>
                        <input
                          type="number"
                          name="giftBudget"
                          className="form-control glass-input"
                          value={formData.giftBudget}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Draw Date</label>
                    <input
                      type="date"
                      name="drawDate"
                      className="form-control glass-input"
                      value={formData.drawDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <h5 className="section-title mt-4">
                    <i className="fas fa-lock me-2"></i>Privacy & Features
                  </h5>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="isPrivate"
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="isPrivate">
                      <strong>Private Room</strong>
                      <p className="mb-0 text-muted small">Invite only (participants need invite code)</p>
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="anonymousMode"
                      id="anonymousMode"
                      checked={formData.anonymousMode}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="anonymousMode">
                      <strong>Anonymous Mode</strong>
                      <p className="mb-0 text-muted small">Hide real identities in chat</p>
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="allowWishlist"
                      id="allowWishlist"
                      checked={formData.allowWishlist}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="allowWishlist">
                      <strong>Enable Wishlists</strong>
                      <p className="mb-0 text-muted small">Let participants create wish lists</p>
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="allowChat"
                      id="allowChat"
                      checked={formData.allowChat}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="allowChat">
                      <strong>Enable Chat</strong>
                      <p className="mb-0 text-muted small">Allow group messaging</p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="step-form">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-check-circle me-2"></i>Review Your Room
                  </h5>

                  <div className="review-section">
                    <div className="review-item">
                      <strong>Room Name:</strong>
                      <span>{formData.name}</span>
                    </div>
                    <div className="review-item">
                      <strong>Description:</strong>
                      <span>{formData.description || 'No description'}</span>
                    </div>
                    <div className="review-item">
                      <strong>Theme:</strong>
                      <span className="theme-badge">{formData.theme}</span>
                    </div>
                    <div className="review-item">
                      <strong>Max Participants:</strong>
                      <span>{formData.maxParticipants}</span>
                    </div>
                    <div className="review-item">
                      <strong>Gift Budget:</strong>
                      <span>${formData.giftBudget}</span>
                    </div>
                    <div className="review-item">
                      <strong>Draw Date:</strong>
                      <span>{formData.drawDate || 'Not set'}</span>
                    </div>
                  </div>

                  <div className="review-features">
                    <h6 className="mb-3">Enabled Features:</h6>
                    <div className="feature-tags">
                      {formData.isPrivate && <span className="feature-tag"><i className="fas fa-lock me-1"></i>Private</span>}
                      {formData.anonymousMode && <span className="feature-tag"><i className="fas fa-user-secret me-1"></i>Anonymous</span>}
                      {formData.allowWishlist && <span className="feature-tag"><i className="fas fa-list me-1"></i>Wishlists</span>}
                      {formData.allowChat && <span className="feature-tag"><i className="fas fa-comments me-1"></i>Chat</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="create-room-footer">
            {step > 1 && (
              <button
                className="btn btn-secondary glass-btn"
                onClick={handleBack}
                disabled={isCreating}
              >
                <i className="fas fa-arrow-left me-2"></i>Back
              </button>
            )}

            <div className="ms-auto d-flex gap-2">
              <button
                className="btn btn-outline-light glass-btn"
                onClick={handleClose}
                disabled={isCreating}
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  className="btn btn-primary glass-btn-primary"
                  onClick={handleNext}
                >
                  Next<i className="fas fa-arrow-right ms-2"></i>
                </button>
              ) : (
                <button
                  className="btn btn-success glass-btn-success"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>Create Room
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateRoomModal;
