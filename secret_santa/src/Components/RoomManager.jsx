import React, { useState } from 'react';

const RoomManager = ({ setRoom }) => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    if (roomCode.trim()) {
      setRoom(roomCode.trim());
    }
  };

  const handleCreate = () => {
    const newRoom = 'ROOM-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    setRoom(newRoom);
  };

  return (
    <div className="my-4">
      <h4>
        <i className="fa-solid fa-door-open me-2 text-danger"></i>Join or Create a Room
      </h4>
      <input
        type="text"
        className="form-control w-50 my-2"
        placeholder="Enter Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <button className="btn btn-danger me-2" onClick={handleJoin}>
        <i className="fa-solid fa-right-to-bracket me-1"></i> Join Room
      </button>
      <button className="btn btn-outline-danger" onClick={handleCreate}>
        <i className="fa-solid fa-plus me-1"></i> Create New Room
      </button>
    </div>
  );
};

export default RoomManager;
