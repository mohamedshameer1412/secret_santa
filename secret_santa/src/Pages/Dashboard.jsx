import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Confetti from "react-confetti";
import Lottie from "lottie-react";
import spinAnimation from "../assets/spin.json"; // Lottie JSON for spinning wheel
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { FaGift, FaQuestionCircle, FaList, FaUser, FaComments } from "react-icons/fa";

const wishlists = ["Teddy Bear", "Toy Car", "Story Book", "Video Game", "Crayon Set", "Candy Box"];
const dares = ["Sing a Christmas song", "Do a fun dance", "Give a gift", "Tell your silliest joke"];
const clues = ["Wears a red hat", "Loves animals", "Sparkles with joy", "Has creative hands"];

const ChildGenerator = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(false);
  const [child, setChild] = useState(null);

  const generateChild = () => {
    setLoading(true);
    setChild(null);
    setShowConfetti(false);

    setTimeout(() => {
      // Randomized child object
      const newChild = { /* same as user code */ };

      setChild(newChild);
      setLoading(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }, 2000);
  };

  return (
    <div className="d-flex flex-column w-100 vh-100">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />

      <main className={`content ${sidebarOpen ? '' : 'shifted'} p-4`}>
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
        <div className="bg-white bg-opacity-75 p-4 rounded-4 shadow-lg text-center">
          <h2 className="text-danger fw-bold"><FaGift className="me-2" />Secret Santa Lottery</h2>

          <motion.button
            className="btn btn-success mt-3 px-5 py-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateChild}
            disabled={loading}
          >
            {loading ? <FaGift className="me-1" /> : <FaGift className="me-1" />} Spin the Wheel
          </motion.button>

          {/* Lottery Spin Animation */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 d-flex flex-column align-items-center"
              >
                <Lottie animationData={spinAnimation} style={{ width: 150, height: 150 }} />
                <p className="mt-3 text-muted">Drawing your child...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Child Profile Reveal */}
          <AnimatePresence>
            {child && (
              <motion.div
                key={child.id}
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="mt-5 bg-white rounded-4 shadow-sm p-4 mx-auto"
                style={{ maxWidth: 600 }}
              >
                <div className="text-center mb-3">
                  <img
                    src={child.avatar}
                    alt={child.name}
                    className="rounded-circle border shadow-sm"
                    width={120}
                    height={120}
                  />
                  <h4 className="mt-2 fw-bold"><FaUser className="me-2" />{child.name}, Age {child.age}</h4>
                </div>

                <ul className="list-group list-group-flush fs-6">
                  <li className="list-group-item"><FaList className="me-2 text-primary" />Wishlist: <strong>{child.wishlist}</strong></li>
                  <li className="list-group-item"><FaGift className="me-2 text-success" />Dare: <strong>{child.dare}</strong></li>
                  <li className="list-group-item"><FaQuestionCircle className="me-2 text-warning" />Clue: <em>{child.clue}</em></li>
                </ul>

                <div className="text-center mt-4">
                  <motion.button
                    className="btn btn-outline-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaComments className="me-2" />Start Chat
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ChildGenerator;
