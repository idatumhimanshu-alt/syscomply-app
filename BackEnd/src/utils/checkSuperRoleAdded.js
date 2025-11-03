import { v4 as uuidv4 } from 'uuid';
import Role from '../models/Role.js';

const ensureSuperAdminRole = async () => {
    try {
        // Check if "Super Admin" role exists
        const superAdminRole = await Role.findOne({ where: { name: "Super Admin" } });

        if (!superAdminRole) {
            // Create Super Admin role if it doesn't exist
            await Role.create({
                id: uuidv4(), // Generate unique ID
                name: "Super Admin",
                description: "This is Super Admin and he is responsible for all tasks related to the company. He is the point of contact."
            });

            console.log("✅ Super Admin role created successfully.");
        } else {
            console.log("✅ Super Admin role already exists.");
        }
    } catch (error) {
        console.error("❌ Error ensuring Super Admin role:", error.message);
    }
};

export default ensureSuperAdminRole;
