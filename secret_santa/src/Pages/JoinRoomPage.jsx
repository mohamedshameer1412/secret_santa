import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../context/useAuth';
import './JoinRoomPage.css';

const JoinRoomPage = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    const fetchRoomInfo = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            // Get room info by invite code (preview endpoint doesn't require auth)
            const response = await axios.get(
                `http://localhost:5000/api/chat/preview/${inviteCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRoomInfo(response.data.room);
        } catch (error) {
            console.error('Error fetching room info:', error);
            setError(error.response?.data?.message || 'Invalid invite code');
        } finally {
            setLoading(false);
        }
    }, [inviteCode]);

    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            // Redirect to login with return URL
            navigate(`/login?redirect=/join/${inviteCode}`);
            return;
        }

        fetchRoomInfo();
    }, [user, authLoading, inviteCode, navigate, fetchRoomInfo]);

    const handleJoinRoom = async () => {
        setJoining(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/chat/join/${inviteCode}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire({
                icon: 'success',
                title: 'Welcome!',
                text: response.data.message,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });

            // Redirect to the room
            setTimeout(() => {
                navigate(`/group-chat/${response.data.room._id}`);
            }, 2000);
        } catch (error) {
            console.error('Error joining room:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to join',
                text: error.response?.data?.message || 'Could not join room',
                confirmButtonColor: '#cc0000'
            });
        } finally {
            setJoining(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="join-room-container">
                <div className="join-room-loading">
                    <div className="spinner-border text-danger" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading room information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="join-room-container">
                <div className="join-room-card glass-card">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <h2>Invalid Invite</h2>
                    <p className="text-muted">{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/dashboard')}
                    >
                        <i className="fas fa-home me-2"></i>Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="join-room-container">
            <div className="join-room-card glass-card">
                <div className="festive-header">
                    <i className="fas fa-gift gift-icon"></i>
                    <h2>You're Invited!</h2>
                </div>

                <div className="room-preview">
                    <div className="room-icon">
                        {roomInfo?.roomType === 'secret-santa' ? (
                            <i className="fas fa-gifts"></i>
                        ) : (
                            <i className="fas fa-comments"></i>
                        )}
                    </div>
                    
                    <h3 className="room-name">{roomInfo?.name}</h3>
                    
                    {roomInfo?.description && (
                        <p className="room-description">{roomInfo.description}</p>
                    )}

                    <div className="room-details">
                        <div className="detail-item">
                            <i className="fas fa-user-shield"></i>
                            <div>
                                <small className="text-muted">Organized by</small>
                                <p className="mb-0">{roomInfo?.organizer?.username}</p>
                            </div>
                        </div>

                        <div className="detail-item">
                            <i className="fas fa-users"></i>
                            <div>
                                <small className="text-muted">Participants</small>
                                <p className="mb-0">
                                    {roomInfo?.participantCount || 0} / {roomInfo?.maxParticipants || 20}
                                </p>
                            </div>
                        </div>

                        {roomInfo?.theme && (
                            <div className="detail-item">
                                <i className="fas fa-palette"></i>
                                <div>
                                    <small className="text-muted">Theme</small>
                                    <p className="mb-0 text-capitalize">{roomInfo.theme}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {roomInfo?.roomType === 'secret-santa' && (
                        <div className="secret-santa-badge">
                            <i className="fas fa-snowflake me-2"></i>
                            Secret Santa Event
                        </div>
                    )}
                </div>

                <div className="join-actions">
                    <button 
                        className="btn btn-success btn-lg w-100"
                        onClick={handleJoinRoom}
                        disabled={joining}
                    >
                        {joining ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Joining...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt me-2"></i>
                                Join Room
                            </>
                        )}
                    </button>
                    
                    <button 
                        className="btn btn-outline-secondary mt-2 w-100"
                        onClick={() => navigate('/dashboard')}
                    >
                        <i className="fas fa-arrow-left me-2"></i>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinRoomPage;
