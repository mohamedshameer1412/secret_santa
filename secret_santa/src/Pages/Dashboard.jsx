import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import Swal from "sweetalert2";

const API_URL = "http://localhost:5000/api/chat";

const Dashboard = () => {
	const { user, loading: authLoading } = useAuth();
	const navigate = useNavigate();

	const [rooms, setRooms] = useState([]);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [revealingRoom, setRevealingRoom] = useState(null);

	// Fetch user's Secret Santa rooms on mount
	useEffect(() => {
		const fetchRooms = async () => {
			if (authLoading) return;

			if (!user) {
				navigate("/login");
				return;
			}

			try {
				const token = localStorage.getItem("token");
				const res = await axios.get(`${API_URL}/my-rooms`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				// Filter only Secret Santa rooms
				const secretSantaRooms = res.data.rooms.filter(
					(room) => room.roomType === "secret-santa"
				);

				setRooms(secretSantaRooms);
			} catch (error) {
				console.error("Error fetching rooms:", error);
				if (error.response?.status === 401) {
					navigate("/login");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchRooms();
	}, [authLoading, user, navigate]);

	const handleRevealAssignment = async (roomId) => {
		try {
			setRevealingRoom(roomId);
			const token = localStorage.getItem("token");

			// First, trigger the draw if room uses auto-roll
			const room = rooms.find((r) => r._id === roomId);
			if (room.assignmentStrategy === "auto-roll" && room.status !== "drawn") {
				await axios.post(
					`${API_URL}/${roomId}/draw-names`,
					{},
					{ headers: { Authorization: `Bearer ${token}` } }
				);
			}

			// Get the assignment
			const res = await axios.get(`${API_URL}/${roomId}/my-assignment`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			const assignment = res.data.assignment;

			// Show assignment with festive animation
			await Swal.fire({
				title: "🎁 Your Secret Santa Assignment!",
				html: `
          <div style="text-align: center;">
            <img 
              src="${
								assignment.receiverProfilePic || "/assets/default-avatar.png"
							}" 
              alt="${assignment.receiverName}"
              style="width: 100px; height: 100px; border-radius: 50%; margin: 20px auto; border: 4px solid #2d5016;"
            />
            <h3 style="color: #2d5016; margin: 15px 0;">${
							assignment.receiverName
						}</h3>
            <p style="font-size: 1.1rem; color: #666;">
              You are the Secret Santa for <strong>${
								assignment.receiverName
							}</strong>!
            </p>
            <p style="color: #888; margin-top: 10px;">
              Gift Budget: <strong>$${assignment.giftBudget}</strong>
            </p>
          </div>
        `,
				icon: "success",
				confirmButtonText: "Got it!",
				confirmButtonColor: "#2d5016",
				allowOutsideClick: false,
			});

			// Refresh rooms to update status
			const updatedRes = await axios.get(`${API_URL}/my-rooms`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const secretSantaRooms = updatedRes.data.rooms.filter(
				(room) => room.roomType === "secret-santa"
			);
			setRooms(secretSantaRooms);
		} catch (error) {
			console.error("Error revealing assignment:", error);

			Swal.fire({
				icon: "error",
				title: "Oops!",
				text:
					error.response?.data?.message ||
					"Failed to reveal assignment. Please try again.",
				confirmButtonColor: "#2d5016",
			});
		} finally {
			setRevealingRoom(null);
		}
	};

	const getAssignmentStatusBadge = (room) => {
		if (room.status === "drawn") {
			return <span className='badge bg-success'>✓ Drawn</span>;
		}

		if (room.assignmentStrategy === "auto-roll") {
			if (!room.drawDate) {
				return <span className='badge bg-secondary'>No Draw Date</span>;
			}

			const now = new Date();
			const drawDate = new Date(room.drawDate);

			if (now >= drawDate) {
				return <span className='badge bg-primary'>🎲 Ready to Reveal</span>;
			} else {
				return (
					<span className='badge bg-warning text-dark'>
						⏳ Waiting for {drawDate.toLocaleDateString()}
					</span>
				);
			}
		} else if (room.assignmentStrategy === "manual") {
			return (
				<span className='badge bg-info text-dark'>👤 Manual Assignment</span>
			);
		} else if (room.assignmentStrategy === "self-assign") {
			return (
				<span className='badge bg-purple text-white'>✋ Self-Assignment</span>
			);
		}

		return <span className='badge bg-secondary'>Waiting</span>;
	};

	const canReveal = (room) => {
		if (room.status === "drawn") return true;

		if (room.assignmentStrategy === "auto-roll") {
			if (!room.drawDate) return false;
			const now = new Date();
			const drawDate = new Date(room.drawDate);
			return now >= drawDate;
		}

		return false;
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

	return (
		<div className='d-flex flex-column w-100 vh-100'>
			<Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
			<Sidebar
				isOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>

			<main
				className={`content ${
					sidebarOpen ? "" : "shifted"
				} py-4 px-3 px-md-5 mt-5`}
				style={{ minHeight: "calc(100vh - 56px)" }}
			>
				<div className='text-center mb-4'>
					<h1 className='fw-bold text-danger mb-2'>
						🎄 Secret Santa Dashboard
					</h1>
					<p className='text-muted fs-5'>
						View your Secret Santa rooms and reveal your assignments
					</p>
				</div>

				{/* Stats Cards */}
				{rooms.length > 0 && (
					<div className='row g-3 mb-4'>
						<div className='col-6 col-md-3'>
							<div
								className='card border-0 shadow-lg'
								style={{
									background:
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
								}}
							>
								<div className='card-body text-white text-center'>
									<i className='bi bi-gift-fill fs-1 mb-2'></i>
									<h3 className='mb-0 fw-bold'>{rooms.length}</h3>
									<small className='fw-semibold'>Total Rooms</small>
								</div>
							</div>
						</div>
						<div className='col-6 col-md-3'>
							<div
								className='card border-0 shadow-lg'
								style={{
									background:
										"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
								}}
							>
								<div className='card-body text-white text-center'>
									<i className='bi bi-check-circle-fill fs-1 mb-2'></i>
									<h3 className='mb-0 fw-bold'>
										{rooms.filter((r) => r.status === "drawn").length}
									</h3>
									<small className='fw-semibold'>Drawn Rooms</small>
								</div>
							</div>
						</div>
						<div className='col-6 col-md-3'>
							<div
								className='card border-0 shadow-lg'
								style={{
									background:
										"linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
								}}
							>
								<div className='card-body text-white text-center'>
									<i className='bi bi-hourglass-split fs-1 mb-2'></i>
									<h3 className='mb-0 fw-bold'>
										{rooms.filter((r) => r.status !== "drawn").length}
									</h3>
									<small className='fw-semibold'>Pending</small>
								</div>
							</div>
						</div>
						<div className='col-6 col-md-3'>
							<div
								className='card border-0 shadow-lg'
								style={{
									background:
										"linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
								}}
							>
								<div className='card-body text-white text-center'>
									<i className='bi bi-dice-5-fill fs-1 mb-2'></i>
									<h3 className='mb-0 fw-bold'>
										{
											rooms.filter(
												(r) =>
													r.assignmentStrategy === "auto-roll" &&
													canReveal(r) &&
													r.status !== "drawn"
											).length
										}
									</h3>
									<small className='fw-semibold'>Ready to Roll</small>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Roll Button for Auto-Roll Rooms */}
				{rooms.filter(
					(r) =>
						r.assignmentStrategy === "auto-roll" &&
						canReveal(r) &&
						r.status !== "drawn"
				).length > 0 && (
					<div
						className='alert alert-success shadow-sm border-0 mb-4'
						style={{ borderLeft: "4px solid #28a745" }}
					>
						<div className='d-flex align-items-center justify-content-between flex-wrap gap-3'>
							<div>
								<h5 className='mb-1'>
									<i className='bi bi-dice-5-fill me-2'></i>
									Ready to Roll!
								</h5>
								<p className='mb-0 text-muted'>
									The following rooms are ready for automatic assignment:
									{rooms
										.filter(
											(r) =>
												r.assignmentStrategy === "auto-roll" &&
												canReveal(r) &&
												r.status !== "drawn"
										)
										.map((room, idx, arr) => (
											<span key={room._id}>
												<strong className='text-success'>{room.name}</strong>
												{idx < arr.length - 1 ? ", " : ""}
											</span>
										))}
								</p>
							</div>
							<button
								className='btn btn-success btn-lg'
								onClick={() => {
									const readyRoom = rooms.find(
										(r) =>
											r.assignmentStrategy === "auto-roll" &&
											canReveal(r) &&
											r.status !== "drawn"
									);
									if (readyRoom) handleRevealAssignment(readyRoom._id);
								}}
								disabled={revealingRoom !== null}
							>
								{revealingRoom !== null ? (
									<>
										<span className='spinner-border spinner-border-sm me-2'></span>
										Rolling...
									</>
								) : (
									<>
										<i className='bi bi-dice-5-fill me-2'></i>
										Roll & Reveal
									</>
								)}
							</button>
						</div>
					</div>
				)}

				{rooms.length === 0 ? (
					<div className='text-center py-5'>
						<i className='bi bi-gift fs-1 text-muted mb-3'></i>
						<p className='text-muted fs-5'>
							You haven't joined any Secret Santa rooms yet.
						</p>
						<p className='text-muted'>
							Create a room or join one using an invite code!
						</p>
					</div>
				) : (
					<div className='row g-4'>
						{rooms.map((room) => (
							<div
								key={room._id}
								className='col-12 col-md-6 col-lg-4'
							>
								<div
									className='card h-100 shadow-sm border-0'
									style={{
										borderLeft: "4px solid #2d5016",
										transition: "transform 0.2s",
									}}
								>
									<div className='card-body'>
										<div className='d-flex justify-content-between align-items-start mb-3'>
											<h5 className='card-title mb-0 fw-bold'>{room.name}</h5>
											{getAssignmentStatusBadge(room)}
										</div>

										{room.description && (
											<p className='card-text text-muted small mb-3'>
												{room.description.length > 100
													? room.description.substring(0, 100) + "..."
													: room.description}
											</p>
										)}

										<div className='mb-3'>
											<div className='d-flex align-items-center mb-2'>
												<i className='bi bi-people-fill me-2 text-success'></i>
												<small className='text-muted'>
													{room.participants?.length || 0} participants
												</small>
											</div>

											{room.drawDate && (
												<div className='d-flex align-items-center mb-2'>
													<i className='bi bi-calendar-event me-2 text-primary'></i>
													<small className='text-muted'>
														Draw Date:{" "}
														{new Date(room.drawDate).toLocaleDateString()}
													</small>
												</div>
											)}

											{room.giftBudget && (
												<div className='d-flex align-items-center mb-2'>
													<i className='bi bi-currency-dollar me-2 text-warning'></i>
													<small className='text-muted'>
														Budget: ${room.giftBudget}
													</small>
												</div>
											)}

											<div className='d-flex align-items-center'>
												<i className='bi bi-gear-fill me-2 text-info'></i>
												<small className='text-muted text-capitalize'>
													{room.assignmentStrategy?.replace("-", " ")} Mode
												</small>
											</div>
										</div>

										<div className='d-flex gap-2 flex-wrap'>
											<button
												className='btn btn-sm btn-outline-success flex-grow-1'
												onClick={() => navigate(`/group-chat/${room._id}`)}
											>
												<i className='bi bi-chat-dots me-1'></i>
												Open Chat
											</button>

											{room.status === "drawn" && (
												<button
													className='btn btn-sm btn-outline-primary flex-grow-1'
													onClick={() => navigate(`/child-profile/${room._id}`)}
												>
													<i className='bi bi-person-heart me-1'></i>
													View Details
												</button>
											)}

											{canReveal(room) && room.status !== "drawn" && (
												<button
													className='btn btn-sm btn-success'
													onClick={() => handleRevealAssignment(room._id)}
													disabled={revealingRoom === room._id}
												>
													{revealingRoom === room._id ? (
														<span
															className='spinner-border spinner-border-sm'
															role='status'
														></span>
													) : (
														<>
															<i className='bi bi-gift me-1'></i>
															Reveal
														</>
													)}
												</button>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</main>
		</div>
	);
};

export default Dashboard;
