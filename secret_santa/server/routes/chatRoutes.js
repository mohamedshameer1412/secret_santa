const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const multer = require("multer");
const path = require("path");
const {
	uploadToGridFS,
	getFileStream,
	deleteFromGridFS,
} = require("../utils/gridFsStorage");
const crypto = require("crypto");

// Configure multer for memory storage (GridFS)
const storage = multer.memoryStorage();

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|webm/;
		const extname = allowedTypes.test(
			path.extname(file.originalname).toLowerCase()
		);
		const mimetype = allowedTypes.test(file.mimetype);
		if (extname && mimetype) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Allowed: images, videos, documents"));
		}
	},
});

// Helper function to encrypt file metadata
const encryptFileMetadata = (text, key) => {
	const algorithm = "aes-256-cbc";
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, "hex"), iv);
	let encrypted = cipher.update(text, "utf8", "hex");
	encrypted += cipher.final("hex");

	const hmac = crypto.createHmac("sha256", Buffer.from(key, "hex"));
	hmac.update(encrypted + iv.toString("hex"));
	const tag = hmac.digest("hex");

	return {
		encrypted: encrypted,
		iv: iv.toString("hex"),
		tag: tag,
	};
};

// Anonymous name pool
const anonymousNamePool = [
	"Batman",
	"Kingster",
	"Shadow",
	"Phoenix",
	"Mystic",
	"Ranger",
	"Thunder",
	"Storm",
	"Ninja",
	"Ghost",
	"Falcon",
	"Wolf",
	"Viper",
	"Eagle",
	"Tiger",
	"Dragon",
	"Phantom",
	"Raven",
	"Hawk",
	"Cobra",
];

function generateAnonymousName(room, userId) {
	// Initialize anonymousNames Map if it doesn't exist
	if (!room.anonymousNames) {
		room.anonymousNames = new Map();
	}

	// Check if user already has an anonymous name in this room
	if (room.anonymousNames.has(userId.toString())) {
		return room.anonymousNames.get(userId.toString());
	}

	// If no custom name set, assign a default anonymous name as fallback
	const usedNames = Array.from(room.anonymousNames.values());
	const availableNames = anonymousNamePool.filter(
		(name) => !usedNames.includes(name)
	);

	let newName;
	if (availableNames.length === 0) {
		// Fallback to numbered anonymous names
		newName = `Anonymous${room.anonymousNames.size + 1}`;
	} else {
		newName = availableNames[Math.floor(Math.random() * availableNames.length)];
	}

	room.anonymousNames.set(userId.toString(), newName);
	return newName;
}

// @route   POST /api/chat/create-room
// @desc    Create a new chat room (generic)
// @access  Private
router.post(
	"/create-room",
	protect,
	asyncHandler(async (req, res) => {
		const { name } = req.body;

		const room = await ChatRoom.createRoom(
			name || "New Chat Room",
			req.user.id
		);

		res.json({
			success: true,
			room,
		});
	})
);

// @route   POST /api/chat/create
// @desc    Create a Secret Santa room (with additional settings)
// @access  Private
router.post(
	"/create",
	protect,
	asyncHandler(async (req, res) => {
		const {
			roomName,
			name,
			description,
			maxParticipants,
			drawDate,
			giftBudget,
			theme,
			isPrivate,
			allowWishlist,
			allowChat,
			anonymousMode,
		} = req.body;
		const adminId = req.user.id;

		// Support both 'roomName' and 'name' for backward compatibility
		const finalName = name || roomName;

		// Validation
		if (!finalName || finalName.trim().length === 0) {
			throw new AppError("Room name is required", 400);
		}

		// Create room with admin as first participant
		const room = await ChatRoom.createRoom(
			{
				name: finalName.trim(),
				description: description?.trim(),
				roomType: "secret-santa",
				maxParticipants: maxParticipants || 20,
				drawDate,
				giftBudget: giftBudget || 50,
				theme: theme || "christmas",
				isPrivate: isPrivate || false,
				allowWishlist: allowWishlist !== false, // Default true
				allowChat: allowChat !== false, // Default true
				anonymousMode: anonymousMode !== false, // Default true
			},
			adminId
		);

		res.status(201).json({
			success: true,
			message: "Room created successfully",
			room: {
				_id: room._id,
				name: room.name,
				description: room.description,
				organizer: room.organizer,
				participants: room.participants,
				maxParticipants: room.maxParticipants,
				drawDate: room.drawDate,
				giftBudget: room.giftBudget,
				theme: room.theme,
				inviteCode: room.inviteCode,
				createdAt: room.createdAt,
			},
		});
	})
);

