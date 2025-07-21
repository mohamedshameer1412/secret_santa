// components/DareModal.jsx
import React from 'react';

const dares = [
  "Sing a song!",
  "Do 10 push-ups!",
  "Share your funniest memory!",
  "Dance for 30 seconds!",
];

const DareModal = ({ show, setShow }) => {
  const randomDare = dares[Math.floor(Math.random() * dares.length)];

  return (
    show && (
      <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-3">
            <div className="modal-er">
              <h5 className="modal-title text-danger">🎁 Your Dare</h5>
              <button className="btn-close" onClick={() => setShow(false)}></button>
            </div>
            <div className="modal-body">
              <p className="text-center fs-5">{randomDare}</p>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default DareModal;
