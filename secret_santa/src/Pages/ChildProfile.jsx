import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import Swal from "sweetalert2";

const glassColors = {
	bg: "rgba(255, 255, 255, 0.05)",
	border: "rgba(204, 0, 0, 0.5)",
	shadow: "0 8px 32px 0 rgba(204, 0, 0, 0.25)",
	text: "#cc0000",
};

const ChildProfile = () => {
	const { roomId } = useParams();
	const navigate = useNavigate();
	const { user, loading: authLoading } = useAuth();

	const [assignmentData, setAssignmentData] = useState(null);
	const [roomData, setRoomData] = useState(null);
	const [wishlistItems, setWishlistItems] = useState([]);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [loading, setLoading] = useState(true);
	const [notes, setNotes] = useState("");
	const [giftIdeas, setGiftIdeas] = useState([]);
	const [newGiftIdea, setNewGiftIdea] = useState("");

	useEffect(() => {
		const fetchAssignmentData = async () => {
			if (authLoading) return;

			if (!user) {
				navigate("/login");
				return;
			}

			if (!roomId) {
				navigate("/dashboard");
				return;
			}

			try {
				setLoading(true);
				const token = localStorage.getItem("token");

				// Fetch assignment
				const assignmentRes = await axios.get(
					`http://localhost:5000/api/chat/${roomId}/my-assignment`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				setAssignmentData(assignmentRes.data.assignment);

				// Fetch room details
				const roomRes = await axios.get(
					`http://localhost:5000/api/chat/${roomId}`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				setRoomData(roomRes.data.room || roomRes.data);

				// Try to fetch receiver's wishlist if they have one
				if (assignmentRes.data.assignment.receiverId) {
					try {
						const wishlistRes = await axios.get(
							`http://localhost:5000/api/wishlist/user/${assignmentRes.data.assignment.receiverId}`,
							{ headers: { Authorization: `Bearer ${token}` } }
						);
						setWishlistItems(wishlistRes.data.items || []);
					} catch (err) {
						console.log("No wishlist found for receiver");
					}
				}

				// Load saved notes and gift ideas from localStorage
				const savedNotes = localStorage.getItem(`gift-notes-${roomId}`);
				const savedIdeas = localStorage.getItem(`gift-ideas-${roomId}`);
				if (savedNotes) setNotes(savedNotes);
				if (savedIdeas) setGiftIdeas(JSON.parse(savedIdeas));
			} catch (error) {
				console.error("Error fetching assignment:", error);

				if (error.response?.status === 404) {
					Swal.fire({
						icon: "warning",
						title: "No Assignment Yet",
						text: "You haven't been assigned anyone yet in this room.",
						confirmButtonColor: "#2d5016",
					});
					navigate("/dashboard");
					return;
				}

				if (error.response?.status === 401) {
					navigate("/login");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchAssignmentData();
	}, [authLoading, user, navigate, roomId]);

	const saveNotes = () => {
		localStorage.setItem(`gift-notes-${roomId}`, notes);
		Swal.fire({
			icon: "success",
			title: "Notes Saved!",
			text: "Your gift notes have been saved locally.",
			timer: 1500,
			showConfirmButton: false,
		});
	};

	const addGiftIdea = () => {
		if (!newGiftIdea.trim()) return;

		const updatedIdeas = [
			...giftIdeas,
			{ id: Date.now(), text: newGiftIdea, completed: false },
		];
		setGiftIdeas(updatedIdeas);
		localStorage.setItem(`gift-ideas-${roomId}`, JSON.stringify(updatedIdeas));
		setNewGiftIdea("");
	};

	const toggleGiftIdea = (id) => {
		const updatedIdeas = giftIdeas.map((idea) =>
			idea.id === id ? { ...idea, completed: !idea.completed } : idea
		);
		setGiftIdeas(updatedIdeas);
		localStorage.setItem(`gift-ideas-${roomId}`, JSON.stringify(updatedIdeas));
	};

	const deleteGiftIdea = (id) => {
		const updatedIdeas = giftIdeas.filter((idea) => idea.id !== id);
		setGiftIdeas(updatedIdeas);
		localStorage.setItem(`gift-ideas-${roomId}`, JSON.stringify(updatedIdeas));
	};

	if (authLoading || loading) {
		return (
			<div className='d-flex justify-content-center align-items-center vh-100'>
				<div
					className='spinner-border text-danger'
					role='status'
				>
					<span className='visually-hidden'>Loading...</span>
				</div>
			</div>
		);
	}

	if (!assignmentData || !roomData) {
		return null;
	}

	return (
		<>
			<style>{`
        /* Flex utilities */
        .d-flex { display: flex; }
        .flex-column { flex-direction: column; }
        .flex-grow-1 { flex-grow: 1; }
        .vh-100 { height: 100vh; }
        .w-100 { width: 100%; }

        main.content {
          flex-grow: 1;
          padding: 2rem 3rem;
          margin-top: 56px;
          overflow-y: auto;
          transition: margin-left 0.3s ease;
        }
        main.content.shifted {
          margin-left: 0;
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
        .col-lg-4 { flex: 0 0 calc(33.3333% - 1.33rem); max-width: calc(33.3333% - 1.33rem); }
        .col-lg-8 { flex: 0 0 calc(66.6667% - 0.67rem); max-width: calc(66.6667% - 0.67rem); }

        /* Glass card */
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
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 4px solid ${glassColors.border};
          object-fit: cover;
          margin-bottom: 1rem;
          transition: transform 0.3s ease;
          box-shadow: 0 0 20px 4px rgba(204, 0, 0, 0.6);
        }
        .avatar-img:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px 6px rgba(204, 0, 0, 1);
        }

        /* Buttons */
        .btn-danger, .btn-outline-danger {
          border-radius: 30px;
          padding: 0.6rem 1.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          border: 2px solid ${glassColors.border};
          background-color: transparent;
          color: ${glassColors.text};
          transition: all 0.3s ease;
          user-select: none;
          outline: none;
        }
        .btn-danger {
          background: ${glassColors.text};
          color: #fff;
          border-color: ${glassColors.text};
          box-shadow: 0 0 12px 0 ${glassColors.text};
        }
        .btn-danger:hover:not(:disabled) {
          background: #a30000;
          box-shadow: 0 0 18px 4px #a30000;
          transform: translateY(-2px);
        }
        .btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-outline-danger {
          background: transparent;
          color: ${glassColors.text};
          border-color: ${glassColors.text};
        }
        .btn-outline-danger:hover {
          background: #cc0000;
          color: white;
          box-shadow: 0 0 15px 3px #cc0000;
          border-color: #cc0000;
          transform: translateY(-2px);
        }
        .btn-sm {
          padding: 0.4rem 1rem;
          font-size: 0.85rem;
        }

        /* Inputs */
        .form-control {
          background: transparent;
          border: 1.5px solid ${glassColors.border};
          color: ${glassColors.text};
          border-radius: 12px;
          padding: 0.6rem 1rem;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
          width: 100%;
        }
        .form-control:focus {
          border-color: #cc0000;
          box-shadow: 0 0 10px 3px rgba(204, 0, 0, 0.3);
          background: rgba(204, 0, 0, 0.1);
          color: #fff;
        }
        .form-control::placeholder {
          color: rgba(204, 0, 0, 0.5);
        }
        textarea.form-control {
          min-height: 120px;
          resize: vertical;
        }

        /* Wishlist Items */
        .wishlist-item {
          background: rgba(204, 0, 0, 0.05);
          border: 1px solid rgba(204, 0, 0, 0.3);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 0.8rem;
          transition: all 0.3s ease;
        }
        .wishlist-item:hover {
          background: rgba(204, 0, 0, 0.1);
          transform: translateX(5px);
        }

        /* Gift Ideas List */
        .gift-idea {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem;
          background: rgba(204, 0, 0, 0.05);
          border: 1px solid rgba(204, 0, 0, 0.3);
          border-radius: 8px;
          margin-bottom: 0.6rem;
          transition: all 0.3s ease;
        }
        .gift-idea:hover {
          background: rgba(204, 0, 0, 0.12);
        }
        .gift-idea.completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
        .gift-idea input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #cc0000;
        }

        /* Info Badge */
        .info-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(204, 0, 0, 0.15);
          border-radius: 20px;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        /* Animation */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive */
        @media (max-width: 991px) {
          .col-lg-4, .col-lg-8 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          main.content {
            padding: 1.5rem;
          }
        }
      `}</style>

			<div className='d-flex flex-column vh-100 w-100'>
				<Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

				<div className='d-flex flex-grow-1'>
					<Sidebar
						isOpen={sidebarOpen}
						setSidebarOpen={setSidebarOpen}
					/>

					<main className={`content ${sidebarOpen ? "" : "shifted"}`}>
						<div className='container-fluid'>
							{/* Header */}
							<div style={{ marginBottom: "2rem", textAlign: "center" }}>
								<h2
									style={{
										color: glassColors.text,
										marginBottom: "0.5rem",
										userSelect: "none",
									}}
								>
									🎁 Your Secret Santa Assignment
								</h2>
								<p style={{ color: "#999", fontSize: "1.1rem" }}>
									<strong>{roomData.name}</strong>
								</p>
							</div>

							<div className='row'>
								{/* Left Panel - Assignment Details */}
								<section
									className='col-lg-4 glass-card'
									aria-label='Assignment Information'
								>
									<div style={{ textAlign: "center" }}>
										<img
											src={
												assignmentData.receiverProfilePic ||
												`https://ui-avatars.com/api/?name=${encodeURIComponent(
													assignmentData.receiverName
												)}&background=cc0000&color=fff&size=200`
											}
											alt={`${assignmentData.receiverName} avatar`}
											className='avatar-img'
											draggable={false}
										/>
										<h3
											style={{
												marginBottom: "1rem",
												userSelect: "none",
												fontSize: "1.8rem",
											}}
										>
											{assignmentData.receiverName}
										</h3>
									</div>

									<div style={{ marginTop: "1.5rem" }}>
										<div className='info-badge'>
											<i className='bi bi-currency-dollar'></i>
											<span>
												Budget:{" "}
												<strong>
													$
													{assignmentData.giftBudget ||
														roomData.giftBudget ||
														50}
												</strong>
											</span>
										</div>
										<div className='info-badge'>
											<i className='bi bi-calendar-event'></i>
											<span>
												Draw Date:{" "}
												<strong>
													{new Date(roomData.drawDate).toLocaleDateString()}
												</strong>
											</span>
										</div>
										{assignmentData.receiverEmail && (
											<div className='info-badge'>
												<i className='bi bi-envelope'></i>
												<span style={{ fontSize: "0.85rem" }}>
													{assignmentData.receiverEmail}
												</span>
											</div>
										)}
									</div>

									<hr
										style={{
											borderColor: glassColors.border,
											margin: "1.5rem 0",
										}}
									/>

									{/* Wishlist Section */}
									<div>
										<h4
											style={{
												marginBottom: "1rem",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<i className='bi bi-gift'></i>
											Their Wishlist
										</h4>
										{wishlistItems.length > 0 ? (
											<div>
												{wishlistItems.slice(0, 5).map((item) => (
													<div
														key={item._id}
														className='wishlist-item'
													>
														<div
															style={{
																fontWeight: "600",
																marginBottom: "0.3rem",
															}}
														>
															{item.name}
														</div>
														{item.description && (
															<div
																style={{ fontSize: "0.85rem", color: "#999" }}
															>
																{item.description}
															</div>
														)}
														{item.price && (
															<div
																style={{
																	fontSize: "0.9rem",
																	marginTop: "0.3rem",
																	fontWeight: "600",
																}}
															>
																${item.price}
															</div>
														)}
														{item.link && (
															<a
																href={item.link}
																target='_blank'
																rel='noopener noreferrer'
																style={{
																	fontSize: "0.85rem",
																	color: "#cc0000",
																	textDecoration: "none",
																	display: "inline-flex",
																	alignItems: "center",
																	gap: "0.3rem",
																	marginTop: "0.3rem",
																}}
															>
																<i className='bi bi-link-45deg'></i>
																View Item
															</a>
														)}
													</div>
												))}
											</div>
										) : (
											<p
												style={{
													fontStyle: "italic",
													color: "#999",
													fontSize: "0.95rem",
												}}
											>
												No wishlist items yet. They haven't added any wishes!
											</p>
										)}
									</div>
								</section>

								{/* Right Panel - Gift Planning */}
								<section
									className='col-lg-8 glass-card'
									aria-label='Gift Planning Section'
								>
									{/* Gift Notes */}
									<div style={{ marginBottom: "2rem" }}>
										<h4
											style={{
												marginBottom: "1rem",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<i className='bi bi-journal-text'></i>
											Gift Notes & Ideas
										</h4>
										<textarea
											className='form-control'
											placeholder='Write down gift ideas, notes about what they like, where to buy, etc...'
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											rows={5}
										/>
										<button
											className='btn-danger'
											onClick={saveNotes}
											style={{ marginTop: "1rem" }}
											type='button'
										>
											<i className='bi bi-save me-2'></i>
											Save Notes
										</button>
									</div>

									<hr
										style={{
											borderColor: glassColors.border,
											margin: "2rem 0",
										}}
									/>

									{/* Gift Ideas Checklist */}
									<div>
										<h4
											style={{
												marginBottom: "1rem",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<i className='bi bi-check2-square'></i>
											Gift Ideas Checklist
										</h4>

										<div style={{ marginBottom: "1rem" }}>
											{giftIdeas.map((idea) => (
												<div
													key={idea.id}
													className={`gift-idea ${
														idea.completed ? "completed" : ""
													}`}
												>
													<input
														type='checkbox'
														checked={idea.completed}
														onChange={() => toggleGiftIdea(idea.id)}
													/>
													<span style={{ flex: 1 }}>{idea.text}</span>
													<button
														onClick={() => deleteGiftIdea(idea.id)}
														style={{
															background: "transparent",
															border: "none",
															color: "#cc0000",
															cursor: "pointer",
															fontSize: "1.2rem",
															padding: "0.2rem 0.5rem",
														}}
														aria-label='Delete idea'
													>
														<i className='bi bi-trash'></i>
													</button>
												</div>
											))}
										</div>

										<div
											className='d-flex'
											style={{ gap: "0.8rem" }}
										>
											<input
												type='text'
												className='form-control'
												placeholder='Add new gift idea...'
												value={newGiftIdea}
												onChange={(e) => setNewGiftIdea(e.target.value)}
												onKeyDown={(e) => e.key === "Enter" && addGiftIdea()}
												aria-label='Add new gift idea'
											/>
											<button
												className='btn-danger'
												onClick={addGiftIdea}
												disabled={!newGiftIdea.trim()}
												type='button'
												style={{ whiteSpace: "nowrap" }}
											>
												<i className='bi bi-plus-lg me-1'></i>
												Add
											</button>
										</div>
									</div>

									<hr
										style={{
											borderColor: glassColors.border,
											margin: "2rem 0",
										}}
									/>

									{/* Quick Actions */}
									<div
										style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
									>
										<button
											className='btn-outline-danger'
											onClick={() => navigate(`/group-chat/${roomId}`)}
											type='button'
										>
											<i className='bi bi-chat-dots me-2'></i>
											Go to Room Chat
										</button>
										<button
											className='btn-outline-danger'
											onClick={() => navigate("/dashboard")}
											type='button'
										>
											<i className='bi bi-house-door me-2'></i>
											Back to Dashboard
										</button>
									</div>
								</section>
							</div>
						</div>
					</main>
				</div>
			</div>
		</>
	);
};

export default ChildProfile;