// @route   GET /api/chat/my-rooms
// @desc    Get all rooms for current user
// @access  Private
router.get(
	"/my-rooms",
	protect,
	asyncHandler(async (req, res) => {
		const userId = req.user.id;

		const rooms = await ChatRoom.find({
			participants: userId,
		})
			.populate("organizer", "username profilePic email")
			.select(
				"name description organizer participants maxParticipants theme drawDate status roomType anonymousMode messages createdAt"
			)
			.sort({ createdAt: -1 });

		// Get last message for each room
		const roomsWithMetadata = await Promise.all(
			rooms.map(async (room) => {
				// Get the most recent message for this room
				let lastMessage = null;
				if (room.messages && room.messages.length > 0) {
					try {
						const lastMsg = await Message.findById(
							room.messages[room.messages.length - 1]
						)
							.populate("sender", "username name")
							.select("sender encryptedText iv tag createdAt isDeleted");

						if (lastMsg) {
							lastMessage = {
								text: lastMsg.isDeleted
									? "Message deleted"
									: Message.decryptText(
											lastMsg.encryptedText,
											lastMsg.iv,
											lastMsg.tag
									  ).substring(0, 50),
								sender:
									lastMsg.sender?.name || lastMsg.sender?.username || "Unknown",
								createdAt: lastMsg.createdAt,
							};
						}
					} catch (err) {
						console.error("Error fetching last message:", err);
					}
				}

				return {
					_id: room._id,
					name: room.name,
					description: room.description,
					organizer: room.organizer,
					participantCount: room.participants.length,
					maxParticipants: room.maxParticipants,
					theme: room.theme,
					drawDate: room.drawDate,
					status: room.status,
					roomType: room.roomType,
					anonymousMode: room.anonymousMode,
					messageCount: room.messages ? room.messages.length : 0,
					createdAt: room.createdAt,
					isAdmin: room.organizer._id.toString() === userId,
					lastMessage,
				};
			})
		);

		res.json({
			success: true,
			rooms: roomsWithMetadata,
		});
	})
);

// @route   GET /api/chat/:roomId
// @desc    Get specific room by ID
// @access  Private
router.get(
	"/:roomId",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.getRoomWithDetails(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is participant
		const isParticipant = room.participants.some(
			(p) => p._id.toString() === userId
		);
		if (!isParticipant) {
			throw new AppError("You do not have access to this room", 403);
		}

		res.json({
			success: true,
			room: {
				_id: room._id,
				name: room.name,
				description: room.description,
				organizer: {
					_id: room.organizer._id.toString(),
					username: room.organizer.username,
					email: room.organizer.email,
					profilePic: room.organizer.profilePic,
				},
				participants: room.participants,
				maxParticipants: room.maxParticipants,
				drawDate: room.drawDate,
				giftBudget: room.giftBudget,
				theme: room.theme,
				status: room.status,
				roomType: room.roomType,
				isPrivate: room.isPrivate,
				allowWishlist: room.allowWishlist,
				allowChat: room.allowChat,
				allowAnyoneInvite: room.allowAnyoneInvite,
				anonymousMode: room.anonymousMode,
				inviteCode: room.inviteCode,
				pairings: room.pairings,
				chatRoom: room.chatRoom,
				createdAt: room.createdAt,
				updatedAt: room.updatedAt,
				isAdmin: room.organizer._id.toString() === userId,
			},
		});
	})
);

