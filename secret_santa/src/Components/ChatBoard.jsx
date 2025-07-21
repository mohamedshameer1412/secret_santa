import React, { useState, useEffect, useRef } from 'react';

const ChatBoard = ({ room }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { from: 'Player 1', content: 'Hey there! 🎅', type: 'text' },
    { from: 'You', content: 'Hi! Ready for the dare? 🎯', type: 'text' }
  ]);

  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      setMessages((prev) => [...prev, { content: message, type: 'text', from: 'You' }]);
      setMessage('');
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-wrapper shadow-sm rounded-4 bg-white p-4">
      <h5 className="text-primary mb-3">
        <i className="fa-solid fa-comments me-2"></i> Room Chat – <span className="text-muted">{room}</span>
      </h5>

      {/* Chat Display Area */}
      <div
        className="chat-box border rounded bg-light p-3 mb-3"
        style={{ height: '320px', overflowY: 'auto', scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted">No messages yet. Start the fun! 🎉</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`d-flex mb-2 ${msg.from === 'You' ? 'justify-content-end' : 'justify-content-start'}`}
            >
              <div
                className={`p-2 px-3 rounded-3 ${
                  msg.from === 'You' ? 'bg-success text-white' : 'bg-white border'
                }`}
                style={{ maxWidth: '75%' }}
              >
                <small className="d-block fw-bold mb-1">{msg.from}</small>
                <span>{msg.content}</span>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className="d-flex">
        <input
          type="text"
          className="form-control rounded-pill me-2 px-4"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn btn-success rounded-circle" style={{ width: '48px', height: '48px' }} onClick={handleSend}>
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatBoard;
