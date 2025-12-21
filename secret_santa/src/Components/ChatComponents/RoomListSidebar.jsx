import React from 'react';
import RoomCard from './RoomCard';

const RoomListSidebar = ({ 
    showRoomList,
    showSnow,
    sortedRooms,
    roomId,
    pinnedRooms,
    user,
    toggleSnow,
    handleRoomSelect,
    handlePinRoom
}) => {
    return (
        <div className={`room-list-sidebar ${showRoomList ? 'show' : ''}`}>
            <div className="room-list-header">
                <h4 className="mb-0">
                    <i className="fa-solid fa-comments me-2"></i>
                    Group Chats
                </h4>
                <button 
                    className="btn btn-sm btn-outline-light"
                    onClick={toggleSnow}
                    title={showSnow ? "Disable Snow" : "Enable Snow"}
                >
                    {showSnow ? <i className="fa-solid fa-snowflake"></i> : <i className="fa-regular fa-snowflake"></i>}
                </button>
            </div>

            {showSnow && (
                <div className="snow-container">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="snowflake" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${8 + Math.random() * 8}s`
                        }}>❄</div>
                    ))}
                </div>
            )}

            <div className="room-cards-container">
                {sortedRooms.map((r, index) => {
                    const isPinned = pinnedRooms.has(r._id);
                    const isActive = r._id === roomId;

                    return (
                        <RoomCard
                            key={r._id}
                            room={r}
                            isActive={isActive}
                            isPinned={isPinned}
                            user={user}
                            index={index}
                            handleRoomSelect={handleRoomSelect}
                            handlePinRoom={handlePinRoom}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RoomListSidebar;