// @route   GET /api/chat/:roomId/messages
// @desc    Get all messages from a chat room (decrypts before sending)
// @access  Private
router.get(
	"/:roomId/messages",
	protect,
	asyncHandler(async (req, res) => {
		const room = await ChatRoom.findById(req.params.roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		const isParticipant = room.participants.some(
			(p) => p.toString() === req.user.id
		);

		if (!isParticipant) {
			throw new AppError("You are not a participant in this room", 403);
		}

		const messages = await Message.find({ roomId: req.params.roomId })
			.populate("sender", "name username profilePic")
			.sort({ createdAt: 1 })
			.lean();

		// Decrypt all messages (with HMAC verification)
		const decryptedMessages = messages.map((msg) => {
			try {
				const decrypted = {
					...msg,
					text: Message.decryptText(msg.encryptedText, msg.iv, msg.tag),
				};

				// Use stored anonymous name if available, otherwise generate (for old messages)
				if (msg.anonymousName) {
					decrypted.anonymousName = msg.anonymousName;
				} else if (room.anonymousNames) {
					decrypted.anonymousName =
						room.anonymousNames.get(msg.sender._id.toString()) || "Anonymous";
				}

				// Override sender profilePic with stored avatar if available
				// IMPORTANT: Create a new sender object to avoid reference issues with .lean()
				if (msg.senderAvatar && decrypted.sender) {
					decrypted.sender = {
						...decrypted.sender,
						profilePic: msg.senderAvatar,
					};
				}

				// Decrypt attachment if exists
				if (msg.attachment) {
					try {
						// Decrypt filename using its own IV and tag
						const decryptedFileName = Message.decryptText(
							msg.attachment.encryptedFileName,
							msg.attachment.ivFileName,
							msg.attachment.tagFileName
						);

						decrypted.attachment = {
							fileType: msg.attachment.fileType,
							size: msg.attachment.size,
							url: `/api/chat/file/${msg._id}`,
							originalName: decryptedFileName,
							fileName: decryptedFileName,
						};
					} catch (attachError) {
						console.error(
							"Failed to decrypt attachment:",
							msg._id,
							attachError.message
						);
						// Include attachment but mark as undecryptable
						decrypted.attachment = {
							fileType: msg.attachment.fileType,
							size: msg.attachment.size,
							url: `/api/chat/file/${msg._id}`,
							originalName: "[Encrypted File]",
							fileName: "[Encrypted File]",
						};
					}
				}

				// Map reactions with anonymous names
				if (msg.reactions && msg.reactions.length > 0) {
					decrypted.reactions = msg.reactions.map((r) => ({
						emoji: r.emoji,
						anonymousName: r.anonymousName,
						isCurrentUser: r.userId.toString() === req.user.id,
					}));
				}

				return decrypted;
			} catch (error) {
				console.error("Failed to decrypt message:", msg._id, error.message);
				return {
					...msg,
					text: "[Message could not be decrypted]",
					anonymousName: "Anonymous",
				};
			}
		});

		res.json({
			success: true,
			messages: decryptedMessages,
		});
	})
);

// @route   POST /api/chat/:roomId/message
// @desc    Send a message to a chat room (encrypts before saving)
// @access  Private
// @note    Stores anonymousName and senderAvatar at message creation time to ensure
//          they remain consistent even if user updates their profile or changes rooms.
//          This provides a historical snapshot of the sender's identity at send time.
router.post(
	"/:roomId/message",
	protect,
	asyncHandler(async (req, res) => {
		const { text, currentAvatar } = req.body;

		if (!text || !text.trim()) {
			throw new AppError("Message text is required", 400);
		}

		const room = await ChatRoom.findById(req.params.roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is participant
		const isParticipant = room.participants.some(
			(p) => p.toString() === req.user.id
		);

		if (!isParticipant) {
			throw new AppError("You are not a participant in this room", 403);
		}

		// Encrypt message with HMAC
		const { encryptedText, iv, tag } = Message.encryptText(text.trim());

		// Get or generate anonymous name for this user in this room
		const anonymousName = generateAnonymousName(room, req.user.id);

		// Use the avatar passed from frontend (the one currently displayed)
		// This allows for random/changing avatars while still persisting what was shown when sent
		const avatarToStore = currentAvatar || "/assets/santa2.png";

		const message = await Message.create({
			roomId: req.params.roomId,
			sender: req.user.id,
			encryptedText,
			iv,
			tag, // Store HMAC tag
			anonymousName: room.anonymousMode ? anonymousName : null,
			senderAvatar: avatarToStore, // Store the avatar that was displayed when sending
		});

		// Populate sender info
		const populatedMessage = await Message.findById(message._id)
			.populate("sender", "name username profilePic")
			.lean();

		// Decrypt for response (with HMAC verification)
		populatedMessage.text = Message.decryptText(
			populatedMessage.encryptedText,
			populatedMessage.iv,
			populatedMessage.tag
		);

		// Use stored avatar instead of current profile pic
		// Create new sender object to avoid reference issues
		if (populatedMessage.senderAvatar && populatedMessage.sender) {
			populatedMessage.sender = {
				...populatedMessage.sender,
				profilePic: populatedMessage.senderAvatar,
			};
		}

		// Use stored anonymous name if in anonymous mode
		if (populatedMessage.anonymousName) {
			populatedMessage.anonymousName = populatedMessage.anonymousName;
		}

		res.json({
			success: true,
			message: populatedMessage,
		});
	})
);

// @route   POST /api/chat/private-room
// @desc    Get or create a private chat room between two users
// @access  Private
router.post(
	"/private-room",
	protect,
	asyncHandler(async (req, res) => {
		const { otherUserId } = req.body;

		if (!otherUserId) {
			throw new AppError("Other user ID is required", 400);
		}

		// Check if a private room already exists between these two users
		// Sort user IDs to ensure consistent room lookup
		const userIds = [req.user.id, otherUserId].sort();

		let room = await ChatRoom.findOne({
			isPrivate: true,
			participants: { $all: userIds, $size: 2 },
		});

		// If no room exists, create one
		if (!room) {
			const otherUser = await User.findById(otherUserId);

			if (!otherUser) {
				throw new AppError("User not found", 404);
			}

			room = await ChatRoom.create({
				name: `Private Chat`,
				participants: userIds,
				organizer: req.user.id,
				anonymousMode: false,
				isPrivate: true,
			});
		}

		res.json({
			success: true,
			roomId: room._id,
		});
	})
);

// @route   PUT /api/chat/:roomId/anonymous
// @desc    Toggle anonymous mode for a chat room (only organizer)
// @access  Private
router.put(
	"/:roomId/anonymous",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const { anonymousMode } = req.body;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Only organizer can toggle
		if (!room.organizer.equals(req.user.id)) {
			throw new AppError("Only organizer can toggle anonymous mode", 403);
		}

		room.anonymousMode = anonymousMode;
		await room.save();

		res.json({
			success: true,
			anonymousMode: room.anonymousMode,
		});
	})
);

