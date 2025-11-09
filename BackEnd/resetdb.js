import { Sequelize } from 'sequelize';
// We are hardcoding the values to avoid any .env file issues.

const sequelize = new Sequelize('syscomplydb', 'postgres', 'Xyzzyspoon!1', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432,
    logging: false
});

async function resetDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
        
        console.log('⏳ Dropping public schema...');
        await sequelize.query('DROP SCHEMA public CASCADE;');
        
        console.log('⏳ Creating public schema...');
        await sequelize.query('CREATE SCHEMA public;');
        
        console.log('✅ Database has been reset successfully.');
    } catch (error) {
        console.error('❌ Unable to reset the database:', error.message);
    } finally {
        await sequelize.close();
    }
}

resetDatabase();
