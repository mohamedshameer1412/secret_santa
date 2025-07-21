import React from 'react';

const ProfileCard = ({ name, img }) => (
  <div className="col-md-4 col-sm-6 mb-4">
    <div className="card border-0 shadow-lg rounded-4 text-center h-100 bg-white profile-card">
      {/* Avatar */}
      <div className="pt-4">
        <img
          src={img}
          alt={name}
          className="rounded-circle border border-2"
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'cover',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>

      {/* Details */}
      <div className="card-body">
        <h5 className="card-title fw-semibold text-dark">
          <i className="fa-solid fa-user-circle me-2 text-success"></i>
          {name}
        </h5>
        <p className="card-text text-muted mb-3">
          <i className="fa-solid fa-gamepad me-2 text-secondary"></i>
          Game Enthusiast
        </p>

        {/* Future interactive buttons (optional) */}
        <div className="d-flex justify-content-center gap-2">
          <button className="btn btn-outline-success btn-sm px-3">
            <i className="fa-solid fa-gift me-1"></i> Wishlist
          </button>
          <button className="btn btn-outline-primary btn-sm px-3">
            <i className="fa-solid fa-lightbulb me-1"></i> Clues
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileCard;

