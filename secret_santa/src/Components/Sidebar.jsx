import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const menuItems = [
    { icon: 'fa-solid fa-house', label: 'Dashboard', path: '/dashboard' },
    { icon: 'fa-solid fa-comments', label: 'Group Chat', path: '/chat' },
    { icon: 'fa-solid fa-users', label: 'Village People', path: '/contact' },
    { icon: 'fa-solid fa-gift', label: 'Wish List', path: '/wishlist' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Logout', path: '/logout' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'visible' : 'hide'}`}>
      {/* Logo */}
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
          <li key={index} className="mb-3">
            <Link
              to={item.path}
              className={`text-decoration-none d-flex align-items-center ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
