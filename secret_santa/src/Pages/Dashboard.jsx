import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/useAuth';
import axios from 'axios';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';

const API_URL = 'http://localhost:5000/api/children';

const ChildReveal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [names, setNames] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [drawStarted, setDrawStarted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const backdropRef = useRef(null);
  const ITEM_HEIGHT = 120;

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setStats(res.data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [authLoading, user, navigate]);

  // Load available names for slot machine
  useEffect(() => {
    // You can fetch from backend or use predefined list
    const childNames = ["Aryan", "Meena", "Ravi", "Lila", "Nisha", "Ayaan", "Priya", "Rohan"];
    setNames(childNames);
  }, []);

  useEffect(() => {
    if (!showModal || !backdropRef.current) return;

    for (let i = 0; i < 100; i++) {
      const flake = document.createElement("div");
      flake.className = "snowflake";
      flake.style.left = `${Math.random() * 100}vw`;
      flake.style.animationDelay = `${Math.random() * 6}s`;
      flake.style.animationDuration = `${4 + Math.random() * 4}s`;
      backdropRef.current.appendChild(flake);

      flake.addEventListener("animationend", () => {
        flake.remove();
      });
    }
  }, [showModal]);

  const handleDraw = async () => {
    if (drawStarted) return;
    setDrawStarted(true);

    const chosenIdx = Math.floor(Math.random() * names.length);
    setSelectedIndex(chosenIdx);

    const sound = new Audio("/sounds/reveal.mp3");
    sound.play();

    // Call backend API to reveal child
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/reveal`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTimeout(() => {
        localStorage.setItem("selectedChild", JSON.stringify(res.data.child));
        navigate("/child-profile");
      }, 3500);
    } catch (error) {
      console.error('Error revealing child:', error);
      
      if (error.response?.status === 400) {
        alert(error.response.data.error);
        setDrawStarted(false);
        setShowModal(false);
        return;
      }
      
      alert('Failed to reveal child. Please try again.');
      setDrawStarted(false);
    }
  };

  const finalIndex = selectedIndex !== null ? selectedIndex + names.length : 0;
  const translateY = -finalIndex * ITEM_HEIGHT;

  if (authLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column w-100 vh-100">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main
        className={`content ${sidebarOpen ? '' : 'shifted'} py-4 px-3 px-md-5 mt-5`}
        style={{ minHeight: 'calc(100vh - 56px)' }}
      >
        {!showModal && (
          <>
            <div className="text-center mb-4">
              <h1 className="fw-bold text-danger mb-2">Welcome to the Child Reveal Dashboard</h1>
              <p className="text-muted fs-5">
                Generate a secret child or review your profile below.
              </p>
            </div>

            <div className="row justify-content-center g-4 mb-5">
              <div className="col-12 col-md-4">
                <div className="card shadow-sm border-danger h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <i className="bi bi-people-fill fs-1 text-danger"></i>
                    <div>
                      <h5 className="card-title mb-1">Total Children</h5>
                      <p className="card-text fs-4 fw-semibold mb-0">
                        {stats?.totalChildren || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card shadow-sm border-danger h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <i className="bi bi-clock-history fs-1 text-danger"></i>
                    <div>
                      <h5 className="card-title mb-1">Last Generated</h5>
                      <p className="card-text fs-6 text-muted mb-0">
                        {stats?.lastRevealed 
                          ? new Date(stats.lastRevealed).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="card shadow-sm border-danger h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <i className="bi bi-lightbulb-fill fs-1 text-danger"></i>
                    <div>
                      <h5 className="card-title mb-1">Clues Revealed</h5>
                      <p className="card-text fs-4 fw-semibold mb-0">
                        {stats?.totalCluesRevealed || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center">
              <button
                className="btn btn-danger btn-lg rounded-pill px-5 shadow"
                onClick={() => setShowModal(true)}
                aria-label="Open generate child modal"
              >
                <i className="bi bi-rocket-fill me-2"></i>
                Generate Child
              </button>
            </div>
          </>
        )}
      </main>


      {showModal && (
        <>
          <div
            ref={backdropRef}
            className="modal-backdrop fade show position-fixed top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1040,
              overflow: "hidden",
            }}
            onClick={() => !drawStarted && setShowModal(false)}
            aria-hidden="true"
          />

          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="childRevealModalLabel"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              overflowY: "auto",
              zIndex: 1050,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "1rem",
            }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content bg-dark text-white rounded-4 shadow-lg position-relative overflow-hidden">
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold" id="childRevealModalLabel">
                    Pull the Lever to Reveal Your Secret Child
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => {
                      if (!drawStarted) {
                        setShowModal(false);
                        setSelectedIndex(null);
                      }
                    }}
                    disabled={drawStarted}
                  />
                </div>

                <div className="modal-body d-flex flex-column align-items-center">
                  <div
                    className="glassmorph slot-box mb-4 position-relative w-100"
                    aria-live="polite"
                    aria-atomic="true"
                    style={{ maxWidth: "360px", height: `${ITEM_HEIGHT}px` }}
                  >
                    <div
                      className="reel"
                      style={{
                        transform: drawStarted ? `translateY(${translateY}px)` : "translateY(0)",
                        transition: drawStarted
                          ? "transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)"
                          : "none",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        willChange: "transform",
                      }}
                      aria-hidden={false}
                    >
                      {names.concat(names).map((name, index) => {
                        const isSelected = selectedIndex !== null && index === finalIndex;
                        return (
                          <div
                            className={`reel-name${isSelected ? " selected" : ""}`}
                            key={index}
                            aria-current={isSelected ? "true" : undefined}
                          >
                            {name}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    className={`lever-button btn btn-danger shadow${drawStarted ? " started" : ""} mt-2 d-flex align-items-center gap-2`}
                    onClick={handleDraw}
                    disabled={drawStarted}
                    title="Pull the lever"
                    aria-pressed={drawStarted}
                    aria-label="Pull the lever to reveal the secret child"
                  >
                    <i className="fas fa-level-down-alt fa-2x"></i>
                    <span className="button-text">{drawStarted ? "Revealing..." : "Generate Child"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        :root {
          --green: #28a745;
          --light-red: #ff4d4d;
          --dark-red: #a30000;
          --white: #ffffff;
          --medium-red: #cc0000;
        }

        .glassmorph {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1.5rem;
          max-width: 360px;
          width: 90%;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          position: relative;
          height: ${ITEM_HEIGHT}px;
        }

        .slot-box {
          position: relative;
          height: ${ITEM_HEIGHT}px;
          overflow: hidden;
        }

        .reel {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          will-change: transform;
        }

        .reel-name {
          height: ${ITEM_HEIGHT}px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2rem;
          color: var(--white);
          font-weight: 700;
          text-shadow: 0 0 5px rgba(0,0,0,0.5);
          user-select: none;
          transition: background-color 0.5s ease, color 0.5s ease, text-shadow 0.5s ease;
          border-radius: 12px;
          margin: 0 1rem;
        }

        .reel-name.selected {
          background-color: var(--white);
          color: var(--dark-red);
          font-weight: 900;
          text-shadow: none;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.9);
          transition: background-color 0.7s ease, color 0.7s ease, box-shadow 0.7s ease;
        }

        .lever-button {
          background-color: var(--medium-red);
          border: 3px solid var(--white);
          border-radius: 50px;
          padding: 0.6rem 1.5rem;
          color: var(--white);
          transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-weight: 600;
          font-size: 1.1rem;
          user-select: none;
          box-shadow: 0 6px 12px rgba(0,0,0,0.3);
          min-width: 180px;
        }

        .lever-button i {
          transition: transform 0.3s ease;
        }

        .lever-button:hover:not(:disabled) {
          background-color: var(--dark-red);
          box-shadow: 0 8px 16px rgba(0,0,0,0.4);
        }

        .lever-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .lever-button.started i {
          animation: lever-spin 1.5s linear infinite;
        }

        @keyframes lever-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .button-text {
          display: inline-block;
          transition: opacity 0.4s ease;
          white-space: nowrap;
        }

        .snowflake {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          background: var(--white);
          border-radius: 50%;
          opacity: 0.8;
          animation: snowFall 6s linear forwards;
          filter: drop-shadow(0 0 1px rgba(255,255,255,0.8));
        }

        @keyframes snowFall {
          0% {
            transform: translateY(-10px);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        @media (max-width: 576px) {
          .reel-name {
            font-size: 1.5rem;
          }

          .lever-button {
            min-width: 140px;
            font-size: 1rem;
            padding: 0.5rem 1.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ChildReveal;
