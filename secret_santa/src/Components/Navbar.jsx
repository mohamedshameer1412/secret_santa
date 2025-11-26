import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
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

    return (
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
                            <a className="dropdown-item" href="#profile">
                                <i className="fas fa-user me-2"></i> Profile
                            </a>
                        </li>
                        <li>
                            <a className="dropdown-item" href="#settings">
                                <i className="fas fa-cog me-2"></i> Room Settings
                            </a>
                        </li>

                        <li>
                            <a className="dropdown-item" href="#settings">
                                <i className="fas fa-crown me-2"></i> Wishlist
                            </a>
                        </li>

                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li>
                            <a className="dropdown-item text-danger" href="#logout">
                                <i className="fas fa-sign-out-alt me-2"></i> Logout
                            </a>
                        </li>
                    </ul>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
