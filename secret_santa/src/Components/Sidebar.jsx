import React from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: 'fa-solid fa-house', label: 'Dashboard' },
    // { icon: 'fa-solid fa-door-open', label: 'Create/Join Room' },
    { icon: 'fa-solid fa-comments', label: 'Group Chat' },
    // { icon: 'fa-solid fa-hand-fist', label: 'Dare Assignments' },
    // { icon: 'fa-solid fa-heart', label: 'Child Wishlist' },
    // { icon: 'fa-solid fa-gifts', label: 'Gifts & Notes' },
    // { icon: 'fa-solid fa-upload', label: 'Submit Proof' },
    // { icon: 'fa-solid fa-user-circle', label: 'Profile & Media' },
    { icon: 'fa-solid fa-users', label: 'Village People' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Logout' },
  ];

    const handleMenuClick = async (item) => {
        if (item.label === 'Logout') {
            try {
                await logout();
            } catch (err) {
                console.error('Logout failed:', err);
            } finally {
                navigate('/login');
            }
            return;
        }

        // navigate if item has a path (add path to menuItems for other entries)
        if (item.path) navigate(item.path);
    };

  return (
    <div className={`sidebar ${isOpen ? 'visible' : 'hide'}`}>
      {/* Logo and Title */}
      <div
        className="d-flex align-items-center mb-4 mx-4 my-5"
        style={{ userSelect: 'none' }}
      >
        <img
          src="/assets/logo.png"
          alt="Santa Icon"
          width={80}
          height={80}
          style={{ objectFit: 'contain' }}
        />
        <div className="title-text ms-2" style={{ lineHeight: 1 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: '1.5rem' }}>Secret</span>
          <span style={{ display: 'block', fontWeight: 700, fontSize: '2rem' }}>Santa</span>
        </div>
      </div>

      {/* Navigation Items */}
      <ul className="sidebar-menu px-3">
        {menuItems.map((item, index) => (
            <li
                key={index}
                className="mb-3"
                style={{ cursor: 'pointer' }}
                onClick={() => handleMenuClick(item)}
                >
                <i className={`${item.icon} me-2`}></i> {item.label}
            </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
