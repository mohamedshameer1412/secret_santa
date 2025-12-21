import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoomSelectorModal.css';
import CreateRoomModal from './CreateRoomModal';

const RoomSelectorModal = ({ isOpen, onClose, onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        console.log('📡 Fetching user rooms...');
        const response = await axios.get(
          'http://localhost:5000/api/chat/my-rooms',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✅ Rooms fetched:', response.data);
        
        // Use real rooms from API, no dummy data fallback
        const fetchedRooms = response.data?.rooms || [];
        console.log('📋 Total rooms found:', fetchedRooms.length);
        setRooms(fetchedRooms);
      } catch (error) {
        console.error('❌ Error fetching rooms:', error);
        console.error('Error details:', error.response?.data);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [isOpen]);

  const handleRoomClick = (roomId) => {
    console.log('🖱️ Room card clicked:', roomId);
    onSelectRoom(roomId);
    onClose();
  };

  const handleRoomCreated = (newRoom) => {
    // Add the newly created room with isAdmin flag
    const roomWithAdmin = {
      ...newRoom,
      isAdmin: true, // Creator is always admin
      participantCount: newRoom.participants?.length || 1,
      maxParticipants: newRoom.maxParticipants || 20
    };
    setRooms((prev) => [roomWithAdmin, ...prev]);
    setIsCreateModalOpen(false);
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

          <button
            className="btn btn-create-room-header"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <i className="fas fa-plus me-2"></i>Create New Room
          </button>

          {/* Header */}
          <div className="selector-header">
            <h2 className="selector-title">
              <i className="fas fa-door-open me-3"></i>Select a Room
            </h2>
            <p className="selector-subtitle">
              Choose which room's settings you want to manage
            </p>
          </div>

          {/* Loading / Empty / Rooms */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white mt-3">Loading your rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox fa-4x mb-3 text-muted"></i>
              <h5 className="text-white mb-2">No Rooms Yet</h5>
              <p className="text-muted">
                You haven't joined or created any Secret Santa rooms yet.
              </p>
              <button
                className="btn btn-create-room mt-3"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <i className="fas fa-plus me-2"></i>Create Your First Room
              </button>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`room-card ${
                    !room.isAdmin ? 'room-card-disabled' : ''
                  }`}
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

                  <h5 className="room-name">{room.name}</h5>
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

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
    </>
  );
};

export default RoomSelectorModal;