// @route   PUT /api/chat/:roomId/anonymous-name
// @desc    Set custom anonymous name for a user in a room
// @access  Private
router.put(
	"/:roomId/anonymous-name",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const { anonymousName } = req.body;

		if (!anonymousName) {
			throw new AppError("Anonymous name is required", 400);
		}

		// Use authenticated user's ID instead of from request body
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Initialize anonymousNames Map if it doesn't exist
		if (!room.anonymousNames) {
			room.anonymousNames = new Map();
		}

		// Check if the name is already taken by another user
		const existingUser = Array.from(room.anonymousNames.entries()).find(
			([key, value]) => value === anonymousName && key !== userId.toString()
		);

		if (existingUser) {
			throw new AppError("This anonymous name is already taken", 400);
		}

		// Set the custom anonymous name
		room.anonymousNames.set(userId.toString(), anonymousName);
		await room.save();

		res.json({
			success: true,
			message: `Anonymous name set to "${anonymousName}"`,
			anonymousName,
		});
	})
);

// @route   GET /api/chat/:roomId/anonymous-names
// @desc    Get list of available anonymous names and current user's name
// @access  Private
router.get(
	"/:roomId/anonymous-names",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		const usedNames = room.anonymousNames
			? Array.from(room.anonymousNames.values())
			: [];
		const currentUserName = room.anonymousNames
			? room.anonymousNames.get(userId.toString())
			: null;
		const availablePresets = anonymousNamePool.filter(
			(name) => !usedNames.includes(name)
		);

		res.json({
			success: true,
			currentAnonymousName: currentUserName,
			usedNames,
			availablePresets,
			anonymousMode: room.anonymousMode,
		});
	})
);

// @route   PUT /api/chat/:roomId/message/:messageId
// @desc    Edit a message
// @access  Private
router.put(
	"/:roomId/message/:messageId",
	protect,
	asyncHandler(async (req, res) => {
		const { messageId } = req.params;
		const { text } = req.body;

		if (!text || !text.trim()) {
			throw new AppError("Message text is required", 400);
		}

		const message = await Message.findById(messageId);

		if (!message) {
			throw new AppError("Message not found", 404);
		}

		// Check if user is the sender
		if (message.sender.toString() !== req.user.id) {
			throw new AppError("You can only edit your own messages", 403);
		}

		// Check if message is deleted
		if (message.isDeleted) {
			throw new AppError("Cannot edit deleted message", 400);
		}

		// Save current version to edit history
		message.editHistory.push({
			encryptedText: message.encryptedText,
			iv: message.iv,
			tag: message.tag,
			editedAt: new Date(),
		});

		// Encrypt new message
		const { encryptedText, iv, tag } = Message.encryptText(text.trim());
		message.encryptedText = encryptedText;
		message.iv = iv;
		message.tag = tag;
		message.isEdited = true;

		await message.save();

		// Populate and decrypt for response
		const populatedMessage = await Message.findById(message._id)
			.populate("sender", "name username profilePic")
			.lean();

		populatedMessage.text = Message.decryptText(
			populatedMessage.encryptedText,
			populatedMessage.iv,
			populatedMessage.tag
		);

		// Use stored avatar and anonymous name (preserve original values)
		// Create new sender object to avoid reference issues
		if (populatedMessage.senderAvatar && populatedMessage.sender) {
			populatedMessage.sender = {
				...populatedMessage.sender,
				profilePic: populatedMessage.senderAvatar,
			};
		}

		res.json({
			success: true,
			message: populatedMessage,
		});
	})
);

// @route   DELETE /api/chat/:roomId/message/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete(
	"/:roomId/message/:messageId",
	protect,
	asyncHandler(async (req, res) => {
		const { messageId } = req.params;

		const message = await Message.findById(messageId);

		if (!message) {
			throw new AppError("Message not found", 404);
		}

		// Check if user is the sender
		if (message.sender.toString() !== req.user.id) {
			throw new AppError("You can only delete your own messages", 403);
		}

		// Soft delete
		const deletedMsg = Message.encryptText("[Message deleted]");
		message.isDeleted = true;
		message.deletedAt = new Date();
		message.encryptedText = deletedMsg.encryptedText;
		message.iv = deletedMsg.iv;
		message.tag = deletedMsg.tag;

		await message.save();

		res.json({
			success: true,
			message: "Message deleted successfully",
		});
	})
);

