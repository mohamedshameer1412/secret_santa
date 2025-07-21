const Dare = require('../models/dare');

// Create a new dare
exports.createDare = async (req, res) => {
    const { description, assignedUser } = req.body;

    try {
        const newDare = new Dare({ description, assignedUser });
        await newDare.save();
        res.status(201).json(newDare);
    } catch (error) {
        res.status(500).json({ message: 'Error creating dare', error });
    }
};

// Get all dares
exports.getAllDares = async (req, res) => {
    try {
        const dares = await Dare.find();
        res.status(200).json(dares);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving dares', error });
    }
};

// Assign a dare to a user
exports.assignDare = async (req, res) => {
    const { dareId, userId } = req.body;

    try {
        const dare = await Dare.findById(dareId);
        if (!dare) {
            return res.status(404).json({ message: 'Dare not found' });
        }

        dare.assignedUser = userId;
        await dare.save();
        res.status(200).json(dare);
    } catch (error) {
        res.status(500).json({ message: 'Error assigning dare', error });
    }
};

// Get a specific dare by ID
exports.getDareById = async (req, res) => {
    const { id } = req.params;

    try {
        const dare = await Dare.findById(id);
        if (!dare) {
            return res.status(404).json({ message: 'Dare not found' });
        }
        res.status(200).json(dare);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving dare', error });
    }
};