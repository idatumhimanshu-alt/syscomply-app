
import sequelize from '../config/db.js';

import Company from '../models/Company.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Module from '../models/Module.js';
import RoleModulePermission from '../models/RoleModulesPermissions.js';
import generateRandomPassword from '../utils/generateRandomPassword.js';
import sendEmail from './sendEmail.js'; // Make sure this exists
import bcrypt from 'bcryptjs';

// Configuration with fixed credentials
export const defaultCompanyName = 'IDATUM';
const defaultAdminEmail = 'admin@idatum.com';
const defaultAdminName = 'System Admin';
const defaultAdminPassword = 'Admin@123'; // Fixed password

const bootstrapSystemSuperAdmin = async () => {
    try {
        // Step 1: Check if already initialized
        const existingCompany = await Company.findOne({ where: { name: defaultCompanyName } });
        if (existingCompany) {
            console.log('✅ System already initialized.');
            return;
        }

        // Step 2: Create Default Company
        const defaultCompany = await Company.create({
            name: defaultCompanyName,
            industry: 'Technology',
            domain: 'Quality Management',
            is_active: true,
        });

        // Step 3: Create System Super Admin Role
        const superAdminRole = await Role.create({
            name: 'System Super Admin',
            company_id: defaultCompany.id,
        });

        // Step 4: Hash the fixed password
        console.log('System Super Admin Credentials:');
        console.log(`Email: ${defaultAdminEmail}`);
        console.log(`Password: ${defaultAdminPassword}`);
        const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

        // Step 5: Create Super Admin User
        const superAdminUser = await User.create({
            name: defaultAdminName,
            email: defaultAdminEmail,
            company_id: defaultCompany.id,
            role_id: superAdminRole.id,
            password_hash: hashedPassword,
            is_active: true,
        });

       
              // Step 5.5: Insert Hardcoded Modules (Only if table is empty)
const existingModules = await Module.findAll();

if (existingModules.length === 0) {
    await sequelize.query(`
        INSERT INTO Module (id, name, description, createdAt, updatedAt) VALUES 
        ('1f0f190d-3a83-421c-af98-5d081100230e','Task','This is Task Module','2025-02-24 17:06:52','2025-02-24 17:06:52'),
        ('2566950b-1718-4440-8b8d-d5ec94624d0f','TaskChangeLog','This is TaskChangeLog Module','2025-02-24 17:37:38','2025-02-24 17:37:38'),
        ('2f06d3b2-9121-4a2b-a5fe-7f1e4aae7270','Permissions','This is Permissions Module','2025-02-24 17:29:25','2025-02-24 17:29:25'),
        ('4a060652-4c92-47d8-9515-e500da5e94ef','Dashboard','This is Dashboard Module','2025-02-15 11:18:11','2025-02-28 16:39:32'),
        ('5d896834-fedd-4e0b-a882-8d05396fc346','Company','This is company Module','2025-02-14 11:41:01','2025-02-14 11:41:01'),
        ('71ecaf10-9967-43eb-928e-11a7c810b591','Comment','This is Comment Module','2025-02-24 17:31:12','2025-02-24 17:31:12'),
        ('8530da98-7369-4ab7-9400-37cf4019e148','TaskAssignment','This is TaskAssignment Module','2025-02-24 17:30:15','2025-02-24 17:30:15'),
        ('881fc061-b852-4a9b-a430-ea96ba99194d','Module','This is Module','2025-02-24 17:28:35','2025-02-24 17:28:35'),
        ('971a88b8-461e-4cd2-9a06-fce42ad6b806','Role','This is Role Module updated','2025-02-14 11:42:03','2025-02-18 12:13:47'),
        ('bd168912-e40c-48e3-b3d1-440a3e129d52','User','This is User Module','2025-02-14 11:41:32','2025-02-14 11:41:32'),
        ('cb5010bc-83fd-4409-9845-bbba4ceda9c8','Document','This is Document Module','2025-02-24 17:36:56','2025-02-24 17:36:56');
    `);
    console.log('✅ Modules table inserted with predefined data.');
} else {
    console.log('ℹ️ Modules already present. Skipping insert.');
}

             // Step 6: Assign Full Permissions for All Modules to the Role
              const modules = await Module.findAll();
        const permissionPromises = modules.map((module) =>
            RoleModulePermission.create({
                role_id: superAdminRole.id,
                module_id: module.id,
                can_read: true,
                can_write: true,
                can_delete: true
            })
        );

        await Promise.all(permissionPromises);

        // Step 7: Send Email with Login Credentials
        const subject = 'Welcome - System Super Admin Account Created';
        const message = `
Hello ${superAdminUser.name},

Your System Super Admin account has been created successfully.

Login Credentials:
Email: ${superAdminUser.email}
Password: ${defaultAdminPassword}

Please log in and change your password if needed.

Regards,
System Setup Team
`;

        await sendEmail(superAdminUser.email, subject, message);

        console.log('✅ System Super Admin setup complete.');

    } catch (error) {
        console.error('❌ Error during system bootstrap:', error);
    }
};

export default bootstrapSystemSuperAdmin;
