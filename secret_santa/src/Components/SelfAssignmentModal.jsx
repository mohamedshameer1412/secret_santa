import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./SelfAssignmentModal.css";

const SelfAssignmentModal = ({
	isOpen,
	onClose,
	roomId,
	roomData,
	onAssigned,
}) => {
	const [participants, setParticipants] = useState([]);
	const [selectedReceiver, setSelectedReceiver] = useState("");
	const [currentAssignment, setCurrentAssignment] = useState(null);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [takenParticipants, setTakenParticipants] = useState([]);

	const loadParticipants = React.useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const userId = JSON.parse(atob(token.split(".")[1])).id;

			// Get room participants
			const allParticipants = roomData.participants || [];

			// Filter out current user and already taken participants
			const taken = (roomData.pairings || []).map((p) =>
				p.receiver?.toString()
			);
			setTakenParticipants(taken);

			// Check if user already has an assignment
			const userPairing = (roomData.pairings || []).find(
				(p) => p.giver?.toString() === userId
			);

			if (userPairing) {
				const receiver = allParticipants.find(
					(p) => p._id?.toString() === userPairing.receiver?.toString()
				);
				setCurrentAssignment(receiver);
				setSelectedReceiver(userPairing.receiver?.toString());
			}

			setParticipants(allParticipants);
		} catch (error) {
			console.error("Error loading participants:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Failed to load participants",
				confirmButtonColor: "#2d5016",
			});
		} finally {
			setLoading(false);
		}
	}, [roomData]);

	useEffect(() => {
		if (isOpen && roomData) {
			loadParticipants();
		}
	}, [isOpen, roomData, loadParticipants]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!selectedReceiver) {
			Swal.fire({
				icon: "warning",
				title: "No Selection",
				text: "Please select someone to be your Secret Santa recipient",
				confirmButtonColor: "#2d5016",
			});
			return;
		}

		setSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			const response = await axios.post(
				`http://localhost:5000/api/chat/${roomId}/self-assign`,
				{ receiverId: selectedReceiver },
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			await Swal.fire({
				icon: "success",
				title: "Assignment Saved!",
				html: `
                    <p>You've selected <strong>${response.data.assignment.receiverName}</strong> as your Secret Santa recipient!</p>
                    <p class="text-muted mt-2">Remember to keep it a secret! 🤫</p>
                `,
				confirmButtonColor: "#2d5016",
			});

			if (onAssigned) {
				onAssigned();
			}
			onClose();
		} catch (error) {
			console.error("Error saving assignment:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: error.response?.data?.message || "Failed to save assignment",
				confirmButtonColor: "#2d5016",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const isParticipantAvailable = (participantId) => {
		const token = localStorage.getItem("token");
		const userId = JSON.parse(atob(token.split(".")[1])).id;

		// Can't choose yourself
		if (participantId === userId) return false;

		// Can't choose someone already taken (unless it's your current assignment)
		if (
			takenParticipants.includes(participantId) &&
			participantId !== selectedReceiver
		) {
			return false;
		}

		return true;
	};

	if (!isOpen) return null;

	return (
		<>
			<div
				className='modal-backdrop-self'
				onClick={onClose}
			/>
			<div className='self-assignment-modal'>
				<div className='self-assignment-content'>
					<div className='modal-header-self'>
						<div>
							<h2>
								<i className='fas fa-hand-paper me-2'></i>
								Pick Your Secret Santa Recipient
							</h2>
							<p className='text-muted'>Choose who you'd like to gift to</p>
						</div>
						<button
							className='btn-close-self'
							onClick={onClose}
						>
							<i className='fas fa-times'></i>
						</button>
					</div>

					{loading ? (
						<div className='loading-section'>
							<i className='fas fa-spinner fa-spin fa-2x'></i>
							<p>Loading participants...</p>
						</div>
					) : (
						<form onSubmit={handleSubmit}>
							<div className='modal-body-self'>
								{currentAssignment && (
									<div className='current-assignment-notice'>
										<i className='fas fa-info-circle me-2'></i>
										<span>
											Current assignment:{" "}
											<strong>{currentAssignment.username}</strong> (You can
											change it below)
										</span>
									</div>
								)}

								<div className='participants-grid'>
									{participants.map((participant) => {
										const available = isParticipantAvailable(
											participant._id?.toString()
										);
										const isCurrent =
											selectedReceiver === participant._id?.toString();

										return (
											<div
												key={participant._id}
												className={`participant-card ${
													!available ? "disabled" : ""
												} ${isCurrent ? "selected" : ""}`}
												onClick={() =>
													available &&
													setSelectedReceiver(participant._id?.toString())
												}
											>
												<input
													type='radio'
													name='receiver'
													value={participant._id}
													checked={isCurrent}
													onChange={() =>
														available &&
														setSelectedReceiver(participant._id?.toString())
													}
													disabled={!available}
													style={{ display: "none" }}
												/>

												<div className='participant-avatar'>
													{participant.profilePic ? (
														<img
															src={participant.profilePic}
															alt={participant.username}
														/>
													) : (
														<div className='avatar-placeholder'>
															<i className='fas fa-user'></i>
														</div>
													)}
												</div>

												<div className='participant-info'>
													<h4>{participant.username || participant.name}</h4>
													{!available &&
														participant._id !==
															JSON.parse(
																atob(
																	localStorage.getItem("token").split(".")[1]
																)
															).id && (
															<span className='badge bg-warning text-dark'>
																Already Chosen
															</span>
														)}
													{participant._id ===
														JSON.parse(
															atob(localStorage.getItem("token").split(".")[1])
														).id && (
														<span className='badge bg-secondary'>You</span>
													)}
												</div>

												{isCurrent && (
													<div className='selected-indicator'>
														<i className='fas fa-check-circle'></i>
													</div>
												)}
											</div>
										);
									})}
								</div>

								{participants.length === 0 && (
									<div className='empty-state'>
										<i className='fas fa-users fs-1 text-muted mb-3'></i>
										<p>No participants available</p>
									</div>
								)}
							</div>

							<div className='modal-footer-self'>
								<button
									type='button'
									className='btn btn-secondary'
									onClick={onClose}
									disabled={submitting}
								>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-success'
									disabled={!selectedReceiver || submitting}
								>
									{submitting ? (
										<>
											<i className='fas fa-spinner fa-spin me-2'></i>
											Saving...
										</>
									) : (
										<>
											<i className='fas fa-check me-2'></i>
											Confirm Selection
										</>
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</>
	);
};

export default SelfAssignmentModal;
