// components/Sidebar.jsx
import React from 'react';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { icon: 'fa-solid fa-house', label: 'Dashboard' },
    { icon: 'fa-solid fa-door-open', label: 'Create/Join Room' },
    { icon: 'fa-solid fa-comments', label: 'Group Chat' },
    { icon: 'fa-solid fa-user-secret', label: 'Anonymous Group Chat' },
    { icon: 'fa-solid fa-user', label: 'Individual Chat' },
    { icon: 'fa-solid fa-mask', label: 'Anonymous Chat' },
    { icon: 'fa-solid fa-hand-fist', label: 'Dare Assignments' },
    { icon: 'fa-solid fa-lightbulb', label: 'Clues to Find Parent' },
    { icon: 'fa-solid fa-heart', label: 'Child Wishlist' },
    { icon: 'fa-solid fa-gifts', label: 'Gifts & Notes' },
    { icon: 'fa-solid fa-upload', label: 'Submit Proof' },
    { icon: 'fa-solid fa-user-circle', label: 'Profile & Media' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Logout' },
  ];

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
          <li key={index} className="mb-3" style={{ cursor: 'pointer' }}>
            <i className={`${item.icon} me-2`}></i> {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
