import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

// Load environment variables
config();

const SECRET_KEY = process.env.JWT_SECRET; // Use env variable

export const authenticateUser = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract Bearer token

    if (!token) {
        return res.status(403).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Attach user details to request
        console.log(`User details: ${JSON.stringify(decoded, null, 2)}`);

        next();
    } catch (error) {
        console.log('error while extracting token '+error);
        return res.status(401).json({ error: error });
    }
};
 export default authenticateUser;