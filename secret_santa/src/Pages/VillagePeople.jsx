import React, { useState } from 'react';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';

const mockUsers = [
  { id: 1, name: "Anita Rao", profilePic: "https://i.pravatar.cc/150?img=1", isChild: true },
  { id: 2, name: "Ramesh Singh", profilePic: "https://i.pravatar.cc/150?img=2" },
  { id: 3, name: "Meena Kumari", profilePic: "https://i.pravatar.cc/150?img=3" },
  { id: 4, name: "Kiran Patel", profilePic: "https://i.pravatar.cc/150?img=4" },
];

const VillagePeople = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChat = (user) => {
    console.log(`Start chat with ${user.name}`);
  };

  return (
    <div className="d-flex flex-column w-100 vh-100 ">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`content ${sidebarOpen ? '' : 'shifted'} py-5 px-3 px-md-5`}>
        <div className="container my-5" >

          {/* ✅ Title Section */}
          <div className="d-flex align-items-center mb-3">
            <i className="fas fa-users text-white bg-danger p-3 rounded-circle shadow-lg"
              style={{ boxShadow: '0 4px 10px rgba(211, 47, 47, 0.4)' }}>
            </i>
            <h3 className="fw-bold ms-3 mb-0 text-dark">The Village People</h3>
          </div>
          <p className="text-secondary mb-4">
            Connect with members of your secret village. You can chat with your secret child or the group.
          </p>

          {/* ✅ Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control rounded-pill px-4 py-2 fw-medium"
              placeholder=" Search members..."
              style={{
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#333',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.boxShadow = '0 4px 16px rgba(211,47,47,0.4)'}
              onBlur={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'}
            />
          </div>

          {/* ✅ User List */}
          <ul
            className="list-group shadow-lg"
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.3)',
              overflow: 'hidden',
            }}
          >
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="list-group-item d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  padding: '14px 18px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* ✅ Avatar & Name */}
                <div className="d-flex align-items-center">
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="rounded-circle me-3"
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: '0 0 8px rgba(0,0,0,0.1)',
                      transition: '0.3s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.boxShadow = '0 0 12px rgba(211,47,47,0.5)'}
                    onMouseLeave={(e) => e.target.style.boxShadow = '0 0 8px rgba(0,0,0,0.1)'}
                  />
                  <span className="fw-semibold text-dark">{user.name}</span>
                </div>

                {/* ✅ Chat Button */}
                <button
                  className="btn btn-sm px-3 mt-3 mt-md-0 position-relative overflow-hidden"
                  style={{
                    background: user.isChild ? 'rgba(211,47,47,0.9)' : 'rgba(255,255,255,0.3)',
                    color: user.isChild ? '#fff' : '#333',
                    borderRadius: '8px',
                    fontWeight: '500',
                    border: '1px solid rgba(255,255,255,0.4)',
                    boxShadow: user.isChild
                      ? '0 0 12px rgba(211,47,47,0.5)'
                      : '0 0 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = user.isChild ? 'rgba(183,28,28,0.95)' : 'rgba(255,255,255,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = user.isChild ? 'rgba(211,47,47,0.9)' : 'rgba(255,255,255,0.3)';
                  }}
                  onClick={() => handleChat(user)}
                >
                  {/* ✨ Light streak animation */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-80px',
                      width: '50px',
                      height: '100%',
                      background: 'rgba(255,255,255,0.4)',
                      transform: 'skewX(-20deg)',
                      animation: 'swipe 2.5s infinite',
                    }}
                  ></span>
                  <i className="fas fa-comment me-1"></i>
                  {user.isChild ? 'Chat with your Child' : 'Chat'}
                </button>
              </li>
            ))}
          </ul>

          {/* ✅ Group Chat Button */}
          <div className="text-center mt-4">
            <button
              className="btn w-100 text-white position-relative overflow-hidden"
              style={{
                background: 'rgba(211,47,47,0.9)',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '500',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 0 15px rgba(211,47,47,0.6)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(183,28,28,0.95)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(211,47,47,0.9)'}
            >
              {/* ✨ Glossy Streak Animation */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-80px',
                  width: '50px',
                  height: '100%',
                  background: 'rgba(255,255,255,0.4)',
                  transform: 'skewX(-20deg)',
                  animation: 'swipe 2.5s infinite',
                }}
              ></span>
              <i className="fas fa-comments me-2"></i> Group Chat
            </button>
          </div>
        </div>
      </main>

      {/* ✅ Keyframe for shiny swipe */}
      <style>{`
        @keyframes swipe {
          0% { left: -80px; }
          50% { left: 120%; }
          100% { left: 120%; }
        }
      `}</style>
    </div>
  );
};

export default VillagePeople;