// @route   POST /api/chat/:roomId/upload
// @desc    Upload file/image with message
// @access  Private
router.post(
	"/:roomId/upload",
	protect,
	upload.single("file"),
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;

		if (!req.file) {
			throw new AppError("No file uploaded", 400);
		}

		const room = await ChatRoom.findById(roomId);
		if (!room) {
			throw new AppError("Chat room not found", 404);
		}

		// Auto-join user to room if not already a participant
		const validParticipants = (room.participants || []).filter(
			(p) => p != null
		);
		const isMember = validParticipants.some(
			(p) => p.toString() === req.user.id.toString()
		);

		if (!isMember) {
			room.participants.push(req.user.id);
			await room.save();
		}

		// Upload file to GridFS
		const fileBuffer = req.file.buffer;
		const originalName = req.file.originalname;
		const mimeType = req.file.mimetype;

		const gridFsFile = await uploadToGridFS(fileBuffer, originalName, {
			originalName,
			mimeType,
			size: req.file.size,
			uploadedBy: req.user.id,
			roomId: roomId,
		});

		// Use Message encryption (same global keys) for file metadata
		const encryptedFileName = Message.encryptText(originalName);
		const fileIdString = gridFsFile.fileId.toString();
		const encryptedFileId = Message.encryptText(fileIdString);

		// Generate anonymous name if not already set
		const anonymousName = generateAnonymousName(room, req.user.id);

		// Use the avatar from form data (the one currently displayed on frontend)
		const avatarToStore = req.body.currentAvatar || "/assets/santa2.png";

		// Encrypt empty message text for file-only messages
		const emptyMessage = Message.encryptText("");

		// Create message with encrypted file reference
		const message = new Message({
			roomId: roomId,
			sender: req.user.id,
			encryptedText: emptyMessage.encryptedText,
			iv: emptyMessage.iv,
			tag: emptyMessage.tag,
			anonymousName: room.anonymousMode ? anonymousName : null,
			senderAvatar: avatarToStore, // Store the avatar displayed when uploading
			attachment: {
				encryptedFileId: encryptedFileId.encryptedText,
				encryptedFileName: encryptedFileName.encryptedText,
				ivFileId: encryptedFileId.iv,
				ivFileName: encryptedFileName.iv,
				tagFileId: encryptedFileId.tag,
				tagFileName: encryptedFileName.tag,
				fileType: mimeType.startsWith("image/") ? "image" : "file",
				size: req.file.size,
			},
		});

		await message.save();
		await room.save();

		res.status(201).json({
			success: true,
			message: message,
		});
	})
);

// @route   GET /api/chat/file/:messageId
// @desc    Serve uploaded files (with authentication)
// @access  Private
router.get(
	"/file/:messageId",
	protect,
	asyncHandler(async (req, res) => {
		const { messageId } = req.params;

		// Find the message containing this file
		const message = await Message.findById(messageId);

		if (!message || !message.attachment) {
			throw new AppError("File not found", 404);
		}

		// Verify user is participant in room
		const room = await ChatRoom.findById(message.roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		const isParticipant = room.participants.some(
			(p) => p.toString() === req.user.id
		);

		if (!isParticipant) {
			throw new AppError("You are not authorized to access this file", 403);
		}

		// Decrypt file ID using Message.decryptText
		const decryptedFileId = Message.decryptText(
			message.attachment.encryptedFileId,
			message.attachment.ivFileId,
			message.attachment.tagFileId
		);

		// Decrypt filename for Content-Disposition header
		const decryptedFileName = Message.decryptText(
			message.attachment.encryptedFileName,
			message.attachment.ivFileName,
			message.attachment.tagFileName
		);

		// Stream file from GridFS
		const fileStream = getFileStream(decryptedFileId);

		fileStream.on("error", (err) => {
			console.error("GridFS stream error:", err);
			if (!res.headersSent) {
				res
					.status(500)
					.json({ success: false, message: "Error retrieving file" });
			}
		});

		// Set appropriate headers
		res.setHeader(
			"Content-Type",
			message.attachment.fileType || "application/octet-stream"
		);
		res.setHeader(
			"Content-Disposition",
			`inline; filename="${decryptedFileName}"`
		);

		fileStream.pipe(res);
	})
);

// @route   POST /api/chat/:roomId/message/:messageId/reaction
// @desc    Add reaction to message
// @access  Private
router.post(
	"/:roomId/message/:messageId/reaction",
	protect,
	asyncHandler(async (req, res) => {
		const { messageId, roomId } = req.params;
		const { emoji } = req.body;

		if (!emoji) {
			throw new AppError("Emoji is required", 400);
		}

		const message = await Message.findById(messageId);

		if (!message) {
			throw new AppError("Message not found", 404);
		}

		// Get room for anonymous name
		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Get or generate anonymous name
		let anonymousName = room.anonymousNames.get(req.user.id.toString());
		if (!anonymousName) {
			const usedNames = Array.from(room.anonymousNames.values());
			const availableNames = anonymousNamePool.filter(
				(name) => !usedNames.includes(name)
			);
			anonymousName =
				availableNames.length > 0
					? availableNames[Math.floor(Math.random() * availableNames.length)]
					: `Anonymous${room.anonymousNames.size + 1}`;
			room.anonymousNames.set(req.user.id.toString(), anonymousName);
			await room.save();
		}

		// Check if user already reacted with this emoji
		const existingReaction = message.reactions.find(
			(r) => r.userId.toString() === req.user.id && r.emoji === emoji
		);

		if (existingReaction) {
			// Remove reaction (toggle)
			message.reactions = message.reactions.filter(
				(r) => !(r.userId.toString() === req.user.id && r.emoji === emoji)
			);
		} else {
			// Add reaction
			message.reactions.push({
				emoji,
				userId: req.user.id,
				anonymousName,
				createdAt: new Date(),
			});
		}

		await message.save();

		res.json({
			success: true,
			reactions: message.reactions.map((r) => ({
				emoji: r.emoji,
				anonymousName: r.anonymousName,
				isCurrentUser: r.userId.toString() === req.user.id,
			})),
		});
	})
);

// ======================== ROOM MANAGEMENT ROUTES ========================

// @route   PUT /api/chat/:roomId/settings
// @desc    Update room settings (admin only)
// @access  Private
router.put(
	"/:roomId/settings",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;
		const {
			name,
			description,
			maxParticipants,
			drawDate,
			giftBudget,
			theme,
			isPrivate,
			allowWishlist,
			allowChat,
			allowAnyoneInvite,
			anonymousMode,
		} = req.body;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is admin
		if (room.organizer.toString() !== userId) {
			throw new AppError("Only room admin can update settings", 403);
		}

		// Update fields
		if (name) room.name = name.trim();
		if (description !== undefined) room.description = description?.trim();
		if (maxParticipants !== undefined) {
			// Ensure maxParticipants is not less than current participants
			if (maxParticipants < room.participants.length) {
				throw new AppError(
					`Cannot set max participants below current participant count (${room.participants.length})`,
					400
				);
			}
			room.maxParticipants = maxParticipants;
		}
		if (drawDate !== undefined) room.drawDate = drawDate;
		if (giftBudget !== undefined) room.giftBudget = giftBudget;
		if (theme) room.theme = theme;
		if (isPrivate !== undefined) room.isPrivate = isPrivate;
		if (allowWishlist !== undefined) room.allowWishlist = allowWishlist;
		if (allowChat !== undefined) room.allowChat = allowChat;
		if (allowAnyoneInvite !== undefined)
			room.allowAnyoneInvite = allowAnyoneInvite;
		if (anonymousMode !== undefined) room.anonymousMode = anonymousMode;

		await room.save();

		res.json({
			success: true,
			message: "Room settings updated successfully",
			room: {
				_id: room._id,
				name: room.name,
				description: room.description,
				maxParticipants: room.maxParticipants,
				drawDate: room.drawDate,
				giftBudget: room.giftBudget,
				theme: room.theme,
				isPrivate: room.isPrivate,
				allowWishlist: room.allowWishlist,
				allowChat: room.allowChat,
				allowAnyoneInvite: room.allowAnyoneInvite,
				anonymousMode: room.anonymousMode,
				updatedAt: room.updatedAt,
			},
		});
	})
);

// @route   DELETE /api/chat/:roomId
// @desc    Delete room (admin only)
// @access  Private
router.delete(
	"/:roomId",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is admin
		if (room.organizer.toString() !== userId) {
			throw new AppError("Only room admin can delete the room", 403);
		}

		await ChatRoom.findByIdAndDelete(roomId);

		res.json({
			success: true,
			message: "Room deleted successfully",
		});
	})
);

// @route   PATCH /api/chat/:roomId/anonymous-mode
// @desc    Toggle anonymous mode (organizer only)
// @access  Private
router.patch(
	"/:roomId/anonymous-mode",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const { anonymousMode } = req.body;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is organizer
		if (room.organizer.toString() !== userId) {
			throw new AppError(
				"Only the room organizer can toggle anonymous mode",
				403
			);
		}

		room.anonymousMode = anonymousMode;
		await room.save();

		res.json({
			success: true,
			message: `Anonymous mode ${
				anonymousMode ? "enabled" : "disabled"
			} successfully`,
			anonymousMode: room.anonymousMode,
		});
	})
);

// @route   GET /api/chat/:roomId/invite-code
// @desc    Get or generate invite code for a room
// @access  Private
router.get(
	"/:roomId/invite-code",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is participant
		const isParticipant = room.participants.some(
			(p) => p.toString() === userId
		);
		if (!isParticipant) {
			throw new AppError(
				"You must be a participant to get the invite code",
				403
			);
		}

		// Check permissions: organizer or allowAnyoneInvite enabled
		const isOrganizer = room.organizer.toString() === userId;
		if (!isOrganizer && !room.allowAnyoneInvite) {
			throw new AppError(
				"Only the organizer can generate invite links for this room",
				403
			);
		}

		// If no invite code exists, generate one
		if (!room.inviteCode) {
			const crypto = require("crypto");
			room.inviteCode = `SANTA-${crypto
				.randomBytes(4)
				.toString("hex")
				.toUpperCase()}`;
			await room.save();
		}

		res.json({
			success: true,
			inviteCode: room.inviteCode,
			roomName: room.name,
		});
	})
);

