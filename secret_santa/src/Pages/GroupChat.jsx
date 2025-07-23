import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import Picker from 'emoji-picker-react';
import 'animate.css';
import axios from 'axios';

const GroupChat = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            from: 'Anna',
            content: 'Hey team! 🎁',
            time: '10:30 AM',
            img: '/assets/santa1.png',
        },
        {
            from: 'You',
            content: 'Hi! Ready for the dare? 🎯',
            time: '10:32 AM',
            img: '/assets/santa2.png',
        },
    ]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [gifs, setGifs] = useState([]);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifQuery, setGifQuery] = useState('');

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    const handleSend = () => {
        if (message.trim()) {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setMessages((prev) => [
                ...prev,
                {
                    from: 'You',
                    content: message,
                    time,
                    img: '/assets/santa2.png',
                },
            ]);
            setMessage('');
            setTypingUsers((prev) => prev.filter((name) => name !== 'You'));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else {
            if (!typingUsers.includes('You')) {
                setTypingUsers([...typingUsers, 'You']);
            }
        }
    };

    const handleEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
        inputRef.current.focus();
    };

    const fetchGifs = async () => {
        try {
            const res = await axios.get(
                `https://tenor.googleapis.com/v2/search?q=${gifQuery || 'funny'}&key=AIzaSyCoEto9P8kesHKJq7jpZq26eefogABlF1Q&limit=9&media_filter=mp4`
            );
            setGifs(res.data.results);
        } catch (error) {
            console.error('Error fetching GIFs from Tenor:', error);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (gifQuery) fetchGifs();
    }, [gifQuery]);

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
                        <div className=" flex-grow-1 d-flex flex-column justify-content-between animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(244, 244, 244, 0.7)' }}>
                            <div className="chat-scroll flex-grow-1 overflow-auto px-3 py-2" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                                {messages.map((msg, index) => {
                                    const isUser = msg.from === 'You';
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
                                        {typingUsers.length === 1 ? 'is' : 'are'}{' '}
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
                                {/* Emoji & GIF Buttons + Picker */}
                                <div className="d-flex align-items-center gap-2 position-relative">
                                    {/* Emoji Button */}
                                    <button
                                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        aria-label="Emoji Picker"
                                    >
                                        <i className="fa-solid fa-face-smile fs-5 text-secondary"></i>
                                    </button>

                                    {/* Emoji Picker */}
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

                                    {/* GIF Button */}
                                    <button
                                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                                        onClick={() => setShowGifPicker(!showGifPicker)}
                                        aria-label="GIF Picker"
                                    >
                                        <i className="fa-solid fa-image fs-5 text-secondary"></i>
                                    </button>

                                    {/* GIF Picker */}
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
                                                                setMessages((prev) => [
                                                                    ...prev,
                                                                    {
                                                                        from: 'You',
                                                                        content: <video src={mp4Url} autoPlay loop muted playsInline style={{ width: '120px', borderRadius: '12px' }} />,
                                                                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

                                {/* Message Input & Send Button */}
                                <div className="d-flex flex-grow-1 align-items-end gap-2 ">
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        className="form-control flex-grow-1 px-3 py-2 rounded-4 shadow-sm"
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
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