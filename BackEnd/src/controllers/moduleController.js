import Module from '../models/Module.js';

// Create a new module
 const createModule = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Module name is required' });

        const module = await Module.create({ name, description });
        res.status(201).json({ message: 'Module created successfully', module });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all modules
 const getAllModules = async (req, res) => {
    try {
        const modules = await Module.findAll();
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single module by ID
 const getModuleById = async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        res.json(module);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a module
 const updateModule = async (req, res) => {
    try {
        const { name, description } = req.body;
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        await module.update({ name, description });
        res.json({ message: 'Module updated successfully', module });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a module
 const deleteModule = async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        await module.destroy();
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default { createModule, getAllModules, getModuleById, updateModule, deleteModule };
