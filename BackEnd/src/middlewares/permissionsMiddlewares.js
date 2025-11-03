import RoleModulePermission from '../models/RoleModulesPermissions.js';

const checkPermission = (action) => {
    return async (req, res, next) => {
        try {
           // const { roleId, moduleId } = req.body; // Expecting roleId and moduleId from frontend request
                 const roleId = req.user.role;
                 const moduleId = req.params.moduleId;
                 console.log(`Role ID: ${roleId}, Module ID: ${moduleId}`);

                 if (!moduleId || moduleId.length < 36) {  // Validate if moduleId is a proper UUID
                     return res.status(403).json({ error: "Invalid module ID format." });
                 }
                 
            // if (!moduleId) {
            //     return res.status(403).json({ error: "Invalid request. Missing module ID." });
            // }

            // Fetch permissions for the given role and module
            const permission = await RoleModulePermission.findOne({
                where: {
                    role_id: roleId,
                    module_id: moduleId
                }
            });

            if (!permission) {
                return res.status(403).json({ error: "No permission assigned for this module." });
            }

            // Check if the role has the required permission
            if (action === "read" && !permission.can_read) {
                return res.status(403).json({ error: "Read access denied." });
            }
            if (action === "write" && !permission.can_write) {
                return res.status(403).json({ error: "Write access denied." });
            }
            if (action === "delete" && !permission.can_delete) {
                return res.status(403).json({ error: "Delete access denied." });
            }

            next(); // Allow request to proceed
        } catch (error) {
            res.status(500).json({ error: "Internal Server Error: " + error.message });
        }
    };
};

export default checkPermission;



// import RoleModulePermission from '../models/RoleModulesPermissions.js';
// import Module from '../models/Module.js';

// // Route-to-Module Mapping (Can be stored in DB or config file)
// const routeToModule = {
//     "/api/companies": "Company",
//     "/api/users": "User",
//     "/api/roles": "Role",
//     "/api/modules": "Module",
//     "/api/permissions": "Role_Module_Permission"
// };

// const checkPermission = (action) => {
//     return async (req, res, next) => {
//         try {
//             const { roleId } = req.params; // Role ID must be passed in request params
//             const baseRoute = Object.keys(routeToModule).find(route => req.originalUrl.startsWith(route));

//             if (!roleId || !baseRoute) {
//                 return res.status(403).json({ error: "Invalid request. Missing role ID or unknown module." });
//             }

//             // Get the module name dynamically
//             const moduleName = routeToModule[baseRoute];

//             // Fetch module ID from database
//             const module = await Module.findOne({ where: { name: moduleName } });
//             if (!module) {
//                 return res.status(403).json({ error: "Module not found." });
//             }

//             // Fetch permissions for the given role and module
//             const permission = await RoleModulePermission.findOne({
//                 where: {
//                     role_id: roleId,
//                     module_id: module.id
//                 }
//             });

//             if (!permission) {
//                 return res.status(403).json({ error: "No permission assigned for this module." });
//             }

//             // Check if the role has the required permission
//             if (action === "read" && !permission.can_read) {
//                 return res.status(403).json({ error: "Read access denied." });
//             }
//             if (action === "write" && !permission.can_write) {
//                 return res.status(403).json({ error: "Write access denied." });
//             }
//             if (action === "delete" && !permission.can_delete) {
//                 return res.status(403).json({ error: "Delete access denied." });
//             }

//             next(); // Allow request to proceed
//         } catch (error) {
//             res.status(500).json({ error: "Internal Server Error: " + error.message });
//         }
//     };
// };

// export default checkPermission;
