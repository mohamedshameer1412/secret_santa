import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import Picker from 'emoji-picker-react';
import 'animate.css';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import confetti from 'canvas-confetti';

const API_URL = 'http://localhost:5000/api/chat';

const GroupChat = () => {
    const { roomId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [message, setMessage] = useState('');
    const [rawMessages, setRawMessages] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [gifs, setGifs] = useState([]);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifQuery, setGifQuery] = useState('');
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const fetchRoomData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const res = await axios.get(`${API_URL}/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoom(res.data.room);
        } catch (error) {
            console.error('Error fetching room data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [roomId, navigate]);

    const fetchMessages = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const res = await axios.get(`${API_URL}/${roomId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setRawMessages(res.data.messages);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [roomId, navigate]);

    const messages = useMemo(() => {
        if (!user) return []; // Don't format if user not loaded yet
        
        return rawMessages.map(msg => {
            const isCurrentUser = msg.senderId === user.id || msg.sender === user.username;
            
            return {
                from: isCurrentUser ? (user.username || 'You') : msg.sender,
                content: msg.text,
                time: new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                img: isCurrentUser ? '/assets/santa2.png' : '/assets/santa1.png'
            };
        });
    }, [rawMessages, user]);

    // Confetti effect on login
    useEffect(() => {
        if (location.state?.showConfetti) {
            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#cc0000', '#00aa00', '#ffffff', '#ffd700']
            });
            // Remove the state so it doesn't repeat
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    
    // Fetch room details and messages on mount
    useEffect(() => {
        if (!roomId) {
            navigate('/dashboard');
            return;
        }

        if (!user) return;

        fetchRoomData();
        fetchMessages();
    }, [roomId, navigate, fetchRoomData, fetchMessages, user]);

    // Typing indicator logic
    const setUserTyping = (isTyping) => {
        if (isTyping) {
            if (!typingUsers.includes('You')) {
                setTypingUsers(prev => [...prev, 'You']);
            }
            // Clear existing timeout
            clearTimeout(typingTimeoutRef.current);
            // Set new timeout to remove typing indicator after 1.5s of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                setTypingUsers(prev => prev.filter(n => n !== 'You'));
            }, 1500);
        } else {
            clearTimeout(typingTimeoutRef.current);
            setTypingUsers(prev => prev.filter(n => n !== 'You'));
        }
    };

    const handleSend = async () => {
        if (message.trim()) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    `${API_URL}/${roomId}/message`,
                    { text: message },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                setUserTyping(false);
                
                const now = new Date();
                setRawMessages((prev) => [
                    ...prev,
                    {
                        senderId: user?.id,
                        sender: user?.username,
                        text: message,
                        sentAt: now.toISOString()
                    },
                ]);
                
                setMessage('');
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            }
        }
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;

        if (newValue !== message && (room?.participants?.length || 0) > 1) {
            setUserTyping(true);
        }
        setMessage(newValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => clearTimeout(typingTimeoutRef.current);
    }, []);

    const handleEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
        inputRef.current.focus();
    };

    const fetchGifs = useCallback(async () => {
        try {
            const res = await axios.get(
                `https://tenor.googleapis.com/v2/search?q=${gifQuery || 'funny'}&key=AIzaSyCoEto9P8kesHKJq7jpZq26eefogABlF1Q&limit=9&media_filter=mp4`
            );
            setGifs(res.data.results);
        } catch (error) {
            console.error('Error fetching GIFs from Tenor:', error);
        }
    }, [gifQuery]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [rawMessages]);

    useEffect(() => {
        if (gifQuery) fetchGifs();
    }, [gifQuery, fetchGifs]);

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            if (roomId) fetchMessages();
        }, 3000);
        return () => clearInterval(interval);
    }, [roomId, fetchMessages, user]);

    if (loading || authLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column vh-100 w-100 ">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="d-flex flex-grow-1">
                <Sidebar isOpen={sidebarOpen} />
                <main
                    className={`d-flex flex-column flex-grow-1 content ${sidebarOpen ? '' : 'shifted'}`}
                    style={{ marginTop: '56px' }}
                >
                    <div className=" d-flex flex-column flex-grow-1 w-100 h-100 mt-3 pt-3 border border-danger-subtle border-4 shadow-sm">
                        <div className="p-3 bg-white border-bottom border-danger-subtle">
                            <h5 className="mb-0 text-danger">
                                <i className="fa-solid fa-users me-2"></i>
                                {room?.name || 'Group Chat'}
                                {room?.participants?.length === 1 && (
                                    <span className="badge bg-info ms-2">Personal</span>
                                )}
                                {room?.anonymousMode && (
                                    <span className="badge bg-secondary ms-2">Anonymous Mode</span>
                                )}
                            </h5>
                        </div>

                        <div className=" flex-grow-1 d-flex flex-column justify-content-between animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(244, 244, 244, 0.7)' }}>
                            <div className="chat-scroll flex-grow-1 overflow-auto px-3 py-2" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                                {messages.map((msg, index) => {
                                    const isUser = msg.from === user?.username || msg.from === 'You';
                                    return (
                                        <div
                                            key={index}
                                            className={`d-flex mb-4 align-items-end ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
                                        >
                                            {!isUser && (
                                                <img
                                                    src={msg.img}
                                                    alt={msg.from}
                                                    className="rounded-circle me-3 align-self-end shadow"
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                />
                                            )}
                                            <div
                                                className={`position-relative px-3 py-2 rounded-4 shadow-sm animate__animated animate__fadeInUp`}
                                                style={{
                                                    maxWidth: '75%',
                                                    backgroundColor: isUser ? '#cc0000' : '#ffffff',
                                                    color: isUser ? '#fff' : '#000',
                                                    border: isUser ? 'none' : '1px solid #dee2e6',
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <small className="fw-bold">{msg.from}</small>
                                                    <small className="ms-2" style={{ color: isUser ? '#fff' : '#1e7e34', fontSize: '0.75rem' }}>{msg.time}</small>
                                                </div>
                                                <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                                            </div>
                                            {isUser && (
                                                <img
                                                    src={msg.img}
                                                    alt={msg.from}
                                                    className="rounded-circle ms-3 align-self-end shadow"
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}

                                {typingUsers.length > 0 && (
                                    <div className="ps-3 pe-3 py-2 mt-2 mb-2 mx-3 rounded-3 bg-light d-inline-block shadow-sm border border-danger-subtle text-secondary small typing-indicator">
                                        <span className="fw-semibold text-danger">
                                            {typingUsers.join(', ')}
                                        </span>{' '}
                                        {typingUsers.includes('You') ? 'are' : (typingUsers.length === 1 ? 'is' : 'are')}{' '}
                                        <span className="typing-bounce">
                                            {'typing...'.split('').map((char, i) => (
                                                <span
                                                    key={i}
                                                    className="bounce-letter"
                                                    style={{ animationDelay: `${i * 0.1}s` }}
                                                >
                                                    {char}
                                                </span>
                                            ))}
                                        </span>
                                        <span className="typing-dot me-1"></span>
                                    </div>
                                )}

                                <div ref={chatEndRef}></div>
                            </div>
                            
                            <div className="d-flex align-items-end justify-content-between gap-3 p-3 bg-white shadow-sm flex-wrap border-top border-4 border-danger-subtle" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
                                <div className="d-flex align-items-center gap-2 position-relative">
                                    <button
                                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        aria-label="Emoji Picker"
                                    >
                                        <i className="fa-solid fa-face-smile fs-5 text-secondary"></i>
                                    </button>

                                    {showEmojiPicker && (
                                        <div className="position-absolute bottom-100 start-0 mb-2 z-3">
                                            <Picker
                                                onEmojiClick={handleEmojiClick}
                                                theme="light"
                                                height={320}
                                                width={320}
                                            />
                                        </div>
                                    )}

                                    <button
                                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                                        onClick={() => setShowGifPicker(!showGifPicker)}
                                        aria-label="GIF Picker"
                                    >
                                        <i className="fa-solid fa-image fs-5 text-secondary"></i>
                                    </button>

                                    {showGifPicker && (
                                        <div className="position-absolute bottom-100 start-0 mb-2 p-3 rounded shadow bg-white z-3" style={{ width: '300px', maxHeight: '320px', overflowY: 'auto' }}>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                placeholder="Search GIFs..."
                                                value={gifQuery}
                                                onChange={(e) => setGifQuery(e.target.value)}
                                            />
                                            <div className="d-flex flex-wrap gap-2">
                                                {gifs.map((gif) => {
                                                    const mp4Url = gif.media_formats?.mp4?.url;
                                                    return mp4Url && (
                                                        <video
                                                            key={gif.id}
                                                            src={mp4Url}
                                                            autoPlay
                                                            loop
                                                            muted
                                                            playsInline
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                setRawMessages((prev) => [
                                                                    ...prev,
                                                                    {
                                                                        senderId: user?.id,
                                                                        sender: user?.username,
                                                                        text: <video src={mp4Url} autoPlay loop muted playsInline style={{ width: '120px', borderRadius: '12px' }} />,
                                                                        sentAt: new Date().toISOString(),
                                                                        img: '/assets/santa2.png',
                                                                    },
                                                                ]);
                                                                setShowGifPicker(false);
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex flex-grow-1 align-items-end gap-2 ">
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        className="form-control flex-grow-1 px-3 py-2 rounded-4 shadow-sm"
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        style={{ minHeight: '44px', maxHeight: '120px', resize: 'none' }}
                                    ></textarea>
                                    <button
                                        className="btn send-btn icon-btn1"
                                        onClick={handleSend}
                                        aria-label="Send Message"
                                    >
                                        <i className="fa-solid fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GroupChat;