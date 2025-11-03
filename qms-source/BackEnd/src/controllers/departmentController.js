import { error } from 'console';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Role from '../models/Role.js'

export const createDepartment = async (req, res) => {
  try {
    const {  name, description } = req.body;
    const user_id = req.user.id;

        // Fetch user's role and company ID
        const user = await User.findByPk(user_id, {
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

        if(!name){
            return res.status(400).json({error:"Department name is required"})
        }
    const department = await Department.create({ company_id, name, description });
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const user_id = req.user.id;

        // Fetch user's role and company ID
        const user = await User.findByPk(user_id, {
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
    const departments = await Department.findAll(
        {
            where: { is_active: true ,company_id}
        }
    );
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const department = await Department.findByPk(id);
    if (!department) return res.status(404).json({ error: 'Department not found' });

    department.name = name ?? department.name;
    department.description = description ?? department.description;
    if (typeof is_active === 'boolean') department.is_active = is_active;

    await department.save();
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Find all users assigned to this department
    const assignedUsers = await User.findAll({
      where: { department_id: id },
      attributes: ['id', 'name']
    });

    if (assignedUsers.length > 0) {
      const userNames = assignedUsers.map(user => user.name).join(', ');
      return res.status(400).json({
        error: `Cannot delete department: It is assigned to the following user(s): ${userNames}`
      });
    }

    // Safe to delete
    await department.destroy();
    res.json({ message: 'Department deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export default {createDepartment,getAllDepartments,getDepartmentById,updateDepartment,deleteDepartment}