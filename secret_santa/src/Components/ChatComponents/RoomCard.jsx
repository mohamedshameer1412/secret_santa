import React from 'react';

const RoomCard = ({ 
    room, 
    isActive, 
    isPinned, 
    user,
    index,
    handleRoomSelect, 
    handlePinRoom 
}) => {
    const unreadCount = room.unreadCount || 0;
    
    // Calculate display name for private chats
    let displayName = room.name;
    if (room.isPrivate && room.participants) {
        const otherParticipant = room.participants.find(
            p => p._id?.toString() !== user?.id?.toString()
        );
        if (otherParticipant) {
            displayName = otherParticipant.name || otherParticipant.username || 'User';
        }
    }

    return (
        <div
            className={`room-card ${isActive ? 'active' : ''}`}
            onClick={() => handleRoomSelect(room._id)}
            style={{
                animationDelay: `${index * 0.1}s`
            }}
        >
            <div className="room-card-content">
                <div className="room-card-header">
                    <h6 className="room-name">
                        {room.isPrivate ? (
                            <><i className="fa-solid fa-user me-2"></i>{displayName}</>
                        ) : (
                            <><i className="fa-solid fa-users me-2"></i>{displayName}</>
                        )}
                    </h6>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                </div>
                <p className="room-last-message">
                    {room.lastMessage?.text || 'No messages yet'}
                </p>
                <div className="room-card-footer">
                    <div className="room-info">
                        <span className="participant-count">
                            <i className="fa-solid fa-user-group me-1"></i>
                            {room.participants?.length || 0}
                        </span>
                        {room.lastMessage?.createdAt && (
                            <span className="last-message-time">
                                {new Date(room.lastMessage.createdAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <div className="room-actions">
                        <button
                            className={`btn btn-sm ${isPinned ? 'btn-warning' : 'btn-outline-secondary'}`}
                            onClick={(e) => handlePinRoom(room._id, e)}
                            title={isPinned ? "Unpin" : "Pin"}
                        >
                            <i className={`fa-solid fa-thumbtack${isPinned ? '' : ' opacity-50'}`}></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomCard;
