import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomSettingsModal.css';

const RoomSettingsModal = ({ isOpen, onClose, roomId }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [roomData, setRoomData] = useState({
    roomName: '',
    description: '',
    maxParticipants: 10,
    drawDate: '',
    giftBudget: 50,
    isPrivate: false,
    allowWishlist: true,
    allowChat: true,
    theme: 'christmas'
  });

  useEffect(() => {
    const fetchRoomData = async () => {
      if (!isOpen || !roomId) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/room/${roomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setRoomData({
          roomName: response.data.roomName || '',
          description: response.data.description || '',
          maxParticipants: response.data.maxParticipants || 10,
          drawDate: response.data.drawDate || '',
          giftBudget: response.data.giftBudget || 50,
          isPrivate: response.data.isPrivate || false,
          allowWishlist: response.data.allowWishlist !== false,
          allowChat: response.data.allowChat !== false,
          theme: response.data.theme || 'christmas'
        });
      } catch (error) {
        console.error('Error fetching room data:', error);
        alert('Failed to load room settings');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [isOpen, roomId]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    if (!roomId) {
      alert('No room selected');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/room/${roomId}/settings`,
        roomData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Room settings updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating room settings:', error);
      alert(error.response?.data?.error || 'Failed to update room settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setActiveTab('general');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div className="room-settings-modal-backdrop" onClick={handleClose}></div>

      {/* Modal Container */}
      <div className="room-settings-modal-container">
        <div className="room-settings-modal-content">
          
          {/* Close Button */}
          <button className="room-settings-modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>

          {/* ✅ Loading State */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white mt-3">Loading room settings...</p>
            </div>
          ) : (
            <>
              {/* Modal Header */}
              <div className="modal-header-section">
                <h2 className="modal-title">
                  <i className="fas fa-cog me-3"></i>Room Settings
                </h2>
                <p className="modal-subtitle">
                  {roomData.roomName || 'Configure your Secret Santa room preferences'}
                </p>
              </div>

          {/* Tabs Navigation */}
          <div className="tabs-navigation">
            <button
              className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <i className="fas fa-info-circle me-2"></i>General
            </button>
            <button
              className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              <i className="fas fa-users me-2"></i>Participants
            </button>
            <button
              className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <i className="fas fa-gavel me-2"></i>Rules
            </button>
            <button
              className={`tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              <i className="fas fa-sliders-h me-2"></i>Advanced
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="tab-pane">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-info-circle me-2"></i>Basic Information
                  </h5>

                  <div className="form-group mb-3">
                    <label className="form-label">Room Name</label>
                    <input
                      type="text"
                      name="roomName"
                      className="form-control glass-input"
                      value={roomData.roomName}
                      onChange={handleInputChange}
                      placeholder="e.g., Office Secret Santa 2024"
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-control glass-input"
                      rows="3"
                      value={roomData.description}
                      onChange={handleInputChange}
                      placeholder="Tell participants about this Secret Santa event..."
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Draw Date</label>
                        <input
                          type="date"
                          name="drawDate"
                          className="form-control glass-input"
                          value={roomData.drawDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Gift Budget ($)</label>
                        <input
                          type="number"
                          name="giftBudget"
                          className="form-control glass-input"
                          value={roomData.giftBudget}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Theme</label>
                    <select
                      name="theme"
                      className="form-control glass-input"
                      value={roomData.theme}
                      onChange={handleInputChange}
                    >
                      <option value="christmas">🎄 Christmas</option>
                      <option value="winter">❄️ Winter Wonderland</option>
                      <option value="festive">🎉 Festive</option>
                      <option value="elegant">✨ Elegant</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <div className="tab-pane">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-users me-2"></i>Participant Settings
                  </h5>

                  <div className="form-group mb-3">
                    <label className="form-label">Maximum Participants</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      className="form-control glass-input"
                      value={roomData.maxParticipants}
                      onChange={handleInputChange}
                      min="3"
                      max="100"
                    />
                    <small className="text-muted">Minimum 3 participants required</small>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="isPrivate"
                      id="isPrivate"
                      checked={roomData.isPrivate}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="isPrivate">
                      Private Room (Invite only)
                    </label>
                  </div>

                  <div className="participant-list">
                    <h6 className="mb-3">Current Participants (0)</h6>
                    <div className="empty-state">
                      <i className="fas fa-user-plus fa-3x mb-3 text-muted"></i>
                      <p className="text-muted">No participants yet. Share the room link to invite people!</p>
                      <button className="btn btn-invite mt-2">
                        <i className="fas fa-link me-2"></i>Copy Invite Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <div className="tab-pane">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-gavel me-2"></i>Room Rules
                  </h5>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="allowWishlist"
                      id="allowWishlist"
                      checked={roomData.allowWishlist}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="allowWishlist">
                      Allow Wishlist Creation
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="allowChat"
                      id="allowChat"
                      checked={roomData.allowChat}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="allowChat">
                      Enable Anonymous Chat
                    </label>
                  </div>

                  <div className="rules-info">
                    <h6 className="mb-3">Default Rules:</h6>
                    <ul className="rules-list">
                      <li><i className="fas fa-check text-success me-2"></i>Keep your Secret Santa identity secret</li>
                      <li><i className="fas fa-check text-success me-2"></i>Respect the gift budget limit</li>
                      <li><i className="fas fa-check text-success me-2"></i>Deliver gifts by the specified deadline</li>
                      <li><i className="fas fa-check text-success me-2"></i>Be thoughtful and considerate</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="tab-pane">
                <div className="glass-card">
                  <h5 className="section-title">
                    <i className="fas fa-sliders-h me-2"></i>Advanced Settings
                  </h5>

                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Warning:</strong> Changing these settings may affect the draw results.
                  </div>

                  <div className="form-group mb-3">
                    <label className="form-label">Re-draw Algorithm</label>
                    <select className="form-control glass-input">
                      <option value="random">Random Assignment</option>
                      <option value="balanced">Balanced (No repeats from last year)</option>
                      <option value="fair">Fair Distribution</option>
                    </select>
                  </div>

                  <div className="danger-zone">
                    <h6 className="text-danger mb-3">
                      <i className="fas fa-exclamation-circle me-2"></i>Danger Zone
                    </h6>
                    <button className="btn btn-danger w-100 mb-2">
                      <i className="fas fa-redo me-2"></i>Reset All Assignments
                    </button>
                    <button className="btn btn-danger w-100">
                      <i className="fas fa-trash me-2"></i>Delete Room
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="modal-footer-actions">
            <button className="btn btn-cancel" onClick={handleClose}>
              <i className="fas fa-times me-2"></i>Cancel
            </button>
            <button 
              className="btn btn-save" 
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>Save Settings
                </>
              )}
            </button>
          </div>
        </>
          )}
        </div>
      </div>
    </>
  );
};

export default RoomSettingsModal;