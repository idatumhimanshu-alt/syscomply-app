import Company from "../models/Company.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import sequelize from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';
import Role from '../models/Role.js';
import Module from '../models/Module.js';
import RoleModulePermission from '../models/RoleModulesPermissions.js';
import generateRandomPassword from '../utils/generateRandomPassword.js';
import sendEmail from '../utils/sendEmail.js';
import { Op } from 'sequelize';

import{defaultCompanyName} from '../utils/bootstrapSystemSuperAdmin.js'

import userController from '../controllers/userController.js';

const defaultCompany = defaultCompanyName
export const createCompany = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { name, email, adminName } = req.body;
        if (!name || !email || !adminName) {
            await transaction.rollback();
            return res.status(400).json({ error: "Company name, admin email, and admin name are required" });
        }

        // 🚫 Check for existing ACTIVE user with same email
        const existingActiveUser = await User.findOne({
            where: {
                email,
                is_active: true
            }
        });

        if (existingActiveUser) {
            await transaction.rollback();
            return res.status(409).json({
                error: "An active user already exists with this email. Please use a different admin email."
            });
        }

        // Continue with creation
        const companyId = uuidv4();

        const company = await Company.create(
            { id: companyId, name },
            { transaction }
        );

        let superAdminRole = await Role.findOne({
            where: { name: "Super Admin", company_id: companyId },
            transaction
        });

        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: "Super Admin",
                company_id: companyId,
                description: "The Super Admin role is responsible for all events within the company."
            }, { transaction });
        }

        const role_id = superAdminRole.id;

        const generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        console.log("Attempting to create User with:", {
            email, adminName, companyId, role_id, generatedPassword
        });

        const newUser = await User.create({
            email,
            name: adminName,
            company_id: companyId,
            role_id,
            password_hash: hashedPassword
        }, { transaction });

        console.log("✅ User successfully created:", newUser);

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

        const modules = await Module.findAll({ transaction });
        if (!modules.length) {
            throw new Error("No modules found. Please check the Modules table.");
        }

        for (const module of modules) {
            await RoleModulePermission.create({
                role_id: superAdminRole.id,
                module_id: module.id,
                can_read: true,
                can_write: true,
                can_delete: true
            }, { transaction });
        }

        await transaction.commit();

        return res.status(201).json({
            message: "Company created successfully with Super Admin",
            companyId: company.id,
            superAdminEmail: email
        });
    } catch (error) {
        await transaction.rollback();

        console.error("❌ Error in createCompany:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        }
    }
};



const updateCompanyDetails = async (req, res) => {
    try {
        const { name, industry, domain } = req.body;
        const { id } = req.params;

        const company = await Company.findOne({
            where: {
                id,
                is_active: true
            }
        });
        if (!company) return res.status(404).json({ error: "Company not found" });

        // Update only provided fields
        const updatedData = {};
      
        if (name !== undefined) updatedData.name = name;
        if (industry !== undefined) updatedData.industry = industry;
        if (domain !== undefined) updatedData.domain = domain;

        await company.update(updatedData);

        res.json({ message: "Company details updated successfully", company });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getCompanyDetails = async (req, res) => {
    try {
        let company;
        if (req.params.id) {
            company = await Company.findOne({
                where: {
                    id: req.params.id,
                    is_active: true
                }
            });
            if (!company) return res.status(404).json({ error: 'Company not found' });
        } else {
            company = await Company.findAll({
                where: {
                    is_active: true,
                    name: { [Op.ne]: defaultCompany }
                },
                order: [['name', 'ASC']]
            });
        }
        
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};





const softDeleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmed } = req.body;

   

        // Fetch the role name using role_id
        const role = await Role.findByPk(req.user.role);
        console.log(`role of user going to delete Company is ${role.name}`);
        if (!role || role.name !== 'System Super Admin') {
            return res.status(403).json({ error: 'Only System Super Admin can delete companies' });
        }

        const company = await Company.scope('all').findByPk(id);

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        if (company.is_active === false) {
            return res.status(400).json({ error: "Company is already deactivated" });
        }

        // Double confirmation required
        if (!confirmed) {
            return res.status(400).json({ 
                error: "Please confirm deletion by sending { confirmed: true } in request body" 
            });
        }

        company.is_active = false;
        await company.save();

               // Deactivate all users in this company
               await User.update({ is_active: false }, {
                where: { company_id: company.id }
            });
    
            res.json({ message: "Company and associated users deactivated successfully." });

        

    } catch (error) {
        console.error("❌ Error soft deleting company:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export default { createCompany, updateCompanyDetails, getCompanyDetails, softDeleteCompany };