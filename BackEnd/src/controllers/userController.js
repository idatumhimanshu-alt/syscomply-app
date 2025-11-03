import User from '../models/User.js';
import Company from '../models/Company.js';
import Role from '../models/Role.js';
import generateRandomPassword from '../utils/generateRandomPassword.js';
import sendEmail from '../utils/sendEmail.js';
import { Sequelize } from 'sequelize';
import Department from '../models/Department.js';

const createUser = async (req, res) => {
    try {
        const { email, name, company_id, role_id, reportTo,department_id } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        // Check if an active user already exists with the same email
        const existingUser = await User.findOne({
            where: {
                email,
                is_active: true
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'An active user with this email already exists. Please use a different email.' });
        }

        // Generate a unique random password
        const generatedPassword = generateRandomPassword();

        console.log(`Generated Password: ${generatedPassword}`);

        const newUser = await User.create({ 
            email, 
            name, 
            company_id, 
            role_id, 
            department_id,
            password_hash: generatedPassword,
            reportTo
        });

        // Send email to the new user with login credentials
        const subject = 'Welcome to Our Platform - Your Login Credentials';
        const message = `
            Hello ${name},
            \nYour account has been created successfully. Below are your login credentials:\n
            Email: ${email}
            Password: ${generatedPassword}
            \nPlease change your password after logging in.\n
            Regards,
            Your Team
        `;

        await sendEmail(email, subject, message);

        res.status(201).json({ message: 'User created successfully', userId: newUser.id });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const updateUserDetails = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        const updateFields = {};
        const allowedFields = ['email', 'name', 'company_id', 'role_id', 'reportTo','department_id'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        // Prevent self-reporting
        if (updateFields.reportTo && updateFields.reportTo === user.id) {
            return res.status(400).json({ error: 'A user cannot report to themselves.' });
        }

        // **Step 1: Check if the user has subordinates**
        if (updateFields.role_id && updateFields.role_id !== user.role_id) {
            const subordinates = await User.findAll({
                where: { reportTo: user.id },
                attributes: ['id', 'name']
            });

            if (subordinates.length > 0) {
                return res.status(409).json({
                    message: "Role change aborted! This user has subordinates assigned. Please reassign them first.",
                    subordinates
                });
            }
        }

        // **Step 2: Proceed with the update if no subordinates**
        await user.update(updateFields);
        return res.json({ message: 'User details updated successfully', user });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getUserDetails = async (req, res) => {
    try {
      const userRole = await Role.findOne({
        where: { id: req.user.role },
        attributes: ['name'],
      });
  
      if (!userRole) {
        return res.status(400).json({ error: 'Invalid role assigned to the user' });
      }
  
      let company_id;
  
      if (userRole.name === 'System Super Admin') {
        company_id = req.body.company_id || req.query.company_id;
        if (!company_id) {
          return res.status(400).json({ error: 'Company ID is required for System Super Admin' });
        }
      } else {
        company_id = req.user.company;
      }
  
      console.log('Company Id while getting user is ' + company_id);
      let user;
      const whereCondition = { company_id };
  
      if (req.params.id) {
        user = await User.findOne({
          where: { id: req.params.id, ...whereCondition, is_active: true },
          attributes: { exclude: ['password_hash'] },
          include: [
            { model: Role },
            { model: Company },
            {
              model: User,
              as: 'Manager',
              attributes: ['id', 'name'],
              required: false, // <-- Ensures Super Admin is included even if no manager
            },
            {model:Department,
                as: 'department',
                attributes: ['id', 'name','description']

            }

          ],
        });
  
        if (!user) {
          return res.status(404).json({
            error: 'User not found or not associated with the provided company',
          });
        }
      } else {
        user = await User.findAll({
          where: { ...whereCondition, is_active: true },
          attributes: { exclude: ['password_hash'] },
          include: [
            { model: Role },
            { model: Company },
            {
              model: User,
              as: 'Manager',
              attributes: ['id', 'name'],
              required: false, // <-- Same here
            },
            {model:Department,
                as: 'department',
                attributes: ['id', 'name','description']

            }
          ],
          order: [['name', 'ASC']],
        });
      }
  
      res.json(user);
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };  

const getAssignableUsers = async (req, res) => {
    try {
        const assignerId = req.user.id;

        // Get the assigner's details including their role and company
        const assigner = await User.findByPk(assignerId, {
            include: [{ model: Role }, { model: Company }, {model:Department, as: 'department',
                attributes: ['id', 'name','description']

            }]
        });

        if (!assigner) {
            return res.status(404).json({ error: "Assigner not found" });
        }

        // Check if the assigner is a System Super Admin
        let targetCompanyId = assigner.company_id;
        if (assigner.Role.name === "System Super Admin") {
            targetCompanyId = req.body.company_id || req.query.company_id;
            if (!targetCompanyId) {
                return res.status(400).json({ error: "company_id is required for System Super Admin" });
            }
            
            // Fetch all users from the provided company without role filtering
            const users = await User.findAll({
                where: { company_id: targetCompanyId },
                attributes: { exclude: ['password_hash'] },
                include: [{ model: Role }, { model: Company }, {model:Department,as: 'department',
                    attributes: ['id', 'name','description']
    
                }],
                order: [['name', 'ASC']]
            });

            return res.json(users);
        }

        // Function to fetch all child roles recursively
        const getAllChildRoles = async (parentRoleId) => {
            const childRoles = await Role.findAll({
                where: { parent_role_id: parentRoleId },
                attributes: ['id']
            });

            if (childRoles.length === 0) return [];

            const childRoleIds = childRoles.map(role => role.id);
            const deeperRoles = await Promise.all(childRoleIds.map(getAllChildRoles));

            return [...childRoleIds, ...deeperRoles.flat()];
        };

        // Fetch all child roles for the assigner's role
        let allChildRoleIds = await getAllChildRoles(assigner.role_id);
        allChildRoleIds.push(assigner.role_id); // Include assigner's own role ID

        // Find assignable users within the same company who have any descendant roles OR the same role
        const users = await User.findAll({
            where: { 
                company_id: targetCompanyId,
                role_id: allChildRoleIds 
            },
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Role }, { model: Company }, {model:Department,as: 'department',
                attributes: ['id', 'name','description']

            }],
            order: [['name', 'ASC']]
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUsersWithHigherRole = async (req, res) => {
    try {
        const { role_id, company_id: reqCompanyId } = req.query;

        // Fetch role name from role_id in req.user
        const userRole = await Role.findOne({ where: { id: req.user.role }, attributes: ['name'] });

        if (!userRole) {
            return res.status(400).json({ error: 'Invalid user role. Please check your role ID.' });
        }
        let company_id;

        // Handle System Super Admin case with missing company_id
        if (userRole.name === 'System Super Admin') {
            
            if (!reqCompanyId) {
                return res.status(400).json({ error: 'Company ID is required for System Super Admin to fetch users.' });
            }
            company_id = reqCompanyId;
        } else {
            company_id = req.user.company;
        }

        if (!role_id) {
            return res.status(400).json({ error: 'Role ID is required to fetch higher-level users.' });
        }

        // Fetch parent role
        const parentRole = await Role.findOne({ where: { id: role_id }, attributes: ['parent_role_id'] });

        if (!parentRole) {
            return res.status(404).json({ error: 'The provided Role ID does not exist.' });
        }

        if (!parentRole.parent_role_id) {
            return res.status(404).json({ error: 'No higher role exists for the given Role ID.' });
        }

        // Fetch users with the higher role
        const users = await User.findAll({
            where: { role_id: parentRole.parent_role_id, company_id },
            attributes: ['id', 'name', 'email'],
            include: [{ model: Role }, { model: Company }, {model:Department,
                attributes: ['id', 'name','description'],as: 'department',

            }]
        });

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found with a higher role.' });
        }

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
    }
};

const softDeleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const currentUserId = req.user.id; // Assuming user ID is available in the request (e.g., from JWT)

        if (userIdToDelete === currentUserId.toString()) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const user = await User.scope('all').findByPk(userIdToDelete);

        if (!user || !user.is_active) {
            return res.status(404).json({ error: 'User not found or already deleted' });
        }

        user.is_active = false;
        await user.save();

        return res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Error soft deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default { createUser, updateUserDetails, getUserDetails ,getAssignableUsers ,getUsersWithHigherRole, softDeleteUser};




// const updateUserDetails = async (req, res) => {
//     try {
//         const user = await User.findByPk(req.params.id);

//         if (!user) return res.status(404).json({ error: 'User not found' });

//         // Extract fields dynamically from the request body
//         const updateFields = {};
//         const allowedFields = ['email', 'name', 'company_id', 'role_id', 'reportTo']; // Allowed fields for update

//         allowedFields.forEach(field => {
//             if (req.body[field] !== undefined) {
//                 updateFields[field] = req.body[field]; // Update only fields that exist in the request
//             }
//         });

//         if (Object.keys(updateFields).length === 0) {
//             return res.status(400).json({ error: 'No valid fields provided for update' });
//         }

//         // **Prevent self-reporting**
//         if (updateFields.reportTo && updateFields.reportTo === user.id) {
//             return res.status(400).json({ error: 'A user cannot report to themselves.' });
//         }

//         // **Prevent circular reporting (i.e., ensuring the "reportTo" user does not report back to the current user)**
//         // if (updateFields.reportTo) {
//         //     const reportingUser = await User.findByPk(updateFields.reportTo, { attributes: ['reportTo'] });

//         //     if (reportingUser && reportingUser.reportTo === user.id) {
//         //         return res.status(400).json({ error: 'Invalid reporting structure: Circular reporting detected.' });
//         //     }
//         // }

//         await user.update(updateFields);
//         res.json({ message: 'User details updated', user });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };



