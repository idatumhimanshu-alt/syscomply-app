import Role from '../models/Role.js';
import User from "../models/User.js";
import sequelize from "../config/db.js";
import Module from '../models/Module.js';
import RoleModulePermission from '../models/RoleModulesPermissions.js';

export const createRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, description, parent_role_id, company_id } = req.body;
    const createdBy = req.user.id;

    // Fetch user's role
    const user = await User.findByPk(createdBy, {
      include: [{ model: Role, attributes: ["name"], required: true }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = user.Role ? user.Role.name : null;
    let assignedCompanyId;

    if (userRole === "System Super Admin") {
      if (!company_id) {
        return res.status(400).json({ error: "Company ID is required for System Super Admin" });
      }
      assignedCompanyId = company_id;
    } else {
      assignedCompanyId = req.user.company;

      if (!assignedCompanyId) {
        return res.status(400).json({ error: "Company ID is not assigned to your account." });
      }
    }

    if (name.toLowerCase() === "system super admin") {
      return res.status(403).json({ error: '"System Super Admin" role cannot be created manually.' });
    }

    // Create role
    const role = await Role.create({
      name,
      description,
      parent_role_id,
      company_id: assignedCompanyId,
    }, { transaction });

    // Fetch all modules
    const modules = await Module.findAll({ transaction });

    if (!modules.length) {
      throw new Error("No modules found. Please check the Modules table.");
    }

    // Add default read/write permissions for each module
    const permissionsToCreate = modules.map(module => ({
      role_id: role.id,
      module_id: module.id,
      can_read: true,
      can_write: true,
      can_delete: false, // optional: change as needed
    }));

    await RoleModulePermission.bulkCreate(permissionsToCreate, { transaction });

    await transaction.commit();

    res.status(201).json({ message: "Role created successfully with default permissions", role });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

  

const updateRoleDetails = async (req, res) => {
    try {
        const { name, description, parent_role_id } = req.body;
        const role = await Role.findByPk(req.params.id);

        if (!role) return res.status(404).json({ error: 'Role not found' });

        // Validate parent role if provided
        if (parent_role_id && parent_role_id !== role.id) {
            const parentRole = await Role.findByPk(parent_role_id);
            if (!parentRole) {
                return res.status(400).json({ error: 'Invalid parent_role_id' });
            }
        }
          
        if (role.name.toLowerCase() === "system super admin") {
          return res.status(403).json({ error: 'You are not allowed to modify "System Super Admin" role.' });
        }
        
        if (name && name.toLowerCase() === "system super admin") {
          return res.status(403).json({ error: 'Renaming any role to "System Super Admin" is not allowed.' });
        }
        
        await role.update({ name, description, parent_role_id });
        res.json({ message: 'Role updated successfully', role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRoleDetails = async (req, res) => {
    try {
      const user_id = req.user.id;
      const role_id = req.params.id;
  
      // Fetch user role
      const user = await User.findByPk(user_id, {
        include: [{ model: Role, attributes: ["name"], required: true }],
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      const userRole = user.Role ? user.Role.name : null;
      let company_id;
  
      if (userRole === "System Super Admin") {
        company_id = req.query.company_id || req.body.company_id; // Accept from query or body
        if (!company_id) {
          return res.status(400).json({ error: "Company ID is required for System Super Admin" });
        }
      } else {
        company_id = req.user.company;
        if (!company_id) {
          return res.status(400).json({ error: "Company ID is not assigned to your account." });
        }
      }
  
      if (role_id) {
        // Fetch specific role details by ID
        const role = await Role.findOne({ where: { id: role_id, company_id } });
        if (!role) {
          return res.status(404).json({ error: "Role not found" });
        }
        return res.json(role);
      }
  
      // Fetch all roles if no specific ID is provided
      const roles = await Role.findAll({ where: { company_id } });
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  

  export const softDeleteRole = async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);

        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        if (role.name.toLowerCase() === "system super admin") {
            return res.status(403).json({ error: 'Cannot delete "System Super Admin" role.' });
        }

        // Check for active users assigned to this role
        const assignedUsers = await User.findAll({
            where: {
                role_id: role.id,
                is_active: true
            },
            attributes: ['name', 'email']
        });

        if (assignedUsers.length > 0) {
            const userNames = assignedUsers.map(u => `${u.name} (${u.email})`).join(', ');
            return res.status(400).json({
                error: `Cannot delete role. It is assigned to the following active user(s): ${userNames}. Please assign a different role to these user(s) before deleting this role.`
            });
        }

        await role.destroy(); // Soft delete (paranoid mode)

        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error in softDeleteRole:", error);
        res.status(500).json({ error: error.message });
    }
};

  
  

export default { createRole, updateRoleDetails, getRoleDetails,softDeleteRole  };





// import Role from '../models/Role.js';

// const createRole = async (req, res) => {
//     try {
//         const { name, description } = req.body;

//         if (!name || !description) return res.status(400).json({ error: 'Name and description are required' });

//         const newRole = await Role.create({ name, description });
//         res.status(201).json({ message: 'Role created successfully', roleId: newRole.id });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const updateRoleDetails = async (req, res) => {
//     try {
//         const { name, description } = req.body;
//         const role = await Role.findByPk(req.params.id);

//         if (!role) return res.status(404).json({ error: 'Role not found' });

//         await role.update({ name, description });
//         res.json({ message: 'Role updated successfully', role });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// const getRoleDetails = async (req, res) => {
//     try {
//         let role;
//         if (req.params.id) {
//             role = await Role.findByPk(req.params.id);
//             if (!role) return res.status(404).json({ error: 'Role not found' });
//         } else {
//             role = await Role.findAll({ order: [['name', 'ASC']] }); // Sorting alphabetically by name
//         }

//         res.json(role);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export default { createRole, updateRoleDetails, getRoleDetails };