// @route   POST /api/chat/:roomId/send-invites
// @desc    Send email invitations to join the room
// @access  Private
router.post(
	"/:roomId/send-invites",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const { emails, customMessage } = req.body;
		const userId = req.user.id;

		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			throw new AppError("Email addresses are required", 400);
		}

		const room = await ChatRoom.findById(roomId).populate(
			"organizer",
			"username email"
		);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is organizer
		if (room.organizer._id.toString() !== userId) {
			throw new AppError("Only the room organizer can send invitations", 403);
		}

		// Ensure room has an invite code
		if (!room.inviteCode) {
			const crypto = require("crypto");
			room.inviteCode = `SANTA-${crypto
				.randomBytes(4)
				.toString("hex")
				.toUpperCase()}`;
			await room.save();
		}

		// In a real application, you would send emails here
		// For now, we'll just log the invitation details
		const inviteLink = `${
			process.env.FRONTEND_URL || "http://localhost:5173"
		}/join/${room.inviteCode}`;

		console.log("Sending invitations to:", emails);
		console.log("Invite link:", inviteLink);
		console.log("Custom message:", customMessage);

		// TODO: Implement actual email sending with sendEmail utility
		// const sendEmail = require('../utils/sendEmail');
		// for (const email of emails) {
		//     await sendEmail({
		//         to: email,
		//         subject: `You're invited to join ${room.name}!`,
		//         text: `${room.organizer.username} has invited you to join their Secret Santa room "${room.name}".\n\n${customMessage || ''}\n\nInvite Code: ${room.inviteCode}\nJoin here: ${inviteLink}`
		//     });
		// }

		res.json({
			success: true,
			message: `Invitations sent to ${emails.length} email(s)`,
			inviteCode: room.inviteCode,
		});
	})
);

// @route   GET /api/chat/preview/:inviteCode
// @desc    Get room preview information before joining (no auth required)
// @access  Public
router.get(
	"/preview/:inviteCode",
	asyncHandler(async (req, res) => {
		const { inviteCode } = req.params;

		const room = await ChatRoom.findOne({ inviteCode })
			.populate("organizer", "username profilePic email")
			.select(
				"name description organizer participants maxParticipants roomType theme status"
			);

		if (!room) {
			throw new AppError("Invalid invite code", 404);
		}

		// Don't show inactive rooms
		if (room.status !== "active") {
			throw new AppError("This room is no longer active", 403);
		}

		res.json({
			success: true,
			room: {
				name: room.name,
				description: room.description,
				organizer: {
					username: room.organizer.username,
					profilePic: room.organizer.profilePic,
				},
				participantCount: room.participants.length,
				maxParticipants: room.maxParticipants,
				roomType: room.roomType,
				theme: room.theme,
			},
		});
	})
);

// @route   POST /api/chat/join/:inviteCode
// @desc    Join a room using invite code
// @access  Private
router.post(
	"/join/:inviteCode",
	protect,
	asyncHandler(async (req, res) => {
		const { inviteCode } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findOne({ inviteCode }).populate(
			"organizer",
			"username profilePic email"
		);

		if (!room) {
			throw new AppError("Invalid invite code", 404);
		}

		// Check if already a participant
		if (room.participants.includes(userId)) {
			return res.json({
				success: true,
				message: "You are already a member of this room",
				room: {
					_id: room._id,
					name: room.name,
					description: room.description,
				},
			});
		}

		// Check if room is full
		if (room.participants.length >= room.maxParticipants) {
			throw new AppError("This room is already full", 400);
		}

		// Add user to participants
		room.participants.push(userId);
		await room.save();

		res.json({
			success: true,
			message: `Successfully joined ${room.name}!`,
			room: {
				_id: room._id,
				name: room.name,
				description: room.description,
				organizer: room.organizer,
				participantCount: room.participants.length,
				maxParticipants: room.maxParticipants,
			},
		});
	})
);

// @route   DELETE /api/chat/:roomId/participants/:userId
// @desc    Remove participant from room (admin only)
// @access  Private
router.delete(
	"/:roomId/participants/:userId",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId, userId: targetUserId } = req.params;
		const adminId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is admin
		if (room.organizer.toString() !== adminId) {
			throw new AppError("Only room admin can remove participants", 403);
		}

		// Cannot remove admin
		if (targetUserId === adminId) {
			throw new AppError("Admin cannot be removed from the room", 400);
		}

		// Check if user is actually a participant
		const participantIndex = room.participants.findIndex(
			(p) => p.toString() === targetUserId
		);
		if (participantIndex === -1) {
			throw new AppError("User is not a participant in this room", 404);
		}

		// Remove participant
		room.participants.splice(participantIndex, 1);
		await room.save();

		res.json({
			success: true,
			message: "Participant removed successfully",
		});
	})
);

