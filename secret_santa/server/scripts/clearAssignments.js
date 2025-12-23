/**
 * Clear Assignments Script
 *
 * This script clears all Secret Santa assignments for a specific room.
 * Usage: node clearAssignments.js [roomName]
 *
 * Example:
 *   node clearAssignments.js "Office Secret Santa 2024"
 *   node clearAssignments.js
 *
 * If no room name is provided, the script will list all available rooms
 * and prompt you to enter one.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");
const ChatRoom = require("../models/ChatRoom");

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/secret-santa";

// Create readline interface for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Promisify readline question
function question(query) {
	return new Promise((resolve) => rl.question(query, resolve));
}

async function listAllRooms() {
	console.log("\n📋 Available Rooms:\n");
	const rooms = await ChatRoom.find({ roomType: "secret-santa" })
		.select("name status assignmentStrategy participants pairings")
		.populate("participants", "name username email")
		.sort({ createdAt: -1 });

	if (rooms.length === 0) {
		console.log("   No Secret Santa rooms found.\n");
		return [];
	}

	rooms.forEach((room, index) => {
		const hasAssignments = room.pairings && room.pairings.length > 0;
		const statusIcon = hasAssignments ? "✅" : "⏳";
		console.log(`   ${index + 1}. ${statusIcon} "${room.name}"`);
		console.log(`      Status: ${room.status || "waiting"}`);
		console.log(`      Strategy: ${room.assignmentStrategy || "auto-roll"}`);
		console.log(`      Participants: ${room.participants?.length || 0}`);
		console.log(
			`      Assignments: ${hasAssignments ? room.pairings.length : 0}`
		);
		console.log("");
	});

	return rooms;
}

async function clearAssignmentsForRoom(roomName) {
	try {
		console.log(`\n🔍 Searching for room: "${roomName}"...`);

		// Find the room by name (case-insensitive)
		const room = await ChatRoom.findOne({
			name: { $regex: new RegExp(`^${roomName}$`, "i") },
			roomType: "secret-santa",
		}).populate("participants", "name username email");

		if (!room) {
			console.log(`\n❌ Room "${roomName}" not found.`);
			console.log("   Please check the room name and try again.\n");
			return false;
		}

		console.log(`\n✅ Found room: "${room.name}"`);
		console.log(`   Room ID: ${room._id}`);
		console.log(`   Status: ${room.status || "waiting"}`);
		console.log(`   Participants: ${room.participants?.length || 0}`);
		console.log(`   Current Assignments: ${room.pairings?.length || 0}`);

		if (!room.pairings || room.pairings.length === 0) {
			console.log("\n⚠️  This room has no assignments to clear.");
			const proceed = await question(
				"   Do you still want to reset the status? (yes/no): "
			);
			if (proceed.toLowerCase() !== "yes" && proceed.toLowerCase() !== "y") {
				console.log("\n❌ Operation cancelled.\n");
				return false;
			}
		} else {
			console.log(
				"\n⚠️  WARNING: This will clear all Secret Santa assignments!"
			);
			console.log("   This action cannot be undone.");
			const confirm = await question(
				"   Are you sure you want to continue? (yes/no): "
			);

			if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
				console.log("\n❌ Operation cancelled.\n");
				return false;
			}
		}

		// Clear assignments
		room.pairings = [];
		room.status = "waiting";
		await room.save();

		console.log("\n✅ Assignments cleared successfully!");
		console.log("   - Pairings: Reset to empty");
		console.log('   - Status: Changed to "waiting"');
		console.log("   - Participants can now draw names again\n");

		return true;
	} catch (error) {
		console.error("\n❌ Error clearing assignments:", error.message);
		return false;
	}
}

async function main() {
	try {
		console.log("\n🎅 Secret Santa - Clear Assignments Script 🎄\n");
		console.log("   This script will clear all assignments for a room,");
		console.log("   allowing names to be drawn again.\n");

		// Connect to database
		await mongoose.connect(MONGODB_URI);
		console.log("✅ Connected to MongoDB\n");

		// Get room name from command line argument
		let roomName = process.argv[2];

		if (!roomName) {
			// No room name provided - list all rooms
			const rooms = await listAllRooms();

			if (rooms.length === 0) {
				console.log("❌ No rooms found. Exiting.\n");
				rl.close();
				await mongoose.disconnect();
				process.exit(0);
			}

			// Prompt for room name
			roomName = await question(
				"Enter room name (or number from list above): "
			);

			// Check if user entered a number
			const roomIndex = parseInt(roomName) - 1;
			if (!isNaN(roomIndex) && roomIndex >= 0 && roomIndex < rooms.length) {
				roomName = rooms[roomIndex].name;
			}

			if (!roomName || roomName.trim() === "") {
				console.log("\n❌ No room name entered. Exiting.\n");
				rl.close();
				await mongoose.disconnect();
				process.exit(0);
			}
		}

		// Clear assignments
		const success = await clearAssignmentsForRoom(roomName.trim());

		// Close readline and disconnect
		rl.close();
		await mongoose.disconnect();
		console.log("✅ Disconnected from MongoDB\n");

		process.exit(success ? 0 : 1);
	} catch (error) {
		console.error("\n❌ Fatal error:", error.message);
		rl.close();
		await mongoose.disconnect();
		process.exit(1);
	}
}

// Run the script
main();
