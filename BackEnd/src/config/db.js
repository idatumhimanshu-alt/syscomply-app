import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

// Load environment variables
config();

// Use DATABASE_URL if available (Replit), otherwise use individual env vars
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
    console.log('Database Configuration: Using DATABASE_URL (PostgreSQL)');
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: false
        },
        logging: console.log, // Optional: Logs SQL queries
    });
} else {
    console.log('Database Configuration:', {
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        host: process.env.DB_HOST
    });
    
    sequelize = new Sequelize(
        process.env.DB_NAME || 'qms_db',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASS || 'password',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: console.log,
        }
    );
}

await sequelize.sync({ force: false, hooks: true });

sequelize.authenticate()
    .then(() => console.log('✅ Database connected successfully'))
    .catch(err => console.error('❌ Database connection error:', err));

export default sequelize;
