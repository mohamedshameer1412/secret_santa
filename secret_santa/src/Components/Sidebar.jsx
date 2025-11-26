import React from 'react';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { icon: 'fa-solid fa-house', label: 'Dashboard', path: '/dashboard' },
    { icon: 'fa-solid fa-comments', label: 'Group Chat', path: '/chat' },
    { icon: 'fa-solid fa-users', label: 'Village People', path: '/contact' },
    { icon: 'fa-solid fa-gift', label: 'Wish List', path: '/wishlist' },
    { icon: 'fa-solid fa-right-from-bracket', label: 'Logout', path: '/logout' },
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
          <li key={index} className="mb-3" style={{ cursor: 'pointer' }}>
            <i className={`${item.icon} me-2`}></i> {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
