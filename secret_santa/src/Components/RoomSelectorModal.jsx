import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomSelectorModal.css';

const RoomSelectorModal = ({ isOpen, onClose, onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch user's rooms when modal opens
  useEffect(() => {
    const fetchRooms = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/room/my-rooms',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // For now, add dummy data if API not ready
        const dummyRooms = [
          {
            _id: 'room1',
            roomName: 'Office Secret Santa 2024',
            description: 'Annual office gift exchange',
            participantCount: 12,
            maxParticipants: 20,
            drawDate: '2024-12-20',
            theme: 'christmas',
            isAdmin: true
          },
          {
            _id: 'room2',
            roomName: 'Family Christmas',
            description: 'Family holiday celebration',
            participantCount: 8,
            maxParticipants: 15,
            drawDate: '2024-12-24',
            theme: 'festive',
            isAdmin: true
          },
          {
            _id: 'room3',
            roomName: 'Friends Gift Swap',
            description: 'Annual friends gathering',
            participantCount: 6,
            maxParticipants: 10,
            drawDate: '2024-12-18',
            theme: 'winter',
            isAdmin: false
          }
        ];
        
        setRooms(response.data?.rooms || dummyRooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        // Use dummy data on error
        setRooms([
          {
            _id: 'room1',
            roomName: 'Office Secret Santa 2024',
            description: 'Annual office gift exchange',
            participantCount: 12,
            maxParticipants: 20,
            drawDate: '2024-12-20',
            theme: 'christmas',
            isAdmin: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [isOpen]);

  const handleRoomClick = (roomId) => {
    onSelectRoom(roomId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="room-selector-backdrop" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="room-selector-container">
        <div className="room-selector-content">
          
          {/* Close Button */}
          <button className="room-selector-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>

          {/* Header */}
          <div className="selector-header">
            <h2 className="selector-title">
              <i className="fas fa-door-open me-3"></i>Select a Room
            </h2>
            <p className="selector-subtitle">Choose which room's settings you want to manage</p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white mt-3">Loading your rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <i className="fas fa-inbox fa-4x mb-3 text-muted"></i>
              <h5 className="text-white mb-2">No Rooms Yet</h5>
              <p className="text-muted">You haven't joined or created any Secret Santa rooms yet.</p>
              <button className="btn btn-create-room mt-3">
                <i className="fas fa-plus me-2"></i>Create Your First Room
              </button>
            </div>
          ) : (
            /* Rooms Grid */
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`room-card ${!room.isAdmin ? 'room-card-disabled' : ''}`}
                  onClick={() => room.isAdmin && handleRoomClick(room._id)}
                >
                  {/* Theme Badge */}
                  <div className="room-theme-badge">
                    {room.theme === 'christmas' && '🎄'}
                    {room.theme === 'winter' && '❄️'}
                    {room.theme === 'festive' && '🎉'}
                    {room.theme === 'elegant' && '✨'}
                  </div>

                  {/* Admin Badge */}
                  {room.isAdmin && (
                    <div className="room-admin-badge">
                      <i className="fas fa-crown"></i> Admin
                    </div>
                  )}

                  {/* Room Info */}
                  <h5 className="room-name">{room.roomName}</h5>
                  <p className="room-description">{room.description}</p>

                  <div className="room-stats">
                    <div className="stat">
                      <i className="fas fa-users me-2"></i>
                      {room.participantCount}/{room.maxParticipants}
                    </div>
                    <div className="stat">
                      <i className="fas fa-calendar me-2"></i>
                      {new Date(room.drawDate).toLocaleDateString()}
                    </div>
                  </div>

                  {!room.isAdmin && (
                    <div className="room-locked-overlay">
                      <i className="fas fa-lock fa-2x mb-2"></i>
                      <p className="mb-0">Only admins can edit settings</p>
                    </div>
                  )}

                  {room.isAdmin && (
                    <div className="room-action">
                      <i className="fas fa-cog me-2"></i>Manage Settings
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default RoomSelectorModal;