import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import { useAuth } from '../context/useAuth';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/village';

const VillagePeople = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMembers(res.data.members);
      } catch (error) {
        console.error('Error fetching village members:', error);
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        
        if (error.response?.status !== 404) {
          alert('Failed to load village members');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [authLoading, user, navigate]);

  const filteredUsers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

    const handleChat = async (member) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
        navigate('/login');
        return;
        }

        // Create or get private chat room
        const res = await axios.post(
        'http://localhost:5000/api/chat/private-room',
        { otherUserId: member.userId },
        { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success && res.data.roomId) {
        // Navigate to the private chat room
        navigate(`/group-chat/${res.data.roomId}`, {
            state: { 
            isPrivate: true,
            otherUser: member.name,
            showConfetti: false
            }
        });
        }
    } catch (error) {
        console.error('Error creating private chat:', error);
        alert('Failed to start chat. Please try again.');
    }
    };

  const handleGroupChat = () => {
    navigate('/group-chat');
  };

  if (authLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column w-100 vh-100">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="d-flex flex-grow-1">
        <Sidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className={`content ${sidebarOpen ? '' : 'shifted'} flex-grow-1`} style={{ marginTop: '56px', padding: '2rem 3rem', overflowY: 'auto' }}>
          <div className="container my-5">
            {/* Title Section */}
            <div className="d-flex align-items-center mb-3">
              <i className="fas fa-users text-white bg-danger p-3 rounded-circle shadow-lg"
                style={{ boxShadow: '0 4px 10px rgba(211, 47, 47, 0.4)' }}>
              </i>
              <h3 className="fw-bold ms-3 mb-0 text-dark">The Village People</h3>
            </div>
            <p className="text-secondary mb-4">
              Connect with members of your secret village. You can chat with your secret child or the group.
            </p>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                className="form-control rounded-pill px-4 py-2 fw-medium"
                placeholder="🔍 Search members..."
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

            {/* Empty State */}
            {members.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-users text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="text-muted mt-3">No village members yet</h4>
                <p className="text-muted">Add members to start connecting!</p>
              </div>
            ) : (
              <>
                {/* User List */}
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
                  {filteredUsers.map((member) => (
                    <li
                      key={member._id}
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
                      {/* Avatar & Name */}
                      <div className="d-flex align-items-center">
                        <img
                          src={member.profilePic}
                          alt={member.name}
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
                        <span className="fw-semibold text-dark">{member.name}</span>
                      </div>

                      {/* Chat Button */}
                      <button
                        className="btn btn-sm px-3 mt-3 mt-md-0 position-relative overflow-hidden"
                        style={{
                          background: member.isChild ? 'rgba(211,47,47,0.9)' : 'rgba(255,255,255,0.3)',
                          color: member.isChild ? '#fff' : '#333',
                          borderRadius: '8px',
                          fontWeight: '500',
                          border: '1px solid rgba(255,255,255,0.4)',
                          boxShadow: member.isChild
                            ? '0 0 12px rgba(211,47,47,0.5)'
                            : '0 0 6px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = member.isChild ? 'rgba(183,28,28,0.95)' : 'rgba(255,255,255,0.45)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = member.isChild ? 'rgba(211,47,47,0.9)' : 'rgba(255,255,255,0.3)';
                        }}
                        onClick={() => handleChat(member)}
                      >
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
                        {member.isChild ? 'Chat with your Child' : 'Chat'}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* No Results */}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No members found matching "{searchQuery}"</p>
                  </div>
                )}
              </>
            )}

            {/* Group Chat Button */}
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
                onClick={handleGroupChat}
              >
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
      </div>

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