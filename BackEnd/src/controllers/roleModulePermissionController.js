import RoleModulePermission from '../models/RoleModulesPermissions.js';
import Role from '../models/Role.js';
import Module from '../models/Module.js';


// Function to assign or update permissions for a role
export const assignPermission = async (req, res) => {
    try {
        // Extract role ID from request parameters and modules from request body
        //const  roleId  = req.user.role;
        const { roleId ,modules } = req.body;

        // Validate input parameters
        if (!roleId || !Array.isArray(modules) || modules.length === 0) {
            return res.status(400).json({ error: "Role ID and modules array are required." });
        }

        // Iterate through the modules array and process each module's permissions
        for (const module of modules) {
            const { module_id, can_read = false, can_write = false, can_delete = false } = module;

            // Check if the permission already exists for this role & module
            const [permission, created] = await RoleModulePermission.findOrCreate({
                where: { role_id: roleId, module_id },
                defaults: { can_read, can_write, can_delete } // Set defaults if new
            });

            // If it exists, update the existing record
            if (!created) {
                await permission.update({ can_read, can_write, can_delete });
            }
        }

        res.status(201).json({ message: "Permissions assigned  successfully" });
    } catch (error) {
        // Handle unexpected server errors
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
};



// Get all role-module permissions
export const getAllPermissions = async (req, res) => {
    try {
        const permissions = await RoleModulePermission.findAll();
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get permissions by role
export const getPermissionsByRole = async (req, res) => {
    try {
        const { role_id } = req.params;
        const permissions = await RoleModulePermission.findAll({
             where: { role_id },
             include: [{model :Role}, { model: Module }],
         });

        if (!permissions.length) return res.status(404).json({ error: 'No permissions found for this role' });

        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update role-module permission
// export const updatePermission = async (req, res) => {
//     try {
//         const { role_id, module_id } = req.params;
//         const { can_read, can_write, can_delete } = req.body;

//         const permission = await RoleModulePermission.findOne({ where: { role_id, module_id } });
//         if (!permission) return res.status(404).json({ error: 'Permission not found' });

//         await permission.update({ can_read, can_write, can_delete });
//         res.json({ message: 'Permissions updated successfully', permission });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Delete role-module permission
export const deletePermission = async (req, res) => {
    try {
        const { role_id,module_id } = req.body;
       // const role_id = req.user.role;

        const permission = await RoleModulePermission.findOne({ where: { role_id, module_id } });
        if (!permission) return res.status(404).json({ error: 'Permission not found' });

        await permission.destroy();
        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default { assignPermission, getAllPermissions, getPermissionsByRole,  deletePermission };
