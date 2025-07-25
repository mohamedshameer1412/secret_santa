const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

// Create new Secret Santa event
exports.createEvent = async (req, res) => {
  try {
    const { name, description, budget, exchangeDate, participants } = req.body;

    const newEvent = new Event({
      name,
      description,
      organizer: req.user.id,
      budget,
      exchangeDate,
      participants: participants.map(p => ({
        name: p.name,
        email: p.email,
        user: p.userId || null,
        confirmed: !!p.userId,
        wishlist: ''
      }))
    });

    const event = await newEvent.save();

        // Send NOTIFICATION emails to participants (not verification)
    for (let participant of event.participants) {
      const message = `
        <h1>🎄 You've been added to a Secret Santa event!</h1>
        <p><strong>${req.user.name}</strong> has added you to their Secret Santa event: <strong>${name}</strong></p>
        
        <h2>📋 Event Details:</h2>
        <ul>
          <li><strong>Event:</strong> ${name}</li>
          <li><strong>Description:</strong> ${description || 'No description provided'}</li>
          <li><strong>Budget:</strong> $${budget || '0-50'}</li>
          <li><strong>Exchange Date:</strong> ${new Date(exchangeDate).toLocaleDateString()}</li>
        </ul>
        
        <p>🎁 You're all set! No action required from you.</p>
        <p>The organizer will let you know when it's time for the gift exchange.</p>
        
        <hr>
        <p><small>This is an automated notification. You don't need to click any links or verify anything.</small></p>
      `;

      try {
        await sendEmail(
          participant.email, 
          `🎄 You've been added to: ${name}`, 
          message
        );
      } catch (emailError) {
        console.error(`❌ Failed to send notification to ${participant.email}:`, emailError.message);
        // Continue without failing the entire request
      }
    }

    res.status(201).json({
      success: true,
      data: event,
      message: `Event created and ${event.participants.length} participants notified`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join event (e.g. via invitation link)
exports.joinEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { wishlist } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const participant = event.participants.find(p => p.email === req.user.email);
    if (!participant) return res.status(403).json({ message: 'Not invited to this event' });

    participant.user = req.user.id;
    participant.confirmed = true;
    participant.wishlist = wishlist;

    await event.save();

    res.status(200).json({ message: 'Joined successfully', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error joining event' });
  }
};

// Get all events organized by current user
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events' });
  }
};

// Get event details (with participants & their wishlists)
exports.getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isAuthorized =
      event.organizer.toString() === req.user.id ||
      event.participants.some(p => p.user?.toString() === req.user.id);

    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving event' });
  }
};

// Shuffle and assign Secret Santas (only organizer can do this)
exports.assignSecretSantas = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only organizer can assign Secret Santas' });
    }

    const confirmedParticipants = event.participants.filter(p => p.confirmed);
    if (confirmedParticipants.length < 2) {
      return res.status(400).json({ message: 'Not enough participants' });
    }

    // Fisher–Yates shuffle
    let shuffled = [...confirmedParticipants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign santas
    for (let i = 0; i < confirmedParticipants.length; i++) {
      const giver = confirmedParticipants[i];
      const receiver = shuffled[(i + 1) % confirmedParticipants.length];

      giver.assignedTo = receiver.user;
    }

    await event.save();

    // Notify participants
    for (let p of confirmedParticipants) {
      const assigned = confirmedParticipants.find(u => u.user.toString() === p.assignedTo.toString());
      const message = `
        <h1>🎅 You've been assigned your Secret Santa!</h1>
        <p>You are gifting <strong>${assigned.name}</strong>.</p>
        <p>Their wishlist: ${assigned.wishlist || 'No wishlist provided'}</p>
      `;
      await sendEmail(p.email, '🎁 Your Secret Santa Assignment!', message);
    }

    res.status(200).json({ message: 'Assignments done!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error assigning Secret Santas' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Only organizer can update
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update allowed fields
    if (updates.name !== undefined) event.name = updates.name;
    if (updates.description !== undefined) event.description = updates.description;
    if (updates.exchangeDate !== undefined) event.exchangeDate = updates.exchangeDate;
    if (updates.budget !== undefined) event.budget = updates.budget;

    await event.save();

    res.status(200).json({ success: true, data: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating event' });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving event' });
  }
};