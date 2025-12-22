import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinWithCodeModal.css";

const JoinWithCodeModal = ({ isOpen, onClose }) => {
	const [inviteCode, setInviteCode] = useState("");
	const navigate = useNavigate();

	const handleClose = React.useCallback(() => {
		setInviteCode("");
		onClose();
	}, [onClose]);

	// Close modal on ESC key
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === "Escape" && isOpen) {
				handleClose();
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
	}, [isOpen, handleClose]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (inviteCode.trim()) {
			// Navigate to join page with the code
			navigate(`/join/${inviteCode.trim().toUpperCase()}`);
			handleClose();
		}
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className='join-code-backdrop'
				onClick={handleClose}
			></div>

			{/* Modal Container */}
			<div className='join-code-modal-container'>
				<div className='join-code-modal-content glass-card'>
					{/* Close Button */}
					<button
						className='join-code-close'
						onClick={handleClose}
					>
						<i className='fas fa-times'></i>
					</button>

					{/* Header with Festive Icon */}
					<div className='join-code-header'>
						<div className='festive-icon-wrapper'>
							<i className='fas fa-gift'></i>
							<div className='sparkles'>
								<i className='fas fa-star'></i>
								<i className='fas fa-star'></i>
								<i className='fas fa-star'></i>
							</div>
						</div>
						<h2 className='join-code-title'>Join with Invite Code</h2>
						<p className='join-code-subtitle'>
							Enter the code you received to join the Secret Santa room
						</p>
					</div>

					{/* Form */}
					<form
						onSubmit={handleSubmit}
						className='join-code-form'
					>
						<div className='code-input-wrapper'>
							<label className='form-label'>
								<i className='fas fa-key me-2'></i>
								Invite Code
							</label>
							<input
								type='text'
								className='form-control glass-input code-input'
								value={inviteCode}
								onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
								placeholder='SANTA-XXXXXXXX'
								autoFocus
								maxLength={15}
							/>
							<small className='text-muted'>
								Format: SANTA-XXXXXXXX (example: SANTA-A1B2C3D4)
							</small>
						</div>

						<div className='join-code-actions'>
							<button
								type='submit'
								className='btn btn-success btn-lg w-100'
								disabled={!inviteCode.trim()}
							>
								<i className='fas fa-sign-in-alt me-2'></i>
								Join Room
							</button>
							<button
								type='button'
								className='btn btn-outline-secondary w-100 mt-2'
								onClick={handleClose}
							>
								<i className='fas fa-times me-2'></i>
								Cancel
							</button>
						</div>
					</form>

					{/* Info Box */}
					<div className='info-box'>
						<i className='fas fa-info-circle me-2'></i>
						<span>
							Don't have a code? Ask the room organizer to invite you!
						</span>
					</div>
				</div>
			</div>
		</>
	);
};

export default JoinWithCodeModal;
