import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    industry: {
        type: DataTypes.STRING,
        allowNull: true
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    freezeTableName: true,
    defaultScope: {
        where: {
            is_active: true
        }
    },
    scopes: {
        all: { where: {} } // to include both active and inactive when needed
    }
});

export default Company;
