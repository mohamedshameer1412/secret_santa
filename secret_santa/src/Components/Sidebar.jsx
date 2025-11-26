import React from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, setSidebarOpen }) => { // ✅ Accept setSidebarOpen as prop
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: 'fa-solid fa-house', label: 'Dashboard', path: '/dashboard', autoClose: true }, // ✅ Auto-close
    { icon: 'fa-solid fa-comments', label: 'Group Chat', path: '/group-chat', autoClose: false }, // ✅ Keep open
    { icon: 'fa-solid fa-users', label: 'Village People', path: '/village-people', autoClose: true }, // ✅ Auto-close
    { icon: 'fa-solid fa-gift', label: 'Wish List', path: '/wishlist', autoClose: false }, // ✅ Keep open
    { icon: 'fa-solid fa-right-from-bracket', label: 'Logout', path: null },
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

    // Navigate if item has a path
    if (item.path) {
      navigate(item.path);
      
      // ✅ Auto-close sidebar for certain pages
      if (item.autoClose && setSidebarOpen) {
        setSidebarOpen(false);
      }
    }
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
            className={`mb-3 ${location.pathname === item.path ? 'active' : ''}`}
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