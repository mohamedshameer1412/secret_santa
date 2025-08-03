const Dare = require('../models/dare');

// Create a new dare
exports.createDare = async (req, res) => {
  try {
    const newDare = await Dare.create({
      description: req.body.description,
      assignedUser: req.body.assignedUser || null,
      createdBy: req.user.id,
      eventId: req.body.eventId || null
    });
    res.status(201).json(newDare);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error creating dare' });
  }
};

// Assign dare to user (within same event or participant list)
exports.assignDare = async (req, res) => {
  const { dareId, userId } = req.body;
  try {
    const dare = await Dare.findById(dareId);
    if (!dare) return res.status(404).json({ message: 'Dare not found' });

    dare.assignedUser = userId;
    await dare.save();
    res.json(dare);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error assigning dare' });
  }
};

// Get all dares created by the current user
exports.getMyDares = async (req, res) => {
  try {
    const dares = await Dare.find({ createdBy: req.user.id });
    res.json(dares);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching dares' });
  }
};

// Get all dares assigned to the current user
exports.getAssignedDares = async (req, res) => {
  try {
    const dares = await Dare.find({ assignedUser: req.user.id });
    res.json(dares);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching assigned dares' });
  }
};

// Get all dares for a specific event
exports.getDaresByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const dares = await Dare.find({ eventId });
    res.json(dares);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching dares by event' });
  }
};

// Get a single dare by ID
exports.getDareById = async (req, res) => {
  try {
    const dare = await Dare.findById(req.params.dareId);
    if (!dare) return res.status(404).json({ message: 'Dare not found' });
    res.json(dare);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching dare' });
  }
};

// Update a dare (description or reassignment)
exports.updateDare = async (req, res) => {
  try {
    const dare = await Dare.findById(req.params.dareId);
    if (!dare) return res.status(404).json({ message: 'Dare not found' });

    // Only creator can update
    if (dare.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    dare.description = req.body.description || dare.description;
    if (req.body.assignedUser) dare.assignedUser = req.body.assignedUser;

    await dare.save();
    res.json(dare);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error updating dare' });
  }
};

// Delete a dare
exports.deleteDare = async (req, res) => {
  try {
    const dare = await Dare.findById(req.params.dareId);
    if (!dare) return res.status(404).json({ message: 'Dare not found' });

    // Only creator can delete
    if (dare.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await dare.remove();
    res.json({ message: 'Dare deleted successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error deleting dare' });
  }
};
