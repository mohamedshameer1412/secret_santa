import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./RoomSettingsModal.css";
import InviteModal from "./InviteModal";
import { useAuth } from "../context/useAuth";

const RoomSettingsModal = ({ isOpen, onClose, roomId }) => {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = useState("general");
	const [isSaving, setIsSaving] = useState(false);
	const [loading, setLoading] = useState(true);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [participants, setParticipants] = useState([]);
	const [isOrganizer, setIsOrganizer] = useState(false);
	const [drawing, setDrawing] = useState(false);
	const [roomStatus, setRoomStatus] = useState("waiting");

	const [roomData, setRoomData] = useState({
		name: "",
		description: "",
		maxParticipants: 10,
		drawDate: "",
		giftBudget: 50,
		isPrivate: false,
		allowWishlist: true,
		allowChat: true,
		allowAnyoneInvite: false,
		theme: "christmas",
		anonymousMode: true,
		organizer: null,
	});

	useEffect(() => {
		if (isOpen) {
			setActiveTab("general");
		}
	}, [isOpen]);

	useEffect(() => {
		const fetchRoomData = async () => {
			if (!isOpen || !roomId) {
				return;
			}

			setLoading(true);
			try {
				const token = localStorage.getItem("token");
				const response = await axios.get(
					`http://localhost:5000/api/chat/${roomId}`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				// Backend returns {success: true, room: {...}}
				const room = response.data.room || response.data;
				// Backend now returns organizer._id as string
				const organizerId = room.organizer?._id || room.organizer;
				const userId = user?.id || user?._id;
				const userIsOrganizer = organizerId === userId;

				setIsOrganizer(userIsOrganizer);
				setParticipants(room.participants || []);
				setRoomStatus(room.status || "waiting");

				setRoomData({
					name: room.name || "",
					description: room.description || "",
					maxParticipants: room.maxParticipants || 10,
					drawDate: room.drawDate ? room.drawDate.split("T")[0] : "",
					giftBudget: room.giftBudget || 50,
					isPrivate: room.isPrivate || false,
					allowWishlist: room.allowWishlist !== false,
					allowChat: room.allowChat !== false,
					allowAnyoneInvite: room.allowAnyoneInvite || false,
					theme: room.theme || "christmas",
					anonymousMode: room.anonymousMode !== false,
					organizer: room.organizer,
				});
			} catch (error) {
				alert(
					"Failed to load room settings: " +
						(error.response?.data?.message || error.message)
				);
			} finally {
				setLoading(false);
			}
		};

		fetchRoomData();
	}, [isOpen, roomId, user]);

	// Close modal on ESC key
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setRoomData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleToggleAnonymous = async () => {
		if (!isOrganizer) {
			alert("Only the organizer can toggle anonymous mode");
			return;
		}

		try {
			const token = localStorage.getItem("token");
			await axios.patch(
				`http://localhost:5000/api/chat/${roomId}/anonymous-mode`,
				{ anonymousMode: !roomData.anonymousMode },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setRoomData((prev) => ({ ...prev, anonymousMode: !prev.anonymousMode }));
			alert(
				`Anonymous mode ${
					!roomData.anonymousMode ? "enabled" : "disabled"
				} successfully!`
			);
		} catch (error) {
			alert(error.response?.data?.message || "Failed to toggle anonymous mode");
		}
	};

	const handleDrawNames = async () => {
		if (!isOrganizer) {
			Swal.fire({
				icon: "error",
				title: "Access Denied",
				text: "Only the organizer can draw names",
				confirmButtonColor: "#cc0000",
			});
			return;
		}

		if (participants.length < 3) {
			Swal.fire({
				icon: "warning",
				title: "Not Enough Participants",
				text: "You need at least 3 participants to draw names",
				confirmButtonColor: "#cc0000",
			});
			return;
		}

		// Confirm action
		const result = await Swal.fire({
			title: "Draw Secret Santa Names?",
			text: `This will randomly assign Secret Santa pairs for ${participants.length} participants.`,
			icon: "question",
			showCancelButton: true,
			confirmButtonColor: "#2d5016",
			cancelButtonColor: "#6c757d",
			confirmButtonText: '<i class="fas fa-magic"></i> Draw Names',
			cancelButtonText: "Cancel",
		});

		if (!result.isConfirmed) return;

		setDrawing(true);
		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`http://localhost:5000/api/chat/${roomId}/draw-names`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			setRoomStatus("drawn");

			Swal.fire({
				icon: "success",
				title: "Names Drawn!",
				html: `
          <div style="text-align: center;">
            <i class="fas fa-gifts fa-3x" style="color: #cc0000; margin: 1rem 0;"></i>
            <p style="font-size: 1.1rem; margin-top: 1rem;">
              Secret Santa pairings have been created for ${response.data.participantCount} participants!
            </p>
            <p style="color: #666; margin-top: 0.5rem;">
              Each participant can now view their assignment.
            </p>
          </div>
        `,
				confirmButtonColor: "#2d5016",
				confirmButtonText: "Perfect!",
			});
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Draw Failed",
				text:
					error.response?.data?.message ||
					"Could not draw names. Please try again.",
				confirmButtonColor: "#cc0000",
			});
		} finally {
			setDrawing(false);
		}
	};

	const handleSaveSettings = async () => {
		if (!roomId) {
			alert("No room selected");
			return;
		}

		setIsSaving(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(
				`http://localhost:5000/api/chat/${roomId}/settings`,
				roomData,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			alert("Room settings updated successfully!");
			onClose();
		} catch (error) {
			alert(error.response?.data?.error || "Failed to update room settings");
		} finally {
			setIsSaving(false);
		}
	};

	const handleResetAssignments = async () => {
		const result = await Swal.fire({
			title: "Reset All Assignments?",
			text: "This will clear all Secret Santa pairings. Participants can be reassigned later.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#cc0000",
			cancelButtonColor: "#6c757d",
			confirmButtonText: "Yes, Reset",
			cancelButtonText: "Cancel",
		});

		if (!result.isConfirmed) return;

		try {
			const token = localStorage.getItem("token");
			await axios.post(
				`http://localhost:5000/api/chat/${roomId}/reset-assignments`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			Swal.fire({
				icon: "success",
				title: "Assignments Reset",
				text: "All Secret Santa assignments have been cleared.",
				confirmButtonColor: "#2d5016",
			});

			setRoomStatus("waiting");
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Reset Failed",
				text: error.response?.data?.message || "Failed to reset assignments",
				confirmButtonColor: "#cc0000",
			});
		}
	};

	const handleDeleteRoom = async () => {
		// Close modal first so it doesn't block the confirmation dialog
		onClose();

		const result = await Swal.fire({
			title: "Delete This Room?",
			text: "This action cannot be undone! All messages, assignments, and room data will be permanently deleted.",
			icon: "error",
			showCancelButton: true,
			confirmButtonColor: "#cc0000",
			cancelButtonColor: "#6c757d",
			confirmButtonText: "Yes, Delete Forever",
			cancelButtonText: "Cancel",
			input: "text",
			inputPlaceholder: 'Type "DELETE" to confirm',
			inputValidator: (value) => {
				if (value !== "DELETE") {
					return 'You must type "DELETE" to confirm';
				}
			},
		});

		if (!result.isConfirmed) return;

		try {
			const token = localStorage.getItem("token");
			await axios.delete(`http://localhost:5000/api/chat/${roomId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			// Show success message
			await Swal.fire({
				icon: "success",
				title: "Room Deleted",
				text: "The room has been permanently deleted.",
				confirmButtonColor: "#2d5016",
			});

			// Stay on current page - detect if we're on dashboard or group-chat
			const currentPath = window.location.pathname;
			if (currentPath.includes("/dashboard")) {
				window.location.href = "/dashboard";
			} else {
				window.location.href = "/group-chat";
			}
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "Delete Failed",
				text: error.response?.data?.message || "Failed to delete room",
				confirmButtonColor: "#cc0000",
			});
		}
	};

	const handleClose = () => {
		setActiveTab("general");
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop with blur */}
			<div
				className='room-settings-modal-backdrop'
				onClick={handleClose}
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: "rgba(0, 0, 0, 0.85)",
					zIndex: 9998,
					visibility: "visible",
					display: "block",
				}}
			></div>

			{/* Modal Container */}
			<div
				className='room-settings-modal-container'
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 9999,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					padding: "2rem",
					visibility: "visible",
				}}
			>
				<div
					className='room-settings-modal-content'
					style={{
						background: "rgba(15, 25, 35, 0.98)",
						border: "2px solid rgba(255, 215, 0, 0.2)",
						borderRadius: "24px",
						maxWidth: "950px",
						width: "100%",
						maxHeight: "92vh",
						display: "flex",
						flexDirection: "column",
						position: "relative",
						overflow: "hidden",
						visibility: "visible",
					}}
				>
					{/* Close Button */}
					<button
						className='room-settings-modal-close'
						onClick={handleClose}
					>
						<i className='fas fa-times'></i>
					</button>

					{/* ✅ Loading State */}
					{loading ? (
						<div className='text-center py-5'>
							<div
								className='spinner-border text-light'
								role='status'
							>
								<span className='visually-hidden'>Loading...</span>
							</div>
							<p className='text-white mt-3'>Loading room settings...</p>
						</div>
					) : (
						<>
							{/* Modal Header */}
							<div
								className='modal-header-section'
								style={{
									visibility: "visible",
									background: "rgba(0,255,0,0.1)",
									padding: "20px",
									color: "#fff",
								}}
							>
								<h2
									className='modal-title'
									style={{
										color: "#FFD700",
										fontSize: "2rem",
										fontWeight: "bold",
									}}
								>
									<i className='fas fa-cog me-3'></i>Room Settings
								</h2>
								<p
									className='modal-subtitle'
									style={{ color: "#fff", fontSize: "1rem" }}
								>
									{roomData.name ||
										"Configure your Secret Santa room preferences"}
								</p>
							</div>

							{/* Tabs Navigation */}
							<div
								className='tabs-navigation'
								style={{
									display: "flex",
									visibility: "visible",
									padding: "10px",
									gap: "10px",
									flexWrap: "wrap",
								}}
							>
								<button
									className={`tab-btn ${
										activeTab === "general" ? "active" : ""
									}`}
									onClick={() => setActiveTab("general")}
									style={{
										background: "#FFD700",
										color: "#000",
										padding: "10px 20px",
										border: "none",
										borderRadius: "5px",
										cursor: "pointer",
										fontWeight: "bold",
									}}
								>
									<i className='fas fa-info-circle me-2'></i>General
								</button>
								<button
									className={`tab-btn ${
										activeTab === "participants" ? "active" : ""
									}`}
									onClick={() => setActiveTab("participants")}
									style={{
										background: "#FFD700",
										color: "#000",
										padding: "10px 20px",
										border: "none",
										borderRadius: "5px",
										cursor: "pointer",
										fontWeight: "bold",
									}}
								>
									<i className='fas fa-users me-2'></i>Participants
								</button>
								{isOrganizer && (
									<button
										className={`tab-btn ${
											activeTab === "management" ? "active" : ""
										}`}
										onClick={() => setActiveTab("management")}
										style={{
											background: "#FFD700",
											color: "#000",
											padding: "10px 20px",
											border: "none",
											borderRadius: "5px",
											cursor: "pointer",
											fontWeight: "bold",
										}}
									>
										<i className='fas fa-crown me-2'></i>Management
									</button>
								)}
								<button
									className={`tab-btn ${activeTab === "rules" ? "active" : ""}`}
									onClick={() => setActiveTab("rules")}
									style={{
										background: "#FFD700",
										color: "#000",
										padding: "10px 20px",
										border: "none",
										borderRadius: "5px",
										cursor: "pointer",
										fontWeight: "bold",
									}}
								>
									<i className='fas fa-gavel me-2'></i>Rules
								</button>
								<button
									className={`tab-btn ${
										activeTab === "advanced" ? "active" : ""
									}`}
									onClick={() => setActiveTab("advanced")}
									style={{
										background: "#FFD700",
										color: "#000",
										padding: "10px 20px",
										border: "none",
										borderRadius: "5px",
										cursor: "pointer",
										fontWeight: "bold",
									}}
								>
									<i className='fas fa-sliders-h me-2'></i>Advanced
								</button>
							</div>

							{/* Tab Content */}
							<div
								className='tab-content'
								style={{
									padding: "20px",
									background: "#1a1a2e",
								}}
							>
								{/* General Tab */}
								{activeTab === "general" && (
									<div
										className='tab-pane'
										style={{
											display: "block",
											visibility: "visible",
											opacity: 1,
										}}
									>
										<div
											className='glass-card'
											style={{
												background: "rgba(255,255,255,0.1)",
												padding: "20px",
												borderRadius: "10px",
												border: "2px solid #FFD700",
											}}
										>
											<h5
												className='section-title'
												style={{
													color: "#FFD700",
													fontSize: "1.5rem",
													marginBottom: "20px",
												}}
											>
												<i className='fas fa-info-circle me-2'></i>Basic
												Information
											</h5>

											<div className='form-group mb-3'>
												<label
													className='form-label'
													style={{
														color: "#fff",
														display: "block",
														marginBottom: "10px",
														fontSize: "1rem",
													}}
												>
													Room Name
												</label>
												<input
													type='text'
													name='name'
													className='form-control glass-input'
													value={roomData.name}
													onChange={handleInputChange}
													placeholder='e.g., Office Secret Santa 2024'
												/>
											</div>

											<div className='form-group mb-3'>
												<label className='form-label'>Description</label>
												<textarea
													name='description'
													className='form-control glass-input'
													rows='3'
													value={roomData.description}
													onChange={handleInputChange}
													placeholder='Tell participants about this Secret Santa event...'
												/>
											</div>

											<div className='row'>
												<div className='col-md-6'>
													<div className='form-group mb-3'>
														<label className='form-label'>Draw Date</label>
														<input
															type='date'
															name='drawDate'
															className='form-control glass-input'
															value={roomData.drawDate}
															onChange={handleInputChange}
														/>
													</div>
												</div>

												<div className='col-md-6'>
													<div className='form-group mb-3'>
														<label className='form-label'>
															Gift Budget ($)
														</label>
														<input
															type='number'
															name='giftBudget'
															className='form-control glass-input'
															value={roomData.giftBudget}
															onChange={handleInputChange}
															min='0'
														/>
													</div>
												</div>
											</div>

											<div className='form-group mb-3'>
												<label
													className='form-label'
													style={{
														color: "#fff",
														display: "block",
														marginBottom: "10px",
													}}
												>
													Theme
												</label>
												<select
													name='theme'
													className='form-control glass-input'
													value={roomData.theme}
													onChange={handleInputChange}
													style={{
														background: "rgba(255,255,255,0.1)",
														color: "#fff",
														border: "1px solid rgba(255,215,0,0.3)",
														padding: "10px",
														borderRadius: "8px",
													}}
												>
													<option
														value='christmas'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														🎄 Christmas
													</option>
													<option
														value='winter'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														❄️ Winter Wonderland
													</option>
													<option
														value='festive'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														🎉 Festive
													</option>
													<option
														value='elegant'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														✨ Elegant
													</option>
												</select>
											</div>
										</div>
									</div>
								)}

								{/* Participants Tab */}
								{activeTab === "participants" && (
									<div
										className='tab-pane'
										style={{
											display: "block",
											visibility: "visible",
											opacity: 1,
										}}
									>
										<div
											className='glass-card'
											style={{
												background: "rgba(255,255,255,0.1)",
												padding: "20px",
												borderRadius: "10px",
												border: "2px solid #FFD700",
											}}
										>
											<h5
												className='section-title'
												style={{
													color: "#FFD700",
													fontSize: "1.5rem",
													marginBottom: "20px",
												}}
											>
												<i className='fas fa-users me-2'></i>Participant
												Settings
											</h5>

											<div className='form-group mb-3'>
												<label className='form-label'>
													Maximum Participants
												</label>
												<input
													type='number'
													name='maxParticipants'
													className='form-control glass-input'
													value={roomData.maxParticipants}
													onChange={handleInputChange}
													min='3'
													max='100'
												/>
												<small className='text-muted'>
													Minimum 3 participants required
												</small>
											</div>

											<div className='form-check form-switch mb-3'>
												<input
													className='form-check-input'
													type='checkbox'
													name='isPrivate'
													id='isPrivate'
													checked={roomData.isPrivate}
													onChange={handleInputChange}
													disabled={!isOrganizer}
												/>
												<label
													className='form-check-label'
													htmlFor='isPrivate'
												>
													Private Room (Invite only)
												</label>
											</div>

											<div className='participant-list'>
												<div className='d-flex justify-content-between align-items-center mb-3'>
													<h6 className='mb-0'>
														Current Participants ({participants.length}/
														{roomData.maxParticipants})
													</h6>
													{(isOrganizer || roomData.allowAnyoneInvite) && (
														<button
															className='btn btn-invite btn-sm'
															onClick={() => setIsInviteModalOpen(true)}
														>
															<i className='fas fa-user-plus me-2'></i>Invite
														</button>
													)}
												</div>

												{participants.length === 0 ? (
													<div className='empty-state'>
														<i className='fas fa-user-plus fa-3x mb-3 text-muted'></i>
														<p className='text-muted'>
															No participants yet. Share the room link to invite
															people!
														</p>
														{(isOrganizer || roomData.allowAnyoneInvite) && (
															<button
																className='btn btn-invite mt-2'
																onClick={() => setIsInviteModalOpen(true)}
															>
																<i className='fas fa-link me-2'></i>Get Invite
																Link
															</button>
														)}
													</div>
												) : (
													<div className='participants-grid'>
														{participants.map((participant, index) => (
															<div
																key={participant._id || index}
																className='participant-card'
															>
																<img
																	src={
																		participant.profilePic ||
																		"/assets/santa-show.png"
																	}
																	alt={participant.username || participant.name}
																	className='participant-avatar'
																/>
																<div className='participant-info'>
																	<div className='participant-name'>
																		{participant.username || participant.name}
																		{participant._id ===
																			roomData.organizer?._id && (
                                                                                <span className="badge-organizer">
                                                                                    <span className="crown-icon">👑</span>

                                                                                    <span className="organizer-text-wrapper">
                                                                                        <span className="organizer-text">
                                                                                            Organizer
                                                                                        </span>
                                                                                    </span>
                                                                                </span>
																		)}
																	</div>
																	<div className='participant-email'>
																		{participant.email}
																	</div>
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									</div>
								)}

								{/* Management Tab - Organizer Only */}
								{activeTab === "management" && isOrganizer && (
									<div
										className='tab-pane'
										style={{
											display: "block",
											visibility: "visible",
											opacity: 1,
										}}
									>
										<div
											className='glass-card'
											style={{
												background: "rgba(255,255,255,0.1)",
												padding: "20px",
												borderRadius: "10px",
												border: "2px solid #FFD700",
											}}
										>
											<h5
												className='section-title'
												style={{
													color: "#FFD700",
													fontSize: "1.5rem",
													marginBottom: "20px",
												}}
											>
												<i className='fas fa-crown me-2'></i>Organizer Controls
											</h5>
											<p className='text-muted mb-4'>
												Manage your Secret Santa event and draw names
											</p>

											{/* Draw Names Section */}
											<div className='draw-section mb-4'>
												<div className='draw-card'>
													<div className='draw-header'>
														<i className='fas fa-magic'></i>
														<h6>Secret Santa Draw</h6>
													</div>

													<div className='draw-info'>
														<div className='info-item'>
															<i className='fas fa-users'></i>
															<span>
																<strong>{participants.length}</strong>{" "}
																Participants
															</span>
														</div>
														<div className='info-item'>
															<i
																className='fas fa-check-circle'
																style={{
																	color:
																		roomStatus === "drawn"
																			? "#2d5016"
																			: "#ffd700",
																}}
															></i>
															<span>
																Status:{" "}
																<strong>
																	{roomStatus === "drawn" ? "Drawn" : "Waiting"}
																</strong>
															</span>
														</div>
													</div>

													{roomStatus !== "drawn" ? (
														<div>
															<p className='draw-description'>
																Ready to assign Secret Santa pairs? This will
																randomly match each participant with someone to
																gift to.
															</p>
															<button
																className='btn-draw-names'
																onClick={handleDrawNames}
																disabled={drawing || participants.length < 3}
															>
																{drawing ? (
																	<>
																		<i className='fas fa-spinner fa-spin me-2'></i>
																		Drawing Names...
																	</>
																) : (
																	<>
																		<i className='fas fa-magic me-2'></i>
																		Draw Secret Santa Names
																	</>
																)}
															</button>
															{participants.length < 3 && (
																<small className='text-warning d-block mt-2'>
																	<i className='fas fa-exclamation-triangle me-1'></i>
																	Need at least 3 participants
																</small>
															)}
														</div>
													) : (
														<div className='draw-success'>
															<i className='fas fa-check-circle'></i>
															<p>
																Names have been drawn! Participants can now view
																their assignments.
															</p>
														</div>
													)}
												</div>
											</div>

											{/* Room Details Section */}
											<div className='management-section mb-4'>
												<h6 className='mb-3'>
													<i className='fas fa-info-circle me-2'></i>Room
													Details
												</h6>
												<div className='detail-grid'>
													<div className='detail-card'>
														<i className='fas fa-calendar-alt'></i>
														<div>
															<small>Exchange Date</small>
															<p>
																{roomData.drawDate
																	? new Date(
																			roomData.drawDate
																	  ).toLocaleDateString()
																	: "Not set"}
															</p>
														</div>
													</div>
													<div className='detail-card'>
														<i className='fas fa-coins'></i>
														<div>
															<small>Gift Budget</small>
															<p>${roomData.giftBudget}</p>
														</div>
													</div>
													<div className='detail-card'>
														<i className='fas fa-palette'></i>
														<div>
															<small>Theme</small>
															<p className='text-capitalize'>
																{roomData.theme}
															</p>
														</div>
													</div>
													<div className='detail-card'>
														<i className='fas fa-lock'></i>
														<div>
															<small>Privacy</small>
															<p>{roomData.isPrivate ? "Private" : "Public"}</p>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Rules Tab */}
								{activeTab === "rules" && (
									<div
										className='tab-pane'
										style={{
											display: "block",
											visibility: "visible",
											opacity: 1,
										}}
									>
										<div
											className='glass-card'
											style={{
												background: "rgba(255,255,255,0.1)",
												padding: "20px",
												borderRadius: "10px",
												border: "2px solid #FFD700",
											}}
										>
											<h5
												className='section-title'
												style={{
													color: "#FFD700",
													fontSize: "1.5rem",
													marginBottom: "20px",
												}}
											>
												<i className='fas fa-gavel me-2'></i>Room Rules &
												Privacy
											</h5>

											{/* Anonymous Mode Toggle - Organizer Only */}
											<div className='anonymous-toggle-section mb-4'>
												<div className='d-flex justify-content-between align-items-center mb-2'>
													<div>
														<strong className='text-white d-block mb-1'>
															<i className='fas fa-user-secret me-2'></i>
															Anonymous Mode
														</strong>
														<small className='text-white'>
															Hide real identities in chat{" "}
															{!isOrganizer && "(Organizer only)"}
														</small>
													</div>
													<div className='form-check form-switch'>
														<input
															className='form-check-input form-check-input-lg'
															type='checkbox'
															id='anonymousMode'
															checked={roomData.anonymousMode}
															onChange={handleToggleAnonymous}
															disabled={!isOrganizer}
															style={{
																cursor: isOrganizer ? "pointer" : "not-allowed",
															}}
														/>
													</div>
												</div>
												{roomData.anonymousMode && (
													<div className='alert alert-info glass-alert-info'>
														<i className='fas fa-info-circle me-2'></i>
														Participants will see anonymous names instead of
														real identities in the chat.
													</div>
												)}
											</div>

											<div className='form-check form-switch mb-3'>
												<input
													className='form-check-input'
													type='checkbox'
													name='allowWishlist'
													id='allowWishlist'
													checked={roomData.allowWishlist}
													onChange={handleInputChange}
													disabled={!isOrganizer}
												/>
												<label
													className='form-check-label'
													htmlFor='allowWishlist'
												>
													Allow Wishlist Creation
												</label>
											</div>

											<div className='form-check form-switch mb-3'>
												<input
													className='form-check-input'
													type='checkbox'
													name='allowChat'
													id='allowChat'
													checked={roomData.allowChat}
													onChange={handleInputChange}
													disabled={!isOrganizer}
												/>
												<label
													className='form-check-label'
													htmlFor='allowChat'
												>
													Enable Group Chat
												</label>
											</div>

											{/* Invite Permissions Section */}
											<div className='invite-permissions-section mb-4'>
												<div className='d-flex justify-content-between align-items-center mb-2'>
													<div>
														<strong className='text-white d-block mb-1'>
															<i className='fas fa-link me-2'></i>Invite Link
															Permissions
														</strong>
														<small className='text-white'>
															{isOrganizer
																? "Control who can generate invite links"
																: "Current invite permissions"}
														</small>
													</div>
													<div className='form-check form-switch'>
														<input
															className='form-check-input form-check-input-lg'
															type='checkbox'
															id='allowAnyoneInvite'
															name='allowAnyoneInvite'
															checked={roomData.allowAnyoneInvite}
															onChange={handleInputChange}
															disabled={!isOrganizer}
															style={{
																cursor: isOrganizer ? "pointer" : "not-allowed",
															}}
														/>
														<label
															className='form-check-label'
															htmlFor='allowAnyoneInvite'
														>
															{roomData.allowAnyoneInvite
																? "Anyone can invite"
																: "Organizer only"}
														</label>
													</div>
												</div>
												{roomData.allowAnyoneInvite ? (
													<div className='alert alert-info glass-alert-info'>
														<i className='fas fa-info-circle me-2'></i>
														All participants can generate and share invite links
														to add new members.
													</div>
												) : (
													<div
														className='alert alert-warning glass-alert-info'
														style={{
															background: "rgba(255, 193, 7, 0.2)",
															borderColor: "rgba(255, 193, 7, 0.5)",
														}}
													>
														<i className='fas fa-lock me-2'></i>
														Only the organizer can generate invite links for
														this room.
													</div>
												)}
											</div>

											<div className='rules-info'>
												<h6 className='text-white mb-3'>Default Rules:</h6>
												<ul className='rules-list'>
													<li>
														<i className='fas fa-check text-success me-2'></i>
														Keep your Secret Santa identity secret
													</li>
													<li>
														<i className='fas fa-check text-success me-2'></i>
														Respect the gift budget limit
													</li>
													<li>
														<i className='fas fa-check text-success me-2'></i>
														Deliver gifts by the specified deadline
													</li>
													<li>
														<i className='fas fa-check text-success me-2'></i>Be
														thoughtful and considerate
													</li>
												</ul>
											</div>
										</div>
									</div>
								)}

								{/* Advanced Tab */}
								{activeTab === "advanced" && (
									<div
										className='tab-pane'
										style={{
											display: "block",
											visibility: "visible",
											opacity: 1,
										}}
									>
										<div
											className='glass-card'
											style={{
												background: "rgba(255,255,255,0.1)",
												padding: "20px",
												borderRadius: "10px",
												border: "2px solid #FFD700",
											}}
										>
											<h5
												className='section-title'
												style={{
													color: "#FFD700",
													fontSize: "1.5rem",
													marginBottom: "20px",
												}}
											>
												<i className='fas fa-sliders-h me-2'></i>Advanced
												Settings
											</h5>

											<div className='alert alert-warning'>
												<i className='fas fa-exclamation-triangle me-2'></i>
												<strong>Warning:</strong> Changing these settings may
												affect the draw results.
											</div>

											<div className='form-group mb-3'>
												<label className='form-label'>Re-draw Algorithm</label>
												<select
													className='form-control glass-input'
													style={{
														background: "rgba(255,255,255,0.1)",
														color: "#fff",
														border: "1px solid rgba(255,215,0,0.3)",
														padding: "10px",
														borderRadius: "8px",
													}}
												>
													<option
														value='random'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														Random Assignment
													</option>
													<option
														value='balanced'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														Balanced (No repeats from last year)
													</option>
													<option
														value='fair'
														style={{ background: "#1a1a2e", color: "#fff" }}
													>
														Fair Distribution
													</option>
												</select>
											</div>

											<div className='danger-zone'>
												<h6 className='text-danger mb-3'>
													<i className='fas fa-exclamation-circle me-2'></i>
													Danger Zone
												</h6>
												<button
													className='btn btn-danger w-100 mb-2'
													onClick={handleResetAssignments}
												>
													<i className='fas fa-redo me-2'></i>Reset All
													Assignments
												</button>
												<button
													className='btn btn-danger w-100'
													onClick={handleDeleteRoom}
												>
													<i className='fas fa-trash me-2'></i>Delete Room
												</button>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Footer Actions */}
							<div className='modal-footer-actions'>
								<button
									className='btn btn-cancel'
									onClick={handleClose}
								>
									<i className='fas fa-times me-2'></i>Cancel
								</button>
								<button
									className='btn btn-save'
									onClick={handleSaveSettings}
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<span className='spinner-border spinner-border-sm me-2'></span>
											Saving...
										</>
									) : (
										<>
											<i className='fas fa-save me-2'></i>Save Settings
										</>
									)}
								</button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Invite Modal */}
			<InviteModal
				isOpen={isInviteModalOpen}
				onClose={() => setIsInviteModalOpen(false)}
				roomId={roomId}
				roomName={roomData.name}
			/>
		</>
	);
};

export default RoomSettingsModal;