// @route   POST /api/chat/:roomId/leave
// @desc    Leave room (participant only, not admin)
// @access  Private
router.post(
	"/:roomId/leave",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is admin
		if (room.organizer.toString() === userId) {
			throw new AppError(
				"Admin cannot leave the room. Transfer admin rights or delete the room instead.",
				400
			);
		}

		// Check if user is participant
		const participantIndex = room.participants.findIndex(
			(p) => p.toString() === userId
		);
		if (participantIndex === -1) {
			throw new AppError("You are not a participant in this room", 404);
		}

		// Remove participant
		room.participants.splice(participantIndex, 1);
		await room.save();

		res.json({
			success: true,
			message: "Successfully left the room",
		});
	})
);

// @route   POST /api/chat/:roomId/draw-names
// @desc    Automatically draw Secret Santa pairings (Fisher-Yates shuffle)
// @access  Private (Organizer only)
router.post(
	"/:roomId/draw-names",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId).populate(
			"participants",
			"username email profilePic"
		);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is organizer
		if (room.organizer.toString() !== userId) {
			throw new AppError("Only the organizer can draw names", 403);
		}

		// Check if room is Secret Santa type
		if (room.roomType !== "secret-santa") {
			throw new AppError("This room is not a Secret Santa room", 400);
		}

		// Check minimum participants (at least 3 for meaningful Secret Santa)
		if (room.participants.length < 3) {
			throw new AppError("Need at least 3 participants to draw names", 400);
		}

		// Check if names already drawn
		if (room.pairings && room.pairings.length > 0 && room.status === "drawn") {
			throw new AppError(
				"Names have already been drawn. Clear existing pairings first if you want to redraw.",
				400
			);
		}

		// Fisher-Yates shuffle algorithm
		const participantIds = room.participants.map((p) => p._id.toString());
		const receivers = [...participantIds];

		// Shuffle receivers array
		for (let i = receivers.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[receivers[i], receivers[j]] = [receivers[j], receivers[i]];
		}

		// Ensure no one is paired with themselves
		let attempts = 0;
		const maxAttempts = 100;
		let valid = false;

		while (!valid && attempts < maxAttempts) {
			valid = true;
			for (let i = 0; i < participantIds.length; i++) {
				if (participantIds[i] === receivers[i]) {
					// Swap with next person (circular)
					const nextIndex = (i + 1) % participantIds.length;
					[receivers[i], receivers[nextIndex]] = [
						receivers[nextIndex],
						receivers[i],
					];
					valid = false;
					break;
				}
			}
			attempts++;
		}

		if (!valid) {
			throw new AppError(
				"Could not generate valid pairings. Please try again.",
				500
			);
		}

		// Create pairings array
		const pairings = participantIds.map((giver, index) => ({
			giver: giver,
			receiver: receivers[index],
		}));

		// Update room
		room.pairings = pairings;
		room.status = "drawn";
		await room.save();

		res.json({
			success: true,
			message: "Secret Santa pairings have been drawn!",
			participantCount: participantIds.length,
		});
	})
);

// @route   GET /api/chat/:roomId/my-assignment
// @desc    Get current user's Secret Santa assignment
// @access  Private
router.get(
	"/:roomId/my-assignment",
	protect,
	asyncHandler(async (req, res) => {
		const { roomId } = req.params;
		const userId = req.user.id;

		const room = await ChatRoom.findById(roomId).populate(
			"participants",
			"username email profilePic"
		);

		if (!room) {
			throw new AppError("Room not found", 404);
		}

		// Check if user is participant
		const isParticipant = room.participants.some(
			(p) => p._id.toString() === userId
		);
		if (!isParticipant) {
			throw new AppError("You are not a participant in this room", 403);
		}

		// Check if names have been drawn
		if (!room.pairings || room.pairings.length === 0) {
			throw new AppError("Names have not been drawn yet", 400);
		}

		// Find user's assignment
		const assignment = room.pairings.find((p) => p.giver.toString() === userId);

		if (!assignment) {
			throw new AppError("No assignment found", 404);
		}

		// Get receiver details
		const receiver = room.participants.find(
			(p) => p._id.toString() === assignment.receiver.toString()
		);

		res.json({
			success: true,
			assignment: {
				receiverId: receiver._id,
				receiverName: receiver.username,
				receiverProfilePic: receiver.profilePic,
				receiverEmail: receiver.email,
				roomName: room.name,
				giftBudget: room.giftBudget,
				drawDate: room.drawDate,
			},
		});
	})
);

module.exports = router;
