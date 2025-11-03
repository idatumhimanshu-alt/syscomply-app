import Iteration from '../models/Iteration.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

// Create a new iteration
const createIteration = async (req, res) => {
    try {
        const {name, start_date, end_date, description, is_active } = req.body;

        if (!name || !start_date || !end_date) {
            return res.status(400).json({ error: 'Missing required fields: name, start_date, end_date' });
        }
        const creator_id=req.user.id;
         // Fetch user's role and company ID
         const user = await User.findByPk(creator_id, {
            include: [{ model: Role, attributes: ["name"], required: true }]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const userRole = user.Role ? user.Role.name : null;
        let company_id;

        if (userRole === "System Super Admin") {
            company_id = req.body.company_id;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is required for System Super Admin" });
            }
        } else {
            company_id = req.user.company;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
            }
        }
         
        const iteration = await Iteration.create({
            company_id,
            creator_id,
            name,
            start_date,
            end_date,
            description,
            is_active
        });

        res.status(201).json({ message: 'Iteration created successfully', iteration });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all active iterations
const getAllIterations = async (req, res) => {
    const creator_id=req.user.id;
    // Fetch user's role and company ID
    const user = await User.findByPk(creator_id, {
       include: [{ model: Role, attributes: ["name"], required: true }]
   });

   if (!user) {
       return res.status(404).json({ error: "User not found" });
   }

   const userRole = user.Role ? user.Role.name : null;
   let company_id;

   if (userRole === "System Super Admin") {
       company_id = req.query.company_id;
       if (!company_id) {
           return res.status(400).json({ error: "Company ID is required for System Super Admin" });
       }
   } else {
       company_id = req.user.company;
       if (!company_id) {
           return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
       }
   }

    try {
        const iterations = await Iteration.findAll({
            where: { is_active: true ,company_id}
        });
        res.json(iterations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get a single iteration by ID
const getIterationById = async (req, res) => {
    try {
        const iteration = await Iteration.findByPk(req.params.id);
        if (!iteration) return res.status(404).json({ error: 'Iteration not found' });

        res.json(iteration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an iteration
const updateIteration = async (req, res) => {
    try {
        const { name, start_date, end_date, description, is_active } = req.body;
        const iteration = await Iteration.findByPk(req.params.id);
        if (!iteration) return res.status(404).json({ error: 'Iteration not found' });

        await iteration.update({
            name,
            start_date,
            end_date,
            description,
            is_active
        });

        res.json({ message: 'Iteration updated successfully', iteration });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Soft delete an iteration
const deleteIteration = async (req, res) => {
    try {
        const iteration = await Iteration.findByPk(req.params.id);
        if (!iteration) {
            return res.status(404).json({ error: 'Iteration not found' });
        }

        // Soft delete: mark as inactive
        iteration.is_active = false;
        await iteration.save();

        res.json({ message: 'Iteration soft deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export default {
    createIteration,
    getAllIterations,
    getIterationById,
    updateIteration,
    deleteIteration
};
