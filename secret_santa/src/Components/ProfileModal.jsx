import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import axios from 'axios';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    favoriteColor: '#cc0000',
    profilePic: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        favoriteColor: user.favoriteColor || '#cc0000',
        profilePic: user.profilePic || '/assets/santa-show.png'
      });
    }
  }, [user]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Upload avatar if changed
      let profilePicUrl = formData.profilePic;
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);
        
        const uploadRes = await axios.post(
          'http://localhost:5000/api/auth/upload-avatar',
          formDataUpload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        profilePicUrl = uploadRes.data.avatarUrl;
      }

      // Update profile
      const response = await axios.put(
        'http://localhost:5000/api/auth/profile',
        { ...formData, profilePic: profilePicUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser(response.data.user);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setShowPasswordSection(false);
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div className="profile-modal-backdrop" onClick={handleClose}></div>

      {/* Modal Container */}
      <div className="profile-modal-container">
        <div className="profile-modal-content">
          
          {/* Close Button */}
          <button className="profile-modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>

          {/* Header Section */}
          <div className="profile-header glass-card mb-4">
            <div className="row align-items-center">
              <div className="col-md-3 text-center">
                <div className="avatar-container">
                  <img
                    src={avatarPreview || formData.profilePic}
                    alt="Profile"
                    className="profile-avatar"
                  />
                  {isEditing && (
                    <label htmlFor="avatar-upload" className="avatar-edit-btn">
                      <i className="fas fa-camera"></i>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        hidden
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <h2 className="profile-name">{formData.name}</h2>
                <p className="profile-username">@{formData.username}</p>
                <p className="profile-bio">
                  {formData.bio || 'No bio added yet. Add one to tell others about yourself! 🎅'}
                </p>
              </div>

              <div className="col-md-3 text-end">
                {!isEditing ? (
                  <button 
                    className="btn btn-edit-profile"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="fas fa-edit me-2"></i>Edit Profile
                  </button>
                ) : (
                  <div className="d-flex gap-2 justify-content-end">
                    <button 
                      className="btn btn-save-profile"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>Save
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-cancel-profile"
                      onClick={() => {
                        setIsEditing(false);
                        setAvatarPreview(null);
                        setFormData({
                          name: user.name || '',
                          username: user.username || '',
                          email: user.email || '',
                          bio: user.bio || '',
                          favoriteColor: user.favoriteColor || '#cc0000',
                          profilePic: user.profilePic || '/assets/santa-show.png'
                        });
                      }}
                    >
                      <i className="fas fa-times me-2"></i>Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="row g-4">
            <div className="col-md-6">
              <div className="glass-card">
                <h5 className="section-title">
                  <i className="fas fa-user-circle me-2"></i>Personal Information
                </h5>
                
                <div className="form-group mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control glass-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control glass-input"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control glass-input"
                    value={formData.email}
                    disabled
                  />
                  <small className="text-muted">Email cannot be changed</small>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Bio</label>
                  <textarea
                    name="bio"
                    className="form-control glass-input"
                    rows="3"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Favorite Color</label>
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="color"
                      name="favoriteColor"
                      className="form-control form-control-color"
                      value={formData.favoriteColor}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      style={{ width: '60px', height: '40px' }}
                    />
                    <span className="text-muted">{formData.favoriteColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="col-md-6">
              <div className="glass-card mb-4">
                <h5 className="section-title">
                  <i className="fas fa-shield-alt me-2"></i>Account Security
                </h5>
                
                <div className="mb-3">
                  <p className="text-muted mb-2">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Email Verified
                  </p>
                  <p className="text-muted mb-2">
                    <i className="fas fa-calendar me-2"></i>
                    Member since: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  className="btn btn-change-password w-100"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                >
                  <i className="fas fa-key me-2"></i>
                  {showPasswordSection ? 'Hide' : 'Change'} Password
                </button>

                {showPasswordSection && (
                  <div className="mt-3 password-section">
                    <div className="form-group mb-3">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        className="form-control glass-input"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        className="form-control glass-input"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control glass-input"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      className="btn btn-save-password w-100"
                      onClick={handleChangePassword}
                    >
                      <i className="fas fa-save me-2"></i>Update Password
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Card */}
              <div className="glass-card">
                <h5 className="section-title">
                  <i className="fas fa-chart-line me-2"></i>Your Activity
                </h5>
                
                <div className="stats-grid">
                  <div className="stat-item">
                    <i className="fas fa-gift stat-icon"></i>
                    <div>
                      <div className="stat-value">5</div>
                      <div className="stat-label">Wishlist Items</div>
                    </div>
                  </div>

                  <div className="stat-item">
                    <i className="fas fa-users stat-icon"></i>
                    <div>
                      <div className="stat-value">12</div>
                      <div className="stat-label">Village Members</div>
                    </div>
                  </div>

                  <div className="stat-item">
                    <i className="fas fa-comments stat-icon"></i>
                    <div>
                      <div className="stat-value">48</div>
                      <div className="stat-label">Messages Sent</div>
                    </div>
                  </div>

                  <div className="stat-item">
                    <i className="fas fa-lightbulb stat-icon"></i>
                    <div>
                      <div className="stat-value">3</div>
                      <div className="stat-label">Clues Given</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProfileModal;