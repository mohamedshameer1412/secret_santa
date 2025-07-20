import React from 'react';
import confetti from 'canvas-confetti';

const ConfettiTrigger = () => {
  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <button className="btn btn-danger mt-3" onClick={fireConfetti}>
      🎉 Trigger Confetti
    </button>
  );
};

export default ConfettiTrigger;
