import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import MessageList from '../Components/ChatComponents/MessageList';
import MessageInput from '../Components/ChatComponents/MessageInput';
import RoomListSidebar from '../Components/ChatComponents/RoomListSidebar';
import MessageInfoModal from '../Components/ChatComponents/MessageInfoModal';
import ReactionPickerModal from '../Components/ChatComponents/ReactionPickerModal';
import ImageViewerModal from '../Components/ChatComponents/ImageViewerModal';
import MyAssignmentCard from '../Components/MyAssignmentCard';
import 'animate.css';
import './GroupChat.css';
import axios from 'axios';
import { useAuth } from '../context/useAuth';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:5000/api/chat';

// Quick reactions shown in context menu (most popular WhatsApp reactions - 3 to fit with plus button)
const quickReactions = ['❤️', '😂', '👍'];

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
    const [imageViewer, setImageViewer] = useState({ show: false, url: null, fileName: null });

    const chatEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);
    const longPressTimer = useRef(null);

    const prevMessageCountRef = useRef(0);
    const initialScrollDone = useRef(false);
    const userScrolledUp = useRef(false);

    const [imageUrls, setImageUrls] = useState({}); // Store blob URLs for images
    
    // Multi-room state
    const [rooms, setRooms] = useState([]);
    const [pinnedRooms, setPinnedRooms] = useState(new Set());
    const [showSnow, setShowSnow] = useState(false);
    const [showRoomList, setShowRoomList] = useState(window.innerWidth > 768); // Hide on mobile by default
    const [isSecretSantaRoom, setIsSecretSantaRoom] = useState(false);
    const [roomStatus, setRoomStatus] = useState('waiting');

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
                // Check if message has an image attachment
                const hasAttachment = msg.attachment && (
                    msg.attachment.fileType === 'image' ||
                    msg.attachment.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                    msg.attachment.originalName?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
                );
                
                if (hasAttachment && !imageUrls[msg._id]) {
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

    // Fetch user's rooms
    const fetchRooms = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const res = await axios.get(`${API_URL}/my-rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.rooms && res.data.rooms.length > 0) {
                setRooms(res.data.rooms);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }, []);

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
            setIsSecretSantaRoom(roomData.roomType === 'secret-santa');
            setRoomStatus(roomData.status || 'waiting');
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
            
            // Use stored senderAvatar if available (persisted at message creation time)
            // This ensures avatar doesn't change even if user updates their profile pic
            let avatarUrl;
            if (msg.sender?.profilePic) {
                // Backend already overrides sender.profilePic with senderAvatar if it exists
                avatarUrl = msg.sender.profilePic;
            } else {
                // Fallback for messages without stored avatar (shouldn't happen with new messages)
                avatarUrl = '/assets/santa2.png';
            }
            
            return {
                _id: msg._id,
                from: displayName,
                content: msg.text,
                time: new Date(msg.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                createdAt: msg.createdAt, // Keep full date for separators
                img: avatarUrl, // Use stored avatar picture (persisted at send time)
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

        // Reset scroll state when switching rooms
        userScrolledUp.current = false;
        initialScrollDone.current = false;

        fetchRoomData();
        fetchMessages();
    }, [roomId, fetchRoomData, fetchMessages, user]);

    // Scroll to bottom - only on initial load or when sending messages
    useEffect(() => {
        if (rawMessages.length === 0) return;
        
        // Only auto-scroll if:
        // 1. Initial load (first time messages are loaded)
        // 2. User explicitly sent a message (userScrolledUp is false)
        const isInitialLoad = !initialScrollDone.current;
        const userJustSentMessage = !userScrolledUp.current && prevMessageCountRef.current < rawMessages.length;
        
        if (isInitialLoad || userJustSentMessage) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (chatEndRef.current) {
                        chatEndRef.current.scrollIntoView({ 
                            behavior: isInitialLoad ? 'smooth' : 'auto'
                        });
                        initialScrollDone.current = true;
                    }
                }, 100);
            });
        }
        
        // Update previous message count
        prevMessageCountRef.current = rawMessages.length;
    }, [rawMessages]);
    
    // Track user scroll position
    useEffect(() => {
        const handleScroll = () => {
            if (!chatContainerRef.current) return;
            
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            
            // Mark as scrolled up only if user is NOT at bottom
            userScrolledUp.current = !isAtBottom;
        };
        
        const container = chatContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [roomId]);

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
                    // Send new message with current avatar
                    await axios.post(
                        `${API_URL}/${roomId}/message`,
                        { 
                            text: message,
                            currentAvatar: user.profilePic  // Send the currently displayed avatar
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
                
                setUserTyping(false);
                setMessage('');
                
                // Reset scroll flag so user sees their own message
                userScrolledUp.current = false;
                
                // Fetch messages and update room list
                fetchMessages();
                fetchRooms();
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
            formData.append('currentAvatar', user.profilePic || '/assets/santa2.png');  // Send current avatar

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

            // Reset scroll flag so user sees their uploaded file
            userScrolledUp.current = false;
            
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
        // Separate pinned and unpinned rooms
        const pinned = rooms.filter(r => pinnedRooms.has(r._id));
        const unpinned = rooms.filter(r => !pinnedRooms.has(r._id));
        
        // Sort both by last message time (most recent first)
        const sortByLastMessage = (a, b) => {
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
            return timeB - timeA; // Descending order (newest first)
        };
        
        pinned.sort(sortByLastMessage);
        unpinned.sort(sortByLastMessage);
        
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

    const handleImageClick = (imageUrl, fileName) => {
        setImageViewer({ show: true, url: imageUrl, fileName });
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

    const handleGifSelect = async (mp4Url) => {
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
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to send GIF',
                    text: 'Please try again.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            }
        }
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

    // Handle window resize for responsive room list
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setShowRoomList(true); // Always show on desktop
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                    {/* Room List Sidebar */}
                    <RoomListSidebar
                        showRoomList={showRoomList}
                        showSnow={showSnow}
                        sortedRooms={sortedRooms}
                        roomId={roomId}
                        pinnedRooms={pinnedRooms}
                        user={user}
                        toggleSnow={toggleSnow}
                        handleRoomSelect={handleRoomSelect}
                        handlePinRoom={handlePinRoom}
                    />

                    {/* Mobile Room List Toggle */}
                    {!showRoomList && (
                        <button 
                            className="mobile-room-toggle"
                            onClick={() => setShowRoomList(true)}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                    )}

                    {/* Chat View */}
                    <div className="chat-room-view">
                        <div className="chat-container-wrapper d-flex flex-column w-100 border border-danger-subtle border-4 shadow-sm" style={{ margin: '16px', marginLeft: 0, marginTop: '20px', height: 'calc(100vh - 128px)' }}>
                            {/* Chat Header */}
                            <div className="chat-header p-3 bg-white border-bottom border-danger-subtle" style={{ flexShrink: 0 }}>
                                <h5 className="mb-0 text-danger">
                                    <i className="fa-solid fa-mask me-2"></i>
                                    {room?.isPrivate ? (
                                        <>{room.displayName || getPrivateChatName(room)}</>
                                    ) : (
                                        <>{room?.name || 'Group Chat'}</>
                                    )}
                                    
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

                            {/* My Assignment Card - Show for Secret Santa rooms if drawn */}
                            {isSecretSantaRoom && roomStatus === 'drawn' && (
                                <div style={{ padding: '1rem', backgroundColor: 'rgba(244, 244, 244, 0.7)' }}>
                                    <MyAssignmentCard roomId={roomId} />
                                </div>
                            )}

                            {/* Message Area */}
                            <div className="d-flex flex-column animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(244, 244, 244, 0.7)', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                                <MessageList
                                    messages={messages}
                                    selectedMessageId={selectedMessageId}
                                    imageUrls={imageUrls}
                                    showMessageMenu={showMessageMenu}
                                    messageMenuPosition={messageMenuPosition}
                                    quickReactions={quickReactions}
                                    typingUsers={typingUsers}
                                    chatEndRef={chatEndRef}
                                    chatContainerRef={chatContainerRef}
                                    handleMessageLongPress={handleMessageLongPress}
                                    handleMessageTouchStart={handleMessageTouchStart}
                                    handleMessageTouchEnd={handleMessageTouchEnd}
                                    handleMessageClick={handleMessageClick}
                                    handleMessageDoubleClick={handleMessageDoubleClick}
                                    handleMenuInfo={handleMenuInfo}
                                    handleMenuEdit={handleMenuEdit}
                                    handleMenuDelete={handleMenuDelete}
                                    handleReaction={handleReaction}
                                    setShowMessageMenu={setShowMessageMenu}
                                    setSelectedMessageId={setSelectedMessageId}
                                    handleMenuReact={handleMenuReact}
                                    handleFileDownload={handleFileDownload}
                                    handleImageClick={handleImageClick}
                                />
                                
                                {/* Message Input */}
                                <MessageInput
                                    message={message}
                                    editingMessageId={editingMessageId}
                                    showEmojiPicker={showEmojiPicker}
                                    showGifPicker={showGifPicker}
                                    gifQuery={gifQuery}
                                    gifs={gifs}
                                    uploadingFile={uploadingFile}
                                    sendingMessage={sendingMessage}
                                    fileInputRef={fileInputRef}
                                    inputRef={inputRef}
                                    setMessage={setMessage}
                                    setShowEmojiPicker={setShowEmojiPicker}
                                    setShowGifPicker={setShowGifPicker}
                                    setGifQuery={setGifQuery}
                                    setEditingMessageId={setEditingMessageId}
                                    handleInputChange={handleInputChange}
                                    handleKeyDown={handleKeyDown}
                                    handleSend={handleSend}
                                    handleFileUpload={handleFileUpload}
                                    handleEmojiClick={handleEmojiClick}
                                    handleGifSelect={handleGifSelect}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modals */}
            <MessageInfoModal
                showMessageInfo={showMessageInfo}
                setShowMessageInfo={setShowMessageInfo}
                messages={messages}
                room={room}
            />

            <ReactionPickerModal
                showReactionPicker={showReactionPicker}
                setShowReactionPicker={setShowReactionPicker}
                setSelectedMessageId={setSelectedMessageId}
                handleReaction={handleReaction}
            />

            {imageViewer.show && (
                <ImageViewerModal
                    imageUrl={imageViewer.url}
                    fileName={imageViewer.fileName}
                    onClose={() => setImageViewer({ show: false, url: null, fileName: null })}
                />
            )}
        </div>
    );
};

export default GroupChat;
