import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InviteModal.css';

const InviteModal = ({ isOpen, onClose, roomId, roomName }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [emailForm, setEmailForm] = useState({
    emails: '',
    message: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch invite code when modal opens
  useEffect(() => {
    const fetchInviteCode = async () => {
      if (!isOpen || !roomId) return;

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/chat/${roomId}/invite-code`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setInviteCode(response.data.inviteCode);
      } catch (error) {
        console.error('Error fetching invite code:', error);
        // Generate a fallback code for demo
        setInviteCode(`ROOM-${roomId.slice(-6).toUpperCase()}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInviteCode();
  }, [isOpen, roomId]);

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({ ...prev, [name]: value }));
    setEmailError('');
    setEmailSuccess('');
  };

  const validateEmails = (emailString) => {
    const emails = emailString.split(',').map(e => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => emailRegex.test(email));
  };

  const handleSendInvites = async () => {
    if (!emailForm.emails.trim()) {
      setEmailError('Please enter at least one email address');
      return;
    }

    if (!validateEmails(emailForm.emails)) {
      setEmailError('Please enter valid email addresses (comma-separated)');
      return;
    }

    setSendingEmail(true);
    setEmailError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/chat/${roomId}/send-invites`,
        {
          emails: emailForm.emails.split(',').map(e => e.trim()),
          customMessage: emailForm.message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmailSuccess('Invitations sent successfully!');
      setEmailForm({ emails: '', message: '' });
      setTimeout(() => setEmailSuccess(''), 3000);
    } catch (error) {
      console.error('Error sending invites:', error);
      setEmailError(error.response?.data?.message || 'Failed to send invitations');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleClose = () => {
    setEmailForm({ emails: '', message: '' });
    setEmailError('');
    setEmailSuccess('');
    setCopied(false);
    setLinkCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  return (
    <>
      {/* Backdrop */}
      <div className="invite-modal-backdrop" onClick={handleClose}></div>

      {/* Modal Container */}
      <div className="invite-modal-container">
        <div className="invite-modal-content">
          
          {/* Close Button */}
          <button className="invite-modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>

          {/* Header */}
          <div className="invite-modal-header">
            <h2 className="invite-modal-title">
              <i className="fas fa-user-plus me-3"></i>Invite Participants
            </h2>
            <p className="invite-modal-subtitle">{roomName || 'Share this room with others'}</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Invite Code Section */}
              <div className="glass-card mb-4">
                <h5 className="section-title">
                  <i className="fas fa-key me-2"></i>Invite Code
                </h5>
                <p className="text-white mb-3">Share this code with participants to join the room</p>
                
                <div className="invite-code-display">
                  <div className="code-box">
                    <span className="code-text">{inviteCode}</span>
                  </div>
                  <button 
                    className="btn btn-copy glass-btn"
                    onClick={handleCopyCode}
                  >
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} me-2`}></i>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Shareable Link Section */}
              <div className="glass-card mb-4">
                <h5 className="section-title">
                  <i className="fas fa-link me-2"></i>Shareable Link
                </h5>
                <p className="text-white mb-3">Or share this direct link</p>
                
                <div className="invite-link-display">
                  <div className="link-box">
                    <span className="link-text">{inviteLink}</span>
                  </div>
                  <button 
                    className="btn btn-copy glass-btn"
                    onClick={handleCopyLink}
                  >
                    <i className={`fas ${linkCopied ? 'fa-check' : 'fa-copy'} me-2`}></i>
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Email Invites Section */}
              <div className="glass-card">
                <h5 className="section-title">
                  <i className="fas fa-envelope me-2"></i>Send Email Invitations
                </h5>
                <p className="text-white mb-3">Invite people directly via email</p>

                {emailSuccess && (
                  <div className="alert alert-success glass-alert-success mb-3">
                    <i className="fas fa-check-circle me-2"></i>{emailSuccess}
                  </div>
                )}

                {emailError && (
                  <div className="alert alert-danger glass-alert-danger mb-3">
                    <i className="fas fa-exclamation-circle me-2"></i>{emailError}
                  </div>
                )}

                <div className="form-group mb-3">
                  <label className="form-label">Email Addresses *</label>
                  <input
                    type="text"
                    name="emails"
                    className="form-control glass-input"
                    value={emailForm.emails}
                    onChange={handleEmailChange}
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <small className="text-muted">Separate multiple emails with commas</small>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Personal Message (Optional)</label>
                  <textarea
                    name="message"
                    className="form-control glass-input"
                    rows="3"
                    value={emailForm.message}
                    onChange={handleEmailChange}
                    placeholder="Add a personal message to your invitation..."
                  />
                </div>

                <button 
                  className="btn btn-primary glass-btn-primary w-100"
                  onClick={handleSendInvites}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>Send Invitations
                    </>
                  )}
                </button>
              </div>

              {/* Quick Share Options */}
              <div className="quick-share-section mt-4">
                <h6 className="text-white mb-3 text-center">Quick Share</h6>
                <div className="share-buttons">
                  <button 
                    className="share-btn whatsapp"
                    onClick={() => window.open(`https://wa.me/?text=Join my Secret Santa room! Use code: ${inviteCode} or visit: ${inviteLink}`, '_blank')}
                  >
                    <i className="fab fa-whatsapp"></i>
                    <span>WhatsApp</span>
                  </button>
                  <button 
                    className="share-btn telegram"
                    onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=Join my Secret Santa room!`, '_blank')}
                  >
                    <i className="fab fa-telegram"></i>
                    <span>Telegram</span>
                  </button>
                  <button 
                    className="share-btn messenger"
                    onClick={() => window.open(`fb-messenger://share?link=${encodeURIComponent(inviteLink)}`, '_blank')}
                  >
                    <i className="fab fa-facebook-messenger"></i>
                    <span>Messenger</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default InviteModal;
