import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import ProfileModal from './ProfileModal';
import RoomSelectorModal from './RoomSelectorModal';
import RoomSettingsModal from './RoomSettingsModal';
import WishlistQuickViewModal from './WishlistQuickViewModal';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
    const [isRoomSettingsModalOpen, setIsRoomSettingsModalOpen] = useState(false);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle profile click
    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
        setDropdownOpen(false);
    };

    // Handle room settings click
    const handleRoomSettingsClick = () => {
        setIsRoomSelectorOpen(true);
        setDropdownOpen(false);
    };

    const handleRoomSelect = (roomId) => {
        setSelectedRoomId(roomId);
        setIsRoomSettingsModalOpen(true);
    };

    const handleWishlistClick = () => {
        setIsWishlistModalOpen(true);
        setDropdownOpen(false);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout failed:', err);
        } finally {
            navigate('/login');
        }
    };

    return (
        <>
            <nav className="navbar navbar-expand-lg fixed-top navbar-custom shadow-sm d-flex justify-content-between align-items-center px-3 py-3">
                {/* Left: Toggle Sidebar + Logo */}
                <div className="fw-bold d-flex align-items-center">
                    <button
                        className="btn toggle-btn me-2"
                        onClick={toggleSidebar}
                        aria-label="Toggle Sidebar"
                    >
                        <i className="fa-solid fa-sliders"></i>
                    </button>
                    <a href="/dashboard" className='d-flex align-items-center text-decoration-none text-white'>
                        <img
                            src="/assets/santa-hide.png"
                            alt="Santa Icon"
                            width={40}
                            height={40}
                            className="mx-2"
                            style={{ objectFit: 'contain' }}
                        />
                        <span>Secret Santa</span>
                    </a>
                </div>

                {/* Right: Profile Dropdown */}
                <div className="position-relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="btn d-flex align-items-center p-0 border-0 bg-transparent"
                        aria-haspopup="true"
                        aria-expanded={dropdownOpen}
                        aria-label="User menu"
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="ms-2 text-white fw-semibold d-none d-md-inline">
                            {user?.username || user?.name || 'User'}
                        </span>
                        <img
                            src={user?.profilePic || '/assets/santa-show.png'}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-circle ms-2"
                            style={{ objectFit: 'cover' }}
                        />
                        <i className={`ms-1 fa-solid fa-caret-down text-white`}></i>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <ul
                            className="dropdown-menu dropdown-menu-end show shadow"
                            style={{ position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0 }}
                        >
                            <li>
                                {/* Opens modal instead of navigating */}
                                <button 
                                    className="dropdown-item" 
                                    onClick={handleProfileClick}
                                    style={{ 
                                        cursor: 'pointer', 
                                        background: 'none', 
                                        border: 'none', 
                                        width: '100%', 
                                        textAlign: 'left',
                                        padding: '0.5rem 1rem'
                                    }}
                                >
                                    <i className="fas fa-user me-2"></i> Profile
                                </button>
                            </li>
                            <li>
                                <button 
                                    className="dropdown-item" 
                                    onClick={handleRoomSettingsClick}
                                    style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '0.5rem 1rem' }}
                                >
                                    <i className="fas fa-cog me-2"></i> Room Settings
                                </button>
                            </li>

                            <li>
                                <button 
                                    className="dropdown-item" 
                                    onClick={handleWishlistClick}
                                    style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', padding: '0.5rem 1rem' }}
                                >
                                    <i className="fas fa-gift me-2"></i> Wishlist
                                </button>
                            </li>

                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li>
                                {/* Calls logout function */}
                                <button 
                                    className="dropdown-item text-danger" 
                                    onClick={handleLogout}
                                    style={{ 
                                        cursor: 'pointer', 
                                        background: 'none', 
                                        border: 'none', 
                                        width: '100%', 
                                        textAlign: 'left',
                                        padding: '0.5rem 1rem'
                                    }}
                                >
                                    <i className="fas fa-sign-out-alt me-2"></i> Logout
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            </nav>

            {/* Profile Modal */}
            <ProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
            />

            {/* Room Selector Modal */}
            <RoomSelectorModal
                isOpen={isRoomSelectorOpen}
                onClose={() => setIsRoomSelectorOpen(false)}
                onSelectRoom={handleRoomSelect}
            />

            {/* Room Settings Modal */}
            <RoomSettingsModal
                isOpen={isRoomSettingsModalOpen}
                onClose={() => setIsRoomSettingsModalOpen(false)}
                roomId={selectedRoomId}
            />

            {/* Wishlist Quick View Modal */}
            <WishlistQuickViewModal
                isOpen={isWishlistModalOpen}
                onClose={() => setIsWishlistModalOpen(false)}
            />
        </>
    );
};

export default Navbar;