import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './WishlistQuickViewModal.css';

const WishlistQuickViewModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch wishlist when modal opens
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/wishlist',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWishlist(response.data.items || []);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isOpen]);

  // Close on ESC key
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

  const handleManageWishlist = () => {
    onClose();
    navigate('/wishlist');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="wishlist-quick-backdrop" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="wishlist-quick-container">
        <div className="wishlist-quick-content">
          
          {/* Wax Seal Close Button */}
          <button className="wishlist-quick-close" onClick={onClose}>
            <i className="fas fa-snowflake"></i>
          </button>

          {/* Header */}
          <div className="modal-header-section">
            <h2 className="modal-title">My Wishlist</h2>
            <p className="modal-subtitle">A secret scroll for Santa</p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Unfurling the scroll...</p>
            </div>
          ) : wishlist.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <i className="fas fa-feather-alt fa-4x mb-3 text-muted"></i>
              <h5 className="mb-2">The scroll is blank!</h5>
              <p className="text-muted">Start adding wishes to help your Secret Santa.</p>
              <button className="btn btn-add-wishlist mt-3" onClick={handleManageWishlist}>
                <i className="fas fa-pen-fancy me-2"></i>Add Your First Wish
              </button>
            </div>
          ) : (
            /* Wishlist Items */
            <div className="wishlist-items-container">
              {wishlist.map((item, index) => (
                <div 
                  key={item._id} 
                  className="wishlist-preview-item"
                  style={{ '--delay': `${index * 0.1}s` }}
                >
                  {/* Image */}
                  <div className="item-image">
                    <img 
                      src={item.image || 'https://via.placeholder.com/100x100/eee/888?text=Gift'} 
                      alt={item.title}
                    />
                    {item.important && (
                      <div className="important-badge">
                        <i className="fas fa-star"></i>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="item-details">
                    <h6 className="item-title">{item.title}</h6>
                    <p className="item-description">{item.description}</p>
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="item-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-external-link-alt me-1"></i>
                        View Product
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="modal-footer-actions">
            <div className="footer-ribbon"></div>
            <button className="btn btn-manage" onClick={handleManageWishlist}>
              <i className="fas fa-edit me-2"></i>Manage Full List
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default WishlistQuickViewModal;