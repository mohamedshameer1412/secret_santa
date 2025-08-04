import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";

const dareSuggestions = {
  fitness: ["Do 10 push-ups", "Run around the yard", "Do 20 jumping jacks"],
  fun: ["Sing a song loudly", "Dance for 1 minute", "Draw a funny face"],
  challenge: ["Try to juggle 3 balls", "Solve a puzzle", "Build a paper airplane"],
  default: ["Do a silly walk", "Tell a joke", "Make a funny face"],
};

const newAvatar = "https://i.pravatar.cc/150?img=12";

const glassColors = {
  bg: "rgba(255, 255, 255, 0.05)", // subtle translucent, no solid bg color
  border: "rgba(204, 0, 0, 0.5)",
  shadow: "0 8px 32px 0 rgba(204, 0, 0, 0.25)",
  text: "#cc0000",
};

const ChildProfile = () => {
  const navigate = useNavigate();
  const [childData, setChildData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [newClue, setNewClue] = useState("");
  const [newDare, setNewDare] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [showDareModal, setShowDareModal] = useState(false);
  const [suggestedDares, setSuggestedDares] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState("");

  useEffect(() => {
    try {
      const data = localStorage.getItem("selectedChild");
      if (data) {
        setChildData(JSON.parse(data));
      } else {
        navigate("/draw");
      }
    } catch {
      navigate("/draw");
    }
  }, [navigate]);

  if (!childData) return null;

  const handleAddClue = () => {
    if (newClue.trim()) {
      const updatedClues = childData.clues ? [...childData.clues, newClue.trim()] : [newClue.trim()];
      const updatedChild = { ...childData, clues: updatedClues };
      setChildData(updatedChild);
      localStorage.setItem("selectedChild", JSON.stringify(updatedChild));
      setNewClue("");
    }
  };

  const handleDareChange = (e) => {
    setNewDare(e.target.value);
    const input = e.target.value.toLowerCase();
    if (!input) {
      setSuggestedDares([]);
      return;
    }
    const keys = Object.keys(dareSuggestions);
    const matchedKey = keys.find((key) => input.includes(key)) || "default";
    setSuggestedDares(dareSuggestions[matchedKey]);
  };

  const handleAssignDare = () => {
    if (newDare.trim()) {
      const updatedChild = { ...childData, dare: newDare.trim() };
      setChildData(updatedChild);
      localStorage.setItem("selectedChild", JSON.stringify(updatedChild));
      setShowDareModal(false);
      setNewDare("");
      setSuggestedDares([]);
      setSelectedSuggestion("");
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setNewDare(suggestion);
    setSelectedSuggestion(suggestion);
  };

  const handleProofChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const updatedChild = { ...childData, proof: url };
      setChildData(updatedChild);
      localStorage.setItem("selectedChild", JSON.stringify(updatedChild));
      setProofFile(file);
    }
  };

  return (
    <>
      <style>{`
        /* Flex utilities */
        .d-flex { display: flex; }
        .flex-column { flex-direction: column; }
        .vh-100 { height: 100vh; }
        .w-100 { width: 100%; }

        main.content {
          flex-grow: 1;
          padding: 2rem 3rem;
          margin-top: 60px;
          overflow-y: auto;
          transition: margin-left 0.3s ease;
        }
        main.content.shifted {
          margin-left: 250px;
        }
        .container-fluid {
          max-width: 1200px;
          margin: auto;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
        }
        .col-lg-4 { flex: 0 0 33.3333%; max-width: 33.3333%; padding: 0; }
        .col-lg-8 { flex: 0 0 66.6667%; max-width: 66.6667%; padding: 0; }

        /* Glass card without heavy bg */
        .glass-card {
          background: ${glassColors.bg};
          border: 1.5px solid ${glassColors.border};
          box-shadow: ${glassColors.shadow};
          border-radius: 15px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: ${glassColors.text};
          padding: 2rem;
          transition: transform 0.3s ease;
          animation: fadeIn 0.8s ease forwards;
        }
        .glass-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px 0 rgba(204, 0, 0, 0.4);
        }

        /* Avatar */
        .avatar-img {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 3px solid ${glassColors.border};
          object-fit: cover;
          margin-bottom: 1rem;
          transition: transform 0.3s ease;
          box-shadow: 0 0 12px 2px rgba(204, 0, 0, 0.8);
        }
        .avatar-img:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px 4px rgba(204, 0, 0, 1);
        }

        /* Buttons */
        .btn-danger, .btn-outline-danger {
          border-radius: 30px;
          padding: 0.4rem 1.2rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border: 2px solid ${glassColors.border};
          background-color: transparent;
          color: ${glassColors.text};
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
          outline: none;
        }
        .btn-danger {
          background: ${glassColors.text};
          color: #fff;
          border-color: ${glassColors.text};
          box-shadow: 0 0 8px 0 ${glassColors.text};
        }
        .btn-danger:hover {
          background: #a30000;
          box-shadow: 0 0 14px 3px #a30000;
        }
        .btn-outline-danger {
          background: transparent;
          color: ${glassColors.text};
          border-color: ${glassColors.text};
          box-shadow: none;
        }
        .btn-outline-danger:hover {
          background: #cc0000;
          color: white;
          box-shadow: 0 0 12px 2px #cc0000;
          border-color: #cc0000;
        }

        /* Inputs */
        .form-control {
          background: transparent;
          border: 1.5px solid ${glassColors.border};
          color: ${glassColors.text};
          border-radius: 12px;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          outline: none;
          user-select: text;
          transition: border-color 0.3s ease, background-color 0.3s ease;
        }
        .form-control:focus {
          border-color: #cc0000;
          box-shadow: 0 0 6px 2px #cc0000;
          background: rgba(204, 0, 0, 0.15);
          color: #fff;
        }

        /* Badges */
        .badge {
          font-weight: 600;
          font-size: 0.85rem;
          background: rgba(204, 0, 0, 0.6);
          color: #fff;
          margin: 0.15rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          user-select: none;
          box-shadow: 0 0 6px 0 rgba(204, 0, 0, 0.7);
          transition: background-color 0.3s ease;
        }
        .badge:hover {
          background-color: #a30000;
          cursor: default;
        }

        /* Modal */
        .modal {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          animation: fadeIn 0.35s ease forwards;
          z-index: 1050;
        }
        .modal-dialog {
          max-width: 480px;
          width: 90%;
          border-radius: 15px;
          overflow: hidden;
          animation: slideDown 0.35s ease forwards;
        }
        .modal-content {
          background: ${glassColors.bg};
          color: ${glassColors.text};
          border: 1.5px solid ${glassColors.border};
          box-shadow: ${glassColors.shadow};
          padding: 1.5rem;
          border-radius: 15px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(204, 0, 0, 0.4);
          margin-bottom: 1rem;
        }
        .modal-title {
          font-weight: 700;
          font-size: 1.3rem;
          color: ${glassColors.text};
          user-select: none;
        }
        .btn-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #cc0000;
          cursor: pointer;
          transition: color 0.3s ease;
          outline: none;
          user-select: none;
        }
        .btn-close:hover {
          color: #a30000;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        /* Suggestion buttons */
        .suggestion-btn {
          border-radius: 25px;
          font-size: 0.85rem;
          padding: 0.4rem 1rem;
          user-select: none;
          transition: background-color 0.3s ease, color 0.3s ease;
          cursor: pointer;
          border: 1.5px solid ${glassColors.border};
          background: transparent;
          color: ${glassColors.text};
          box-shadow: none;
        }
        .suggestion-btn.selected,
        .suggestion-btn:hover {
          background: #cc0000;
          color: white;
          border-color: #cc0000;
          box-shadow: 0 0 10px 2px #cc0000;
        }

        /* Proof Image */
        .proof-img {
          max-width: 100%;
          border-radius: 12px;
          border: 2px solid ${glassColors.border};
          box-shadow: 0 0 12px 3px rgba(204, 0, 0, 0.6);
          margin-top: 1rem;
          user-select: none;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Scrollbar for main content */
        main.content::-webkit-scrollbar {
          width: 8px;
        }
        main.content::-webkit-scrollbar-thumb {
          background-color: #cc0000aa;
          border-radius: 10px;
        }
      `}</style>

      <div className="d-flex vh-100 w-100">
        <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`content ${sidebarOpen ? "shifted" : ""}`}>
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <div className="container-fluid">
            <h2 style={{ color: glassColors.text, marginBottom: "1.5rem", userSelect: "none" }}>
              Child Profile: <span style={{ fontWeight: "700" }}>{childData.name}</span>
            </h2>

            <div className="row">
              {/* Left Panel */}
              <section className="col-lg-4 glass-card" aria-label="Child Information">
                <img
                  src={newAvatar}
                  alt={`${childData.name} avatar`}
                  className="avatar-img"
                  draggable={false}
                />
                <h3 style={{ marginBottom: "0.5rem", userSelect: "none" }}>{childData.name}</h3>
                <p><strong>Age:</strong> {childData.age}</p>

                <hr style={{ borderColor: glassColors.border, margin: "1.5rem 0" }} />

                <div>
                  <h4>Clues</h4>
                  <ul style={{ paddingLeft: "1.2rem" }}>
                    {(childData.clues && childData.clues.length > 0) ? (
                      childData.clues.map((clue, idx) => (
                        <li key={idx} style={{ marginBottom: "0.5rem" }}>{clue}</li>
                      ))
                    ) : (
                      <li style={{ fontStyle: "italic", color: "#900000" }}>No clues added yet.</li>
                    )}
                  </ul>

                  <div className="d-flex" style={{ marginTop: "1rem", gap: "0.8rem" }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add new clue"
                      value={newClue}
                      onChange={(e) => setNewClue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddClue()}
                      aria-label="Add new clue"
                    />
                    <button
                      className="btn-danger"
                      onClick={handleAddClue}
                      aria-label="Add clue button"
                      disabled={!newClue.trim()}
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Panel */}
              <section className="col-lg-8 glass-card" aria-label="Child Dare Section">
                <h4>Current Dare</h4>
                {childData.dare ? (
                  <p style={{ fontSize: "1.25rem", fontWeight: "600" }}>{childData.dare}</p>
                ) : (
                  <p style={{ fontStyle: "italic", color: "#900000" }}>No dare assigned yet.</p>
                )}

                <button
                  className="btn-outline-danger"
                  onClick={() => setShowDareModal(true)}
                  type="button"
                  aria-haspopup="dialog"
                >
                  Assign a New Dare
                </button>

                {childData.proof && (
                  <>
                    <h5 style={{ marginTop: "1.5rem" }}>Proof of Completion</h5>
                    <img
                      src={childData.proof}
                      alt="Proof of dare completion"
                      className="proof-img"
                      draggable={false}
                    />
                  </>
                )}

                <div style={{ marginTop: "1.5rem" }}>
                  <label
                    htmlFor="proofUpload"
                    className="btn-danger"
                    style={{ cursor: "pointer", display: "inline-block" }}
                  >
                    Upload Proof
                  </label>
                  <input
                    type="file"
                    id="proofUpload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleProofChange}
                    aria-label="Upload proof image"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Dare Modal */}
          {showDareModal && (
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="dareModalTitle">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="dareModalTitle">Assign a New Dare</h5>
                    <button
                      type="button"
                      className="btn-close"
                      aria-label="Close"
                      onClick={() => setShowDareModal(false)}
                    >
                      &times;
                    </button>
                  </div>

                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Enter dare here..."
                    value={newDare}
                    onChange={handleDareChange}
                    aria-describedby="dareSuggestions"
                  />

                  {/* Suggestions */}
                  {suggestedDares.length > 0 && (
                    <div
                      id="dareSuggestions"
                      style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}
                      aria-label="Dare suggestions"
                    >
                      {suggestedDares.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className={`suggestion-btn ${selectedSuggestion === suggestion ? "selected" : ""}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          aria-pressed={selectedSuggestion === suggestion}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="modal-footer">
                    <button
                      className="btn-outline-danger"
                      onClick={() => setShowDareModal(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-danger"
                      onClick={handleAssignDare}
                      disabled={!newDare.trim()}
                      type="button"
                    >
                      Assign Dare
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ChildProfile;
