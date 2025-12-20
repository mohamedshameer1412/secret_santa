import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import Picker from 'emoji-picker-react';
import 'animate.css';
import './GroupChat.css';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:5000/api/chat';

// Complete WhatsApp-style reaction emojis (all categories)
const reactionEmojis = [
    // Smileys & Emotion
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
    '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒',
    '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕',
    '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥',
    '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
    '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
    
    // Hand gestures
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏',
    
    // Popular symbols & hearts
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹',
    '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
    
    // Common reactions
    '🔥', '⭐', '✨', '💫', '💥', '💯', '✔️', '✅', '❌', '❗', '❓', '💢',
    '💤', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🌟'
];

// Quick reactions shown in context menu (most popular WhatsApp reactions - 3 to fit with plus button)
const quickReactions = ['❤️', '😂', '👍'];

// Helper to detect GIF URLs (for future GIF validation if needed)
// eslint-disable-next-line no-unused-vars
const isGifUrl = (text) => {
    if (!text) return false;
    return text.match(/\.(gif)$/i) || 
           text.includes('tenor.com') || 
           text.includes('giphy.com') ||
           text.match(/https?:\/\/.*\.(gif)/i);
};

const getPrivateChatName = (roomData, userId) => {
    if (!roomData.isPrivate || !roomData.participants) return roomData.name;
    
    const otherParticipant = roomData.participants.find(
        p => p._id?.toString() !== userId?.toString()
    );
    
    return otherParticipant 
        ? `Chat with ${otherParticipant.name || otherParticipant.username || 'User'}` 
        : roomData.name;
};
    
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
    const [sendingMessage, setSendingMessage] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [showMessageMenu, setShowMessageMenu] = useState(null);
    const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
    const [showMessageInfo, setShowMessageInfo] = useState(null);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const longPressTimer = useRef(null);

    const prevMessageCountRef = useRef(0);
    const initialScrollDone = useRef(false);
    const avatarMapRef = useRef(new Map());

    const [imageUrls, setImageUrls] = useState({}); // Store blob URLs for images
    
    // Multi-room state
    const [rooms, setRooms] = useState([]);
    const [pinnedRooms, setPinnedRooms] = useState(new Set());
    const [showSnow, setShowSnow] = useState(false);
    const [showRoomList, setShowRoomList] = useState(true); // For mobile

    // Function to load authenticated image
    const loadAuthenticatedImage = useCallback(async (messageId, url) => {
        if (imageUrls[messageId]) return imageUrls[messageId];
        
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            
            let imageUrl = url;
            if (!url.startsWith('http')) {
                if (!url.startsWith('/')) imageUrl = '/' + url;
                if (!url.startsWith('/api')) imageUrl = '/api/chat/file/' + messageId;
            }
            
            const response = await axios.get(`http://localhost:5000${imageUrl}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const blobUrl = URL.createObjectURL(response.data);
            setImageUrls(prev => ({ ...prev, [messageId]: blobUrl }));
            return blobUrl;
        } catch (error) {
            console.error('Error loading image:', error.response?.data || error.message);
            return null;
        }
    }, [imageUrls]);

    // Load images when rawMessages change
    useEffect(() => {
        const loadImages = async () => {
            for (const msg of rawMessages) {
                if (msg.attachment?.fileType === 'image' && msg.attachment?.encryptedFileId && !imageUrls[msg._id]) {
                    await loadAuthenticatedImage(msg._id, `/api/chat/file/${msg._id}`);
                }
            }
        };
        
        if (rawMessages.length > 0) {
            loadImages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawMessages]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(imageUrls).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [imageUrls]);

    useEffect(() => {
        const fetchUserRooms = async () => {
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
                
                // Fetch all user's rooms
                const res = await axios.get(`${API_URL}/my-rooms`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.data.rooms && res.data.rooms.length > 0) {
                    setRooms(res.data.rooms);
                    
                    // If no roomId in URL, redirect to first room
                    if (!roomId) {
                        navigate(`/group-chat/${res.data.rooms[0]._id}`, { replace: true });
                    }
                } else {
                    alert('No chat rooms found. Please create or join a room first.');
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            }
        };

        fetchUserRooms();
    }, [roomId, navigate, user, authLoading]);

    const fetchRoomData = useCallback(async () => {
        if (!roomId || !user) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Calculate displayName inline instead of using separate function
            let displayName = res.data.room.name;
            if (res.data.room.isPrivate && res.data.room.participants) {
                const otherParticipant = res.data.room.participants.find(
                    p => p._id?.toString() !== user.id?.toString()
                );
                if (otherParticipant) {
                    displayName = `Chat with ${otherParticipant.name || otherParticipant.username || 'User'}`;
                }
            }
            
            const roomData = {
                ...res.data.room,
                displayName
            };
            
            setRoom(roomData);
        } catch (error) {
            console.error('Error fetching room:', error);
            if (error.response?.status === 404) {
                alert('Chat room not found');
                navigate('/dashboard');
            }
        }
    }, [roomId, navigate, user]);

    const fetchMessages = useCallback(async () => {
        if (!roomId) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const res = await axios.get(`${API_URL}/${roomId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setRawMessages(res.data.messages || res.data);
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
        if (!user) return [];
        
        return rawMessages.map(msg => {
            // Extract sender ID properly
            const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
            const userId = user.id?.toString() || user._id?.toString();
            
            // Compare as strings to avoid ObjectId vs string mismatch
            const isCurrentUser = senderId === userId;
            
            // Use anonymous name if available (anonymous mode)
            const displayName = msg.anonymousName || msg.sender?.name || msg.sender?.username || 'Anonymous';
            
            // Generate consistent random avatar per sender
            let avatarUrl;
            if (!avatarMapRef.current.has(senderId)) {
                avatarUrl = msg.sender?.profilePic || '/assets/santa2.png';
                avatarMapRef.current.set(senderId, avatarUrl);
            } else {
                avatarUrl = avatarMapRef.current.get(senderId);
            }
            
            return {
                _id: msg._id,
                from: displayName,
                content: msg.text,
                time: new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                img: avatarUrl, // Random avatar per anonymous user (consistent per sender)
                isCurrentUser,
                isEdited: msg.isEdited,
                isDeleted: msg.isDeleted,
                reactions: msg.reactions || [],
                attachment: msg.attachment,
                status: msg.status || 'sent'
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
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    
    // Fetch room details and messages on mount
    useEffect(() => {
        if (!roomId || !user) return;

        // Reset scroll state when room changes
        initialScrollDone.current = false;

        fetchRoomData();
        fetchMessages();
    }, [roomId, fetchRoomData, fetchMessages, user]);

    useEffect(() => {
        if (rawMessages.length > 0 && !initialScrollDone.current) {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
                    initialScrollDone.current = true;
                }, 150); // Slightly longer delay to ensure render
            });
        }
    }, [rawMessages]);

    // Typing indicator logic
    const setUserTyping = (isTyping) => {
        if (isTyping) {
            if (!typingUsers.includes('You')) {
                setTypingUsers(prev => [...prev, 'You']);
            }
            clearTimeout(typingTimeoutRef.current);
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
                setSendingMessage(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                if (editingMessageId) {
                    // Edit existing message
                    await axios.put(
                        `${API_URL}/${roomId}/message/${editingMessageId}`,
                        { text: message },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setEditingMessageId(null);
                    Swal.fire({
                        icon: 'success',
                        title: 'Message updated!',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 5000,
                        timerProgressBar: true
                    });
                } else {
                    // Send new message
                    await axios.post(
                        `${API_URL}/${roomId}/message`,
                        { text: message },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
                
                setUserTyping(false);
                setMessage('');
                
                // Fetch messages immediately after sending
                fetchMessages();
            } catch (error) {
                console.error('Error sending message:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed to send message',
                        text: error.response?.data?.error || 'Please try again.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                }
            } finally {
                setSendingMessage(false);
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File too large',
                text: 'Maximum file size is 10MB',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            return;
        }

        try {
            setUploadingFile(true);
            const token = localStorage.getItem('token');
            
            console.log('Upload - Token:', token ? 'exists' : 'missing');
            console.log('Upload - RoomId:', roomId);
            console.log('Upload - API URL:', `${API_URL}/${roomId}/upload`);
            
            if (!token) {
                console.error('No token found');
                navigate('/login');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('text', `Shared a file: ${file.name}`);

            const response = await axios.post(
                `${API_URL}/${roomId}/upload`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('Upload success:', response.data);

            Swal.fire({
                icon: 'success',
                title: 'File uploaded!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });

            fetchMessages();
        } catch (error) {
            console.error('Error uploading file:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            Swal.fire({
                icon: 'error',
                title: 'Upload failed',
                text: error.response?.data?.message || error.response?.data?.error || 'Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle authenticated file download
    const handleFileDownload = async (messageId, url, fileName) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            
            const response = await axios.get(`http://localhost:5000${url}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            // Create download link
            const blobUrl = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading file:', error);
            Swal.fire({
                icon: 'error',
                title: 'Download failed',
                text: 'Could not download file. Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true
            });
        }
    };

    const handleEditMessage = (msg) => {
        if (msg.isDeleted) return;
        setMessage(msg.content);
        setEditingMessageId(msg._id);
        inputRef.current?.focus();
    };

    const handleDeleteMessage = async (messageId) => {
        const result = await Swal.fire({
            title: 'Delete message?',
            text: 'This action cannot be undone',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#cc0000',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    `${API_URL}/${roomId}/message/${messageId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Message deleted',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });

                fetchMessages();
            } catch (error) {
                console.error('Error deleting message:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete failed',
                    text: 'Please try again.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });
            }
        }
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/${roomId}/message/${messageId}/reaction`,
                { emoji },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchMessages();
            setShowReactionPicker(null);
        } catch (error) {
            console.error('Error adding reaction:', error);
            Swal.fire({
                icon: 'error',
                title: 'Reaction failed',
                text: 'Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        }
    };

    // WhatsApp-style message selection handlers
    const handleMessageLongPress = (messageId, event) => {
        event.preventDefault();
        longPressTimer.current = setTimeout(() => {
            setSelectedMessageId(messageId);
            setShowMessageMenu(messageId);
            
            // Calculate position to keep menu in viewport
            const menuWidth = 220;
            const menuHeight = 400;
            let x = Math.min(event.clientX, window.innerWidth - menuWidth - 10);
            let y = Math.min(event.clientY, window.innerHeight - menuHeight - 10);
            x = Math.max(10, x);
            y = Math.max(10, y);
            
            setMessageMenuPosition({ x, y });
        }, 500); // 500ms long press
    };

    const handleMessageTouchStart = (messageId, event) => {
        const touch = event.touches[0];
        longPressTimer.current = setTimeout(() => {
            setSelectedMessageId(messageId);
            setShowMessageMenu(messageId);
            
            // Calculate position to keep menu in viewport
            const menuWidth = 220;
            const menuHeight = 400;
            let x = Math.min(touch.clientX, window.innerWidth - menuWidth - 10);
            let y = Math.min(touch.clientY, window.innerHeight - menuHeight - 10);
            x = Math.max(10, x);
            y = Math.max(10, y);
            
            setMessageMenuPosition({ x, y });
        }, 500);
    };

    const handleMessageTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Multi-room management functions
    const handleRoomSelect = (selectedRoomId) => {
        if (selectedRoomId === roomId) return; // Already on this room
        
        // Navigate to selected room (confetti now only fires on page load)
        navigate(`/group-chat/${selectedRoomId}`);
        
        // Close room list on mobile
        if (window.innerWidth <= 768) {
            setShowRoomList(false);
        }
    };

    const handlePinRoom = (roomIdToPin, event) => {
        event.stopPropagation(); // Prevent room selection
        setPinnedRooms(prev => {
            const newPinned = new Set(prev);
            if (newPinned.has(roomIdToPin)) {
                newPinned.delete(roomIdToPin);
            } else {
                newPinned.add(roomIdToPin);
            }
            return newPinned;
        });
    };

    const toggleSnow = () => {
        setShowSnow(!showSnow);
    };

    // Get sorted rooms (pinned first)
    const sortedRooms = useMemo(() => {
        const pinned = rooms.filter(r => pinnedRooms.has(r._id));
        const unpinned = rooms.filter(r => !pinnedRooms.has(r._id));
        return [...pinned, ...unpinned];
    }, [rooms, pinnedRooms]);

    const handleMessageClick = (messageId, event) => {
        // If already selected, show menu on click
        if (selectedMessageId === messageId) {
            setShowMessageMenu(messageId);
            
            // Calculate position to keep menu in viewport
            const menuWidth = 220;
            const menuHeight = 400;
            let x = Math.min(event.clientX, window.innerWidth - menuWidth - 10);
            let y = Math.min(event.clientY, window.innerHeight - menuHeight - 10);
            x = Math.max(10, x);
            y = Math.max(10, y);
            
            setMessageMenuPosition({ x, y });
        }
    };

    // Handle double-click/double-tap to show context menu directly
    const handleMessageDoubleClick = (messageId, event) => {
        event.preventDefault();
        setSelectedMessageId(messageId);
        setShowMessageMenu(messageId);
        
        // Calculate position to ensure menu stays within viewport
        const menuWidth = 220;
        const menuHeight = 400; // Approximate height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = event.clientX;
        let y = event.clientY;
        
        // Adjust horizontal position if menu would overflow right
        if (x + menuWidth > viewportWidth) {
            x = viewportWidth - menuWidth - 10;
        }
        
        // Adjust vertical position if menu would overflow bottom
        if (y + menuHeight > viewportHeight) {
            y = viewportHeight - menuHeight - 10;
        }
        
        // Ensure minimum margins from edges
        x = Math.max(10, x);
        y = Math.max(10, y);
        
        setMessageMenuPosition({ x, y });
    };

    const closeMessageMenu = () => {
        setShowMessageMenu(null);
        setSelectedMessageId(null);
    };

    const handleMenuEdit = (msg) => {
        handleEditMessage(msg);
        closeMessageMenu();
    };

    const handleMenuDelete = (messageId) => {
        handleDeleteMessage(messageId);
        closeMessageMenu();
    };

    const handleMenuInfo = (messageId) => {
        setShowMessageInfo(messageId);
        closeMessageMenu();
    };

    const handleMenuReact = (messageId) => {
        setShowReactionPicker(messageId);
        closeMessageMenu();
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMessageMenu && !e.target.closest('.message-menu') && !e.target.closest('.message-bubble')) {
                closeMessageMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMessageMenu]);

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
        const chatScroll = document.querySelector('.chat-scroll');
        if (!chatScroll) return;

        const isAtBottom = chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight < 100;
        const hasNewMessages = rawMessages.length > prevMessageCountRef.current;

        // Only auto-scroll if user is at bottom AND there are new messages
        if (hasNewMessages && isAtBottom) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        prevMessageCountRef.current = rawMessages.length;
    }, [rawMessages]);

    useEffect(() => {
        if (gifQuery) fetchGifs();
        else if (showGifPicker && gifs.length === 0) fetchGifs(); // Load trending on open
    }, [gifQuery, showGifPicker, fetchGifs, gifs.length]);

    // Fire confetti once on page load (not on room switch)
    useEffect(() => {
        // Only fire confetti on initial mount, not when rooms change
        const hasShownConfetti = sessionStorage.getItem('groupChatConfettiShown');
        if (!hasShownConfetti) {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#cc0000', '#ff0000', '#ffcccc', '#ffffff', '#00cc00']
            });
            sessionStorage.setItem('groupChatConfettiShown', 'true');
        }
    }, []); // Empty dependency array - only runs once on mount

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!user || !roomId) return;

        const interval = setInterval(() => {
            fetchMessages();
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
        <div className="d-flex flex-column w-100" style={{ height: '100vh', overflow: 'hidden' }}>
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="d-flex flex-grow-1">
                <Sidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main
                    className={`d-flex flex-row flex-grow-1 content ${sidebarOpen ? '' : 'shifted'}`}
                    style={{ 
                        paddingTop: '66px',
                        paddingBottom: '26px',
                        height: '100vh',
                        overflow: 'hidden'
                    }}
                >
                    {/* Room List Sidebar - Left Column */}
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
                                        animationDuration: `${8 + Math.random() * 8}s` // Slower: 8-16s instead of 3-7s
                                    }}>❄</div>
                                ))}
                            </div>
                        )}

                        <div className="room-cards-container">
                            {sortedRooms.map((r, index) => {
                                const isPinned = pinnedRooms.has(r._id);
                                const isActive = r._id === roomId;
                                const unreadCount = r.unreadCount || 0;
                                
                                // Calculate display name for private chats
                                let displayName = r.name;
                                if (r.isPrivate && r.participants) {
                                    const otherParticipant = r.participants.find(
                                        p => p._id?.toString() !== user?.id?.toString()
                                    );
                                    if (otherParticipant) {
                                        displayName = otherParticipant.name || otherParticipant.username || 'User';
                                    }
                                }

                                return (
                                    <div
                                        key={r._id}
                                        className={`room-card ${isActive ? 'active' : ''}`}
                                        onClick={() => handleRoomSelect(r._id)}
                                        style={{
                                            animationDelay: `${index * 0.1}s`
                                        }}
                                    >
                                        <div className="room-card-content">
                                            <div className="room-card-header">
                                                <h6 className="room-name">
                                                    {r.isPrivate ? (
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
                                                {r.lastMessage?.text || 'No messages yet'}
                                            </p>
                                            <div className="room-card-footer">
                                                <div className="room-info">
                                                    <span className="participant-count">
                                                        <i className="fa-solid fa-user-group me-1"></i>
                                                        {r.participants?.length || 0}
                                                    </span>
                                                    {r.lastMessage?.createdAt && (
                                                        <span className="last-message-time">
                                                            {new Date(r.lastMessage.createdAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="room-actions">
                                                    <button
                                                        className={`btn btn-sm ${isPinned ? 'btn-warning' : 'btn-outline-secondary'}`}
                                                        onClick={(e) => handlePinRoom(r._id, e)}
                                                        title={isPinned ? "Unpin" : "Pin"}
                                                    >
                                                        <i className={`fa-solid fa-thumbtack${isPinned ? '' : ' opacity-50'}`}></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile Room List Toggle */}
                    {!showRoomList && (
                        <button 
                            className="mobile-room-toggle"
                            onClick={() => setShowRoomList(true)}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                    )}

                    {/* Chat View - Right Column */}
                    <div className="chat-room-view">
                        <div className="chat-container-wrapper d-flex flex-column w-100 border border-danger-subtle border-4 shadow-sm" style={{ margin: '16px', marginLeft: 0, marginTop: '20px', height: 'calc(100vh - 128px)' }}>
                        <div className="chat-header p-3 bg-white border-bottom border-danger-subtle" style={{ flexShrink: 0 }}>
                            <h5 className="mb-0 text-danger">
                                <i className="fa-solid fa-mask me-2"></i>
                                {room?.isPrivate ? (
                                    <>
                                        {room.displayName || getPrivateChatName(room)}
                                    </>
                                ) : (
                                    <>
                                        {room?.name || 'Group Chat'}
                                    </>
                                )}
                                
                                {/* Badges */}
                                <span className="badge bg-dark ms-2">
                                    <i className="fa-solid fa-user-secret me-1"></i>
                                    Anonymous Mode
                                </span>
                                {room?.isPrivate && (
                                    <span className="badge bg-success ms-2">
                                        <i className="fa-solid fa-lock me-1"></i>
                                        Private Chat
                                    </span>
                                )}
                            </h5>
                            
                            {/* Show participant count for group chats */}
                            {!room?.isPrivate && room?.participants?.length > 0 && (
                                <small className="text-muted">
                                    <i className="fa-solid fa-users me-1"></i>
                                    {room.participants.length} anonymous {room.participants.length === 1 ? 'member' : 'members'}
                                </small>
                            )}
                            <div className="mt-1">
                                <small className="text-muted fst-italic">
                                    <i className="fa-solid fa-shield-halved me-1"></i>
                                    All identities protected • Messages encrypted
                                </small>
                            </div>
                        </div>

                        <div className="d-flex flex-column animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(244, 244, 244, 0.7)', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                            <div className="chat-scroll overflow-auto px-3 py-2" style={{ flex: '1 1 auto', overflowY: 'auto' }}>
                                {messages.map((msg, index) => {
                                    const isUser = msg.isCurrentUser;
                                    const isSelected = selectedMessageId === msg._id;
                                    
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
                                            <div className="position-relative" style={{ maxWidth: '70%' }}>
                                                {/* User name above message bubble (WhatsApp style) */}
                                                {!isUser && (
                                                    <small className="fw-bold text-muted ms-2 mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                                                        {msg.from}
                                                    </small>
                                                )}
                                                
                                                <div
                                                    className={`message-bubble px-3 py-2 rounded-3 shadow-sm animate__animated animate__fadeInUp ${isSelected ? 'selected-message' : ''}`}
                                                    style={{
                                                        backgroundColor: isSelected 
                                                            ? (isUser ? '#b30000' : '#f0f0f0')
                                                            : (isUser ? '#cc0000' : '#ffffff'),
                                                        color: isUser ? '#fff' : '#000',
                                                        border: isUser ? 'none' : '1px solid #dee2e6',
                                                        opacity: msg.isDeleted ? 0.6 : 1,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        wordBreak: 'break-word'
                                                    }}
                                                    onMouseDown={(e) => handleMessageLongPress(msg._id, e)}
                                                    onMouseUp={handleMessageTouchEnd}
                                                    onTouchStart={(e) => handleMessageTouchStart(msg._id, e)}
                                                    onTouchEnd={handleMessageTouchEnd}
                                                    onClick={(e) => handleMessageClick(msg._id, e)}
                                                    onDoubleClick={(e) => handleMessageDoubleClick(msg._id, e)}
                                                >
                                                    {/* File attachment */}
                                                    {msg.attachment && !msg.isDeleted && (
                                                        <div className="mb-2">
                                                            {(() => {
                                                                const isImage = msg.attachment.fileType === 'image' || 
                                                                    msg.attachment.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                                                                    msg.attachment.originalName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
                                                                
                                                                if (isImage) {
                                                                    const blobUrl = imageUrls[msg._id];
                                                                    
                                                                    return blobUrl ? (
                                                                        <img 
                                                                            src={blobUrl}
                                                                            alt="attachment"
                                                                            className="img-fluid rounded shadow-sm"
                                                                            style={{ maxWidth: '250px', maxHeight: '250px', objectFit: 'cover', cursor: 'pointer' }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                // Open in new tab with blob URL
                                                                                window.open(blobUrl, '_blank');
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div 
                                                                            className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded"
                                                                            style={{ width: '250px', height: '250px' }}
                                                                        >
                                                                            <div className="spinner-border text-danger" role="status">
                                                                                <span className="visually-hidden">Loading image...</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    // Non-image file
                                                                    return (
                                                                        <button 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleFileDownload(
                                                                                    msg._id,
                                                                                    msg.attachment.url,
                                                                                    msg.attachment.fileName || msg.attachment.originalName || 'file'
                                                                                );
                                                                            }}
                                                                            className={`btn btn-sm ${isUser ? 'btn-light' : 'btn-danger'} d-flex align-items-center gap-2`}
                                                                            style={{ width: 'fit-content' }}
                                                                        >
                                                                            <i className="fa-solid fa-file"></i>
                                                                            <span className="text-truncate" style={{ maxWidth: '150px' }}>
                                                                                {msg.attachment.fileName || msg.attachment.originalName || 'File'}
                                                                            </span>
                                                                            <i className="fa-solid fa-download ms-1"></i>
                                                                        </button>
                                                                    );
                                                                }
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* Message content with time inline (WhatsApp horizontal style) */}
                                                    <div className="d-flex align-items-end gap-2">
                                                        <div style={{ whiteSpace: 'pre-line', flex: 1 }}>
                                                            {msg.content.startsWith('[GIF:') && msg.content.endsWith(']') ? (
                                                                <video
                                                                    src={msg.content.slice(6, -1)}
                                                                    autoPlay
                                                                    loop
                                                                    muted
                                                                    playsInline
                                                                    className="rounded"
                                                                    style={{ maxWidth: '250px', maxHeight: '250px', cursor: 'pointer' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(msg.content.slice(6, -1), '_blank');
                                                                    }}
                                                                />
                                                            ) : (
                                                                msg.content
                                                            )}
                                                        </div>
                                                        
                                                        {/* Time and status inline at bottom-right */}
                                                        <div className="d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: '0.7rem', alignSelf: 'flex-end' }}>
                                                            {msg.isEdited && !msg.isDeleted && (
                                                                <small style={{ opacity: 0.7, fontSize: '0.65rem' }}>edited</small>
                                                            )}
                                                            <small style={{ color: isUser ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
                                                                {msg.time}
                                                            </small>
                                                            {msg.status === 'sending' && (
                                                                <div className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}>
                                                                    <span className="visually-hidden">Sending...</span>
                                                                </div>
                                                            )}
                                                            {msg.status === 'sent' && isUser && (
                                                                <i className="fa-solid fa-check" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}></i>
                                                            )}
                                                            {msg.status === 'delivered' && isUser && (
                                                                <i className="fa-solid fa-check-double" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}></i>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* WhatsApp-style dropdown arrow for selected message */}
                                                    {isSelected && (
                                                        <div className="position-absolute top-0 end-0 mt-1 me-1">
                                                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.8rem', color: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}></i>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* WhatsApp-style context menu */}
                                                {showMessageMenu === msg._id && (
                                                    <div 
                                                        className="message-menu position-fixed bg-white rounded-3 shadow-lg py-2 z-3"
                                                        style={{
                                                            left: `${messageMenuPosition.x}px`,
                                                            top: `${messageMenuPosition.y}px`,
                                                            minWidth: '220px',
                                                            zIndex: 1050,
                                                            border: '1px solid #dee2e6'
                                                        }}
                                                    >
                                                        {!msg.isDeleted && (
                                                            <>
                                                                <button
                                                                    className="dropdown-item d-flex align-items-center gap-3 px-3 py-2"
                                                                    onClick={() => handleMenuInfo(msg._id)}
                                                                >
                                                                    <i className="fa-solid fa-info-circle text-primary"></i>
                                                                    <span>Message Info</span>
                                                                </button>
                                                                
                                                                {/* Quick Reactions Section */}
                                                                <div className="px-3 py-2 border-top border-bottom">
                                                                    <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem' }}>Quick Reactions</small>
                                                                    <div className="d-flex gap-2 justify-content-around align-items-center">
                                                                        {quickReactions.map(emoji => (
                                                                            <button
                                                                                key={emoji}
                                                                                className="btn btn-sm btn-light border"
                                                                                onClick={() => {
                                                                                    handleReaction(msg._id, emoji);
                                                                                    setShowMessageMenu(null);
                                                                                    setSelectedMessageId(null);
                                                                                }}
                                                                                style={{ 
                                                                                    fontSize: '1.3rem',
                                                                                    padding: '6px 10px',
                                                                                    transition: 'transform 0.2s',
                                                                                    backgroundColor: 'transparent'
                                                                                }}
                                                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                                            >
                                                                                {emoji}
                                                                            </button>
                                                                        ))}
                                                                        
                                                                        {/* Plus icon for more reactions */}
                                                                        <button
                                                                            className="btn btn-sm btn-light border"
                                                                            onClick={() => handleMenuReact(msg._id)}
                                                                            style={{ 
                                                                                fontSize: '1.3rem',
                                                                                padding: '6px 10px',
                                                                                transition: 'transform 0.2s',
                                                                                backgroundColor: 'transparent'
                                                                            }}
                                                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                                            title="More reactions"
                                                                        >
                                                                            <i className="fa-solid fa-plus"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {isUser && (
                                                                    <>
                                                                        <div className="dropdown-divider"></div>
                                                                        <button
                                                                            className="dropdown-item d-flex align-items-center gap-3 px-3 py-2"
                                                                            onClick={() => handleMenuEdit(msg)}
                                                                        >
                                                                            <i className="fa-solid fa-edit text-success"></i>
                                                                            <span>Edit</span>
                                                                        </button>
                                                                        <button
                                                                            className="dropdown-item d-flex align-items-center gap-3 px-3 py-2"
                                                                            onClick={() => handleMenuDelete(msg._id)}
                                                                        >
                                                                            <i className="fa-solid fa-trash text-danger"></i>
                                                                            <span>Delete</span>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Reactions Display (existing reactions only) */}
                                                {!msg.isDeleted && msg.reactions && msg.reactions.length > 0 && (
                                                    <div className="d-flex flex-wrap gap-1 mt-1">
                                                        {Object.entries(
                                                            msg.reactions.reduce((acc, r) => {
                                                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                return acc;
                                                            }, {})
                                                        ).map(([emoji, count]) => (
                                                            <span
                                                                key={emoji}
                                                                className="badge bg-light text-dark d-flex align-items-center gap-1"
                                                                style={{ fontSize: '0.85rem', cursor: 'pointer', padding: '4px 8px' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReaction(msg._id, emoji);
                                                                }}
                                                                title={msg.reactions
                                                                    .filter(r => r.emoji === emoji)
                                                                    .map(r => r.anonymousName)
                                                                    .join(', ')}
                                                            >
                                                                {emoji} <span className="fw-bold">{count}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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

                            {/* WhatsApp-style Message Info Modal */}
                            {showMessageInfo && (
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

                                        {(() => {
                                            const msg = messages.find(m => m._id === showMessageInfo);
                                            if (!msg) return null;

                                            return (
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
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                            
                            {/* Full Reaction Picker Modal (when "All Reactions" is clicked) */}
                            {showReactionPicker && (
                                <div 
                                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                    style={{ 
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        zIndex: 10000
                                    }}
                                    onClick={() => setShowReactionPicker(null)}
                                >
                                    <div 
                                        className="bg-white rounded-4 p-4 shadow-lg"
                                        style={{ 
                                            maxWidth: '600px',
                                            width: '90%',
                                            maxHeight: '80vh',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                            <h5 className="mb-0">
                                                <i className="fa-solid fa-face-smile text-warning me-2"></i>
                                                Choose a Reaction
                                            </h5>
                                            <button 
                                                className="btn-close"
                                                onClick={() => setShowReactionPicker(null)}
                                            ></button>
                                        </div>
                                        
                                        <div 
                                            className="p-2"
                                            style={{ 
                                                overflowY: 'auto',
                                                flex: 1,
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                                                gap: '8px',
                                                justifyItems: 'center'
                                            }}
                                        >
                                            {reactionEmojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    className="btn border-0"
                                                    onClick={() => {
                                                        handleReaction(showReactionPicker, emoji);
                                                        setShowReactionPicker(null);
                                                        setSelectedMessageId(null);
                                                    }}
                                                    style={{ 
                                                        fontSize: '2rem',
                                                        padding: '12px',
                                                        width: '60px',
                                                        height: '60px',
                                                        transition: 'all 0.2s',
                                                        backgroundColor: 'transparent',
                                                        borderRadius: '8px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'scale(1.3)';
                                                        e.target.style.backgroundColor = '#f0f0f0';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'scale(1)';
                                                        e.target.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="pt-3 border-top mt-3">
                                            <small className="text-muted">
                                                <i className="fa-solid fa-info-circle me-1"></i>
                                                {reactionEmojis.length} emojis available
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="d-flex align-items-end justify-content-between gap-3 p-3 bg-white shadow-sm flex-wrap border-top border-4 border-danger-subtle" style={{ flexShrink: 0, zIndex: 10 }}>
                                {/* Edit mode indicator */}
                                {editingMessageId && (
                                    <div className="w-100 d-flex justify-content-between align-items-center bg-info bg-opacity-10 p-2 rounded mb-2">
                                        <span className="text-muted">
                                            <i className="fa-solid fa-edit me-2"></i>
                                            Editing message...
                                        </span>
                                        <button
                                            className="btn btn-sm btn-close"
                                            onClick={() => {
                                                setEditingMessageId(null);
                                                setMessage('');
                                            }}
                                        ></button>
                                    </div>
                                )}

                                <div className="d-flex align-items-center gap-2 position-relative">
                                    {/* File upload button */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="d-none"
                                        onChange={handleFileUpload}
                                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                                    />
                                    <button
                                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center icon-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingFile}
                                        aria-label="Upload File"
                                        title="Upload file or image"
                                    >
                                        {uploadingFile ? (
                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                        ) : (
                                            <i className="fa-solid fa-paperclip fs-5 text-secondary"></i>
                                        )}
                                    </button>

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
                                                            onClick={async () => {
                                                                try {
                                                                    const token = localStorage.getItem('token');
                                                                    if (!token) {
                                                                        navigate('/login');
                                                                        return;
                                                                    }
                                                                    
                                                                    // Send GIF through API
                                                                    await axios.post(
                                                                        `${API_URL}/${roomId}/message`,
                                                                        { text: `[GIF: ${mp4Url}]` },
                                                                        { headers: { Authorization: `Bearer ${token}` } }
                                                                    );
                                                                    
                                                                    setShowGifPicker(false);
                                                                    
                                                                    // Fetch messages to display the GIF
                                                                    fetchMessages();
                                                                } catch (error) {
                                                                    console.error('Error sending GIF:', error);
                                                                    if (error.response?.status === 401) {
                                                                        navigate('/login');
                                                                    } else {
                                                                        alert('Failed to send GIF. Please try again.');
                                                                    }
                                                                }
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
                                        placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                                        value={message}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        disabled={sendingMessage}
                                        style={{ minHeight: '44px', maxHeight: '120px', resize: 'none' }}
                                    ></textarea>
                                    <button
                                        className="btn send-btn icon-btn1"
                                        onClick={handleSend}
                                        disabled={sendingMessage || !message.trim()}
                                        aria-label={editingMessageId ? "Update Message" : "Send Message"}
                                    >
                                        {sendingMessage ? (
                                            <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                                        ) : editingMessageId ? (
                                            <i className="fa-solid fa-check"></i>
                                        ) : (
                                            <i className="fa-solid fa-paper-plane"></i>
                                        )}
                                    </button>
                                </div>
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