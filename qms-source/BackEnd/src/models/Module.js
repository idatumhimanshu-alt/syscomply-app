import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Module = sequelize.define('Module', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    freezeTableName: true    // Prevent pluralization of table name
});

export default Module;
