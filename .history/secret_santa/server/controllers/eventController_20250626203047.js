const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail');

// Create new Secret Santa event
exports.createEvent = async (req, res) => {
  try {
    const { name, description, budget, exchangeDate, participants } = req.body;

    // Create new event
    const newEvent = new Event({
      name,
      description,
      organizer: req.user.id,
      budget,
      exchangeDate,
      participants: participants.map(p => ({
        name: p.name,
        email: p.email,
        user: p.userId || null
      }))
    });

    const event = await newEvent.save();

    // Send invitations to participants
    for (let participant of event.participants) {
      const invitationLink = `${req.protocol}://${req.get('host')}/event/join/${event._id}`;
      const message = `
        <h1>You've been invited to a Secret Santa!</h1>
        <p>${req.user.name} has invited you to join their Secret Santa event: ${name}</p>
        <p><strong>Event Details:</strong><br>
        ${description}<br>
        Budget: ${budget.min}-${budget.max} ${budget.currency}<br>
        Exchange Date: ${new Date(exchangeDate).toLocaleDateString()}</p>
        <p>Click the link below to join and provide your wishlist:</p>
        <a href="${invitationLink}" target="_blank">Join Secret Santa</a>
      `;

      await sendEmail(participant.email, `Secret Santa Invitation: ${name}`, message);
    }

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all events organized by the user
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
                             .sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join an event
exports.joinEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.id;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is already in participants
    if (event.participants.includes(userId)) {
      return res.status(400).json({ message: 'You are already participating in this event' });
    }
    
    // Add user to participants
    event.participants.push(userId);
    await event.save();
    
    res.status(200).json({ message: 'Successfully joined event', event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get events user is participating in
exports.getParticipatingEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      'participants.email': req.user.email 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
                           .populate('organizer', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is authorized to view the event
    const isOrganizer = event.organizer._id.toString() === req.user.id;
    const isParticipant = event.participants.some(p => p.email === req.user.email);
    
    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Draw names for Secret Santa
exports.drawNames = async (req, res) => {
  try {
    // Get event by ID
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if drawing is already complete
    if (event.drawingComplete) {
      return res.status(400).json({ message: 'Drawing is already complete' });
    }

    // Filter only confirmed participants
    const confirmedParticipants = event.participants.filter(p => p.confirmed);
    
    if (confirmedParticipants.length < 2) {
      return res.status(400).json({ 
        message: 'Need at least 2 confirmed participants for drawing' 
      });
    }

    // Shuffle participants using Fisher-Yates algorithm
    const shuffled = [...confirmedParticipants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign each participant someone to gift
    for (let i = 0; i < confirmedParticipants.length; i++) {
      const giver = confirmedParticipants[i];
      const receiver = shuffled[(i + 1) % shuffled.length];
      
      // Find the participant in the event and update their giftFor field
      const giverIndex = event.participants.findIndex(
        p => p._id.toString() === giver._id.toString()
      );
      
      event.participants[giverIndex].giftFor = receiver._id;
    }

    event.drawingComplete = true;
    await event.save();

    // Send notification emails to participants
    for (let participant of confirmedParticipants) {
      const giverIndex = event.participants.findIndex(
        p => p._id.toString() === participant._id.toString()
      );
      
      const giftForId = event.participants[giverIndex].giftFor;
      const giftFor = event.participants.find(p => p._id.toString() === giftForId.toString());
      
      const message = `
        <h1>Secret Santa Drawing Complete!</h1>
        <p>The drawing for "${event.name}" is complete!</p>
        <p>You will be giving a gift to: <strong>${giftFor.name}</strong></p>
        ${giftFor.wishlist ? `<p><strong>Their wishlist:</strong> ${giftFor.wishlist}</p>` : ''}
        <p><strong>Event Details:</strong><br>
        Budget: ${event.budget.min}-${event.budget.max} ${event.budget.currency}<br>
        Exchange Date: ${new Date(event.exchangeDate).toLocaleDateString()}</p>
      `;

      await sendEmail(
        participant.email,
        `Secret Santa: Your match for ${event.name}`,
        message
      );
    }

    res.status(200).json({ message: 'Drawing complete and notifications sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmParticipation = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Find participant by email
    const participantIndex = event.participants.findIndex(
      p => p.email === req.user.email
    );
    
    if (participantIndex === -1) {
      return res.status(404).json({ message: 'You are not part of this event' });
    }
    
    // Update participant information
    event.participants[participantIndex].confirmed = true;
    event.participants[participantIndex].user = req.user.id;
    
    await event.save();
    
    res.status(200).json({ message: 'Participation confirmed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update wishlist
exports.updateWishlist = async (req, res) => {
  try {
    const { wishlist } = req.body;
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Find participant by email or user ID
    const participantIndex = event.participants.findIndex(
      p => p.email === req.user.email || (p.user && p.user.toString() === req.user.id)
    );
    
    if (participantIndex === -1) {
      return res.status(404).json({ message: 'You are not part of this event' });
    }
    
    event.participants[participantIndex].wishlist = wishlist;
    await event.save();
    
    res.status(200).json({ message: 'Wishlist updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { name, description, budget, exchangeDate } = req.body;
    
    // Find the event
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if drawing is already complete
    if (event.drawingComplete) {
      return res.status(400).json({ 
        message: 'Cannot modify event after drawing is complete' 
      });
    }
    
    // Update fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (budget) updateFields.budget = budget;
    if (exchangeDate) updateFields.exchangeDate = exchangeDate;
    
    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Event.findByIdAndRemove(req.params.id);
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add participants to event
exports.addParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if drawing is already complete
    if (event.drawingComplete) {
      return res.status(400).json({ 
        message: 'Cannot add participants after drawing is complete' 
      });
    }
    
    // Add new participants
    for (let participant of participants) {
      // Check if email already exists
      const exists = event.participants.some(p => p.email === participant.email);
      if (!exists) {
        event.participants.push({
          name: participant.name,
          email: participant.email,
          user: participant.userId || null
        });
      }
    }
    
    await event.save();
    
    // Send invitations to new participants
    for (let participant of participants) {
      const exists = event.participants.some(p => p.email === participant.email);
      if (exists) {
        const invitationLink = `${req.protocol}://${req.get('host')}/event/join/${event._id}`;
        const message = `
          <h1>You've been invited to a Secret Santa!</h1>
          <p>${req.user.name} has invited you to join their Secret Santa event: ${event.name}</p>
          <p><strong>Event Details:</strong><br>
          ${event.description}<br>
          Budget: ${event.budget.min}-${event.budget.max} ${event.budget.currency}<br>
          Exchange Date: ${new Date(event.exchangeDate).toLocaleDateString()}</p>
          <p>Click the link below to join and provide your wishlist:</p>
          <a href="${invitationLink}" target="_blank">Join Secret Santa</a>
        `;
  
        await sendEmail(participant.email, `Secret Santa Invitation: ${event.name}`, message);
      }
    }
    
    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove participant from event
exports.removeParticipant = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if drawing is already complete
    if (event.drawingComplete) {
      return res.status(400).json({ 
        message: 'Cannot remove participants after drawing is complete' 
      });
    }
    
    // Find and remove participant
    const participantIndex = event.participants.findIndex(
      p => p._id.toString() === req.params.participantId
    );
    
    if (participantIndex === -1) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    event.participants.splice(participantIndex, 1);
    await event.save();
    
    res.status(200).json({ message: 'Participant removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};