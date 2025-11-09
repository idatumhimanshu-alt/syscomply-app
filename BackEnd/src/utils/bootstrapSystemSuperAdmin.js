export const defaultCompanyName = 'IDATUM';

import sequelize from '../config/db.js';
import Company from '../models/Company.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Module from '../models/Module.js';
import Role_Module_Permissions from '../models/RoleModulesPermissions.js';
import bcrypt from 'bcryptjs'; // CORRECTED: Changed from 'bcrypt' to 'bcryptjs'
import { v4 as uuidv4 } from 'uuid';

const bootstrapSystemSuperAdmin = async () => {
    try {
        // Step 1: ADDED - Ensure modules exist (idempotent)
        const existingModules = await Module.findAll();

        if (existingModules.length === 0) {
            await sequelize.query(`
                INSERT INTO "Module" (id, name, description, "createdAt", "updatedAt") VALUES 
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

        // Step 2: Ensure IDATUM company exists
        let company = await Company.findOne({ where: { name: 'IDATUM' } });
        if (!company) {
            company = await Company.create({
                id: uuidv4(),
                name: 'IDATUM',
                industry: 'Software',
                domain: 'idatum.com',
                is_active: true
            });
            console.log('✅ Default company created.');
        } else {
            console.log('ℹ️ Default company already exists.');
        }

        // Step 3: Ensure System Super Admin role exists for this company
        let role = await Role.findOne({ where: { name: 'System Super Admin', company_id: company.id } });
        if (!role) {
            role = await Role.create({
                id: uuidv4(),
                name: 'System Super Admin',
                company_id: company.id
            });
            console.log('✅ System Super Admin role created.');
        } else {
            console.log('ℹ️ System Super Admin role already exists.');
        }

        // Step 4: Ensure the admin user exists
        let user = await User.findOne({ where: { email: 'admin@idatum.com' } });
        if (!user) {
            const password_hash = await bcrypt.hash('Admin@123', 10);
            user = await User.create({
                id: uuidv4(),
                company_id: company.id,
                email: 'admin@idatum.com',
                name: 'System Super Admin',
                role_id: role.id,
                password_hash: password_hash,
                is_active: true
            });
            console.log('✅ System Super Admin user created successfully.');
            console.log('Credentials: admin@idatum.com / Admin@123');
        } else {
            console.log('ℹ️ System Super Admin user already exists.');
        }

        // Step 5: Grant all permissions to this role
        const modules = await Module.findAll();
        for (const module of modules) {
            await Role_Module_Permissions.findOrCreate({
                where: {
                    role_id: role.id,
                    module_id: module.id
                },
                defaults: {
                    can_read: true,
                    can_write: true,
                    can_delete: true
                }
            });
        }
        console.log('✅ System Super Admin permissions synced.');

    } catch (error) {
        console.error('❌ Error during system bootstrap:', error);
    }
};

export default bootstrapSystemSuperAdmin;
