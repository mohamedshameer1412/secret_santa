import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './MyAssignmentCard.css';

const MyAssignmentCard = ({ roomId }) => {
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [revealed, setRevealed] = useState(false);

    const fetchAssignment = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/chat/${roomId}/my-assignment`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignment(response.data.assignment);
        } catch (error) {
            console.error('Error fetching assignment:', error);
            setError(error.response?.data?.message || 'Names not drawn yet');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchAssignment();
    }, [fetchAssignment]);

    const handleReveal = () => {
        setRevealed(true);
    };

    if (loading) {
        return (
            <div className="assignment-card">
                <div className="assignment-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading your assignment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="assignment-card assignment-error">
                <i className="fas fa-info-circle"></i>
                <p>{error}</p>
            </div>
        );
    }

    if (!assignment) {
        return null;
    }

    return (
        <div className="assignment-card">
            <div className="assignment-header">
                <i className="fas fa-gifts"></i>
                <h3>Your Secret Santa Assignment</h3>
            </div>

            {!revealed ? (
                <div className="assignment-reveal-section">
                    <div className="gift-box-animation">
                        <i className="fas fa-gift fa-3x"></i>
                    </div>
                    <p className="reveal-text">Click below to reveal who you're gifting to!</p>
                    <button className="btn-reveal" onClick={handleReveal}>
                        <i className="fas fa-eye"></i> Reveal My Assignment
                    </button>
                </div>
            ) : (
                <div className="assignment-revealed animate__animated animate__zoomIn">
                    <div className="receiver-section">
                        <div className="receiver-header">
                            <i className="fas fa-snowflake"></i>
                            <span>You're gifting to:</span>
                            <i className="fas fa-snowflake"></i>
                        </div>
                        
                        <div className="receiver-profile">
                            {assignment.receiverProfilePic ? (
                                <img 
                                    src={assignment.receiverProfilePic} 
                                    alt={assignment.receiverName}
                                    className="receiver-avatar"
                                />
                            ) : (
                                <div className="receiver-avatar-placeholder">
                                    <i className="fas fa-user"></i>
                                </div>
                            )}
                            <h2 className="receiver-name">{assignment.receiverName}</h2>
                            <p className="receiver-email">
                                <i className="fas fa-envelope"></i> {assignment.receiverEmail}
                            </p>
                        </div>

                        <div className="assignment-details">
                            <div className="detail-row">
                                <i className="fas fa-coins"></i>
                                <div>
                                    <span className="detail-label">Gift Budget</span>
                                    <span className="detail-value">${assignment.giftBudget}</span>
                                </div>
                            </div>
                            
                            {assignment.drawDate && (
                                <div className="detail-row">
                                    <i className="fas fa-calendar-alt"></i>
                                    <div>
                                        <span className="detail-label">Exchange Date</span>
                                        <span className="detail-value">
                                            {new Date(assignment.drawDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="reminder-section">
                            <i className="fas fa-exclamation-circle"></i>
                            <p>
                                <strong>Remember:</strong> Keep this a secret! 🤫 
                                The magic of Secret Santa is in the surprise.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAssignmentCard;
