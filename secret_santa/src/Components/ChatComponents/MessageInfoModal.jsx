import React from 'react';

const MessageInfoModal = ({ 
    showMessageInfo, 
    setShowMessageInfo, 
    messages, 
    room 
}) => {
    if (!showMessageInfo) return null;

    const msg = messages.find(m => m._id === showMessageInfo);
    if (!msg) return null;

    return (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
            onClick={() => setShowMessageInfo(null)}
        >
            <div 
                className="bg-white rounded-4 shadow-lg p-4"
                style={{ maxWidth: '500px', width: '90%' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                        <i className="fa-solid fa-info-circle text-primary me-2"></i>
                        Message Info
                    </h5>
                    <button 
                        className="btn-close"
                        onClick={() => setShowMessageInfo(null)}
                    ></button>
                </div>

                <div>
                    {/* Message preview */}
                    <div className="bg-light p-3 rounded-3 mb-3">
                        <small className="text-muted d-block mb-1">Message</small>
                        <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                            {msg.content}
                        </p>
                        {msg.isEdited && (
                            <small className="text-muted fst-italic">(edited)</small>
                        )}
                    </div>

                    {/* Message details */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted">
                                <i className="fa-solid fa-user me-2"></i>
                                From
                            </span>
                            <strong>{msg.from}</strong>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted">
                                <i className="fa-solid fa-clock me-2"></i>
                                Sent
                            </span>
                            <strong>{msg.time}</strong>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted">
                                <i className="fa-solid fa-shield-halved me-2"></i>
                                Status
                            </span>
                            <span className="badge bg-success">
                                {msg.status === 'delivered' ? 'Delivered' : 'Sent'}
                                {msg.status === 'delivered' && (
                                    <i className="fa-solid fa-check-double ms-1"></i>
                                )}
                            </span>
                        </div>
                        {msg.reactions && msg.reactions.length > 0 && (
                            <div className="py-2 border-bottom">
                                <span className="text-muted d-block mb-2">
                                    <i className="fa-solid fa-face-smile me-2"></i>
                                    Reactions
                                </span>
                                <div className="d-flex flex-wrap gap-2">
                                    {msg.reactions.map((reaction, idx) => (
                                        <span key={idx} className="badge bg-light text-dark">
                                            {reaction.emoji} {reaction.anonymousName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Read receipts (anonymous) */}
                    <div className="alert alert-info d-flex align-items-center mb-0">
                        <i className="fa-solid fa-eye me-2"></i>
                        <small>
                            Seen by {room?.participants?.length || 0} anonymous member(s)
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageInfoModal;
