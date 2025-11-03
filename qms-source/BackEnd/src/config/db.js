import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('Database Configuration:', {
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST
});

const sequelize = new Sequelize(
    process.env.DB_NAME || 'ISOAudit_db',
    process.env.DB_USER || 'bonaventure',
    process.env.DB_PASS || 'bona12345#',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: console.log, // Optional: Logs SQL queries
        timezone: '+05:30'
    }
);

await sequelize.sync({ force: false, hooks: true });


sequelize.authenticate()
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Error: ' + err));

export default sequelize;
