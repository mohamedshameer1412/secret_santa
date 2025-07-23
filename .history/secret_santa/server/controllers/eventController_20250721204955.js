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

    // Send email invites
    for (let p of event.participants) {
      const invitationLink = `${req.protocol}://${req.get('host')}/event/join/${event._id}`;
      const message = `
        <h1>Secret Santa Invite!</h1>
        <p>${req.user.name} invites you to: <strong>${name}</strong></p>
        <p>Details:<br>${description}<br>
        Budget: ${budget.min}–${budget.max} ${budget.currency}<br>
        Exchange on: ${new Date(exchangeDate).toLocaleDateString()}</p>
        <a href="${invitationLink}">Join & add wishlist</a>
      `;
      await sendEmail(p.email, `Invite: ${name}`, message);
    }

    res.status(201).json(event);
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
