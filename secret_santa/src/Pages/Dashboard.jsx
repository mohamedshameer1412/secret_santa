import React, { useState } from 'react';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import DareModal from '../Components/DareModal';
import ProfileCard from '../Components/ProfileCard';
import RoomManager from '../Components/RoomManager';
import ChatBoard from '../Components/ChatBoard';
import SubmissionBoard from '../Components/SubmissionBoard';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  const [players] = useState([
    { name: 'Player 1', img: '/public/assets/santa1.png' },
    { name: 'Player 2', img: '/public/assets/santa2.png' },
    { name: 'Player 3', img: '/public/assets/santa3.png' },
    { name: 'Player 4', img: '/public/assets/santa4.png' },
  ]);

  return (
    <>
      {/* Top Navbar */}
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content Wrapper */}
      <main className={`content ${sidebarOpen ? '' : 'shifted'} py-5 my-5 px-4`} data-aos="fade-up">
        <div className="container-fluid mt-4">
          <er className="mb-4">
            <h2 className="text-danger fw-bold">
              <i className="fa-solid fa-gamepad me-2"></i>Game Dashboard
            </h2>
            <p className="text-muted mb-0">Your central hub to manage dares, rooms, chat, and submissions.</p>
          </er>

          {/* Room Creation / Entry */}
          {!currentRoom ? (
            <section className="my-5">
              <RoomManager setRoom={setCurrentRoom} />
            </section>
          ) : (
            <>
              {/* Dare Button & Room Status */}
              <section className="d-flex justify-content-between align-items-center my-4">
                <button className="btn btn-success px-4 py-2 shadow-sm" onClick={() => setShowModal(true)}>
                  <i className="fa-solid fa-bolt me-2"></i>Get a Dare
                </button>
                <span className="text-muted">
                  <i className="fa-solid fa-door-open me-1"></i>
                  Room: <strong>{currentRoom}</strong>
                </span>
              </section>

              {/* Player Cards */}
              <section className="row mb-4">
                {players.map((player, index) => (
                    <ProfileCard name={player.name} img={player.img} />
                ))}
              </section>

              {/* Chat Section */}
              <section className="mb-5">
                <ChatBoard room={currentRoom} />
              </section>

              {/* Proof Submission */}
              <section className="mb-5">
                
                <SubmissionBoard />
              </section>
            </>
          )}
        </div>
      </main>

      {/* Dare Modal */}
      <DareModal show={showModal} setShow={setShowModal} />
    </>
  );
};

export default Dashboard;
