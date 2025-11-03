import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import generateRandomPassword from '../utils/generateRandomPassword.js';
import sendEmail from '../utils/sendEmail.js';
import Company from '../models/Company.js';

import { config } from 'dotenv';

// Load environment variables
config();

const SECRET_KEY = process.env.JWT_SECRET; // Use env variable

// 🟢 Login API

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            where: {
                email
            },
            include: {
                model: Company.scope('all'),
                attributes: ['is_active'],
                required: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: "User not found. Please check your email." });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: "User is deactivated. Please contact admin." });
        }

        if (!user.Company?.is_active) {
            return res.status(403).json({ error: "Company is deactivated. Please contact admin." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password. Please try again." });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role_id,
                company: user.company_id
            },
            SECRET_KEY,
            { expiresIn: '1d' }
        );

        res.status(200).json({ message: "Login successful", token });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
};



// 🔴 Logout API (Client-side should delete the token)
export const logout = async (req, res) => {
    try {
        // No need to invalidate token on backend (handled on client-side)
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
};


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate a new password
        const newPassword = generateRandomPassword();
        console.log("New password while forgot is "+newPassword);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await user.update({ password_hash: hashedPassword });

        // Send email with new password
        const subject = 'Password Reset - Your New Credentials';
        const message = `
            Hello ${user.name},
            \nYour password has been reset. Below are your new login credentials:\n
            Email: ${email}
            Password: ${newPassword}
            \nPlease change your password after logging in.\n
            Regards,
            Your Team
        `;

        await sendEmail(email, subject, message);

        res.status(200).json({ message: 'New password sent to your email' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const changePassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        if (!email || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Email, old password, and new password are required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Old password is incorrect' });
        }

        // Hash new password and update it
       const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password_hash: hashedNewPassword });

        res.status(200).json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};