import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcryptjs';
import Company from './Company.js';
import Role from './Role.js';
import Department from './Department.js';
import GeneralDocument from './GeneralDocument.js';
import GeneralDocumentFolder from './GeneralDocumentFolder.js';


const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Company',
            key: 'id'
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Role',
            key: 'id'
        }
    },
    reportTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'User',
            key: 'id'
        }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    department_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'department',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      
}, {
    timestamps: true,
    freezeTableName: true,
    defaultScope: {
        where: {
            is_active: true
        }
    },
    scopes: {
        all: {} // Use `User.scope('all')` to get both active & inactive users
    }
}

);

// Password is already hashed in bootstrapSystemSuperAdmin.js and authController.js
User.beforeCreate(async (user) => {
    // Skip hashing as it's already hashed
});

// Define relationships
User.belongsTo(Company, { foreignKey: 'company_id', targetKey: 'id' });
Company.hasMany(User, { foreignKey: 'company_id', onDelete: 'CASCADE' });

User.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsTo(User, { as: 'Manager', foreignKey: 'reportTo' });
User.hasMany(User, { as: 'Subordinates', foreignKey: 'reportTo' });  

User.belongsTo(Department, { as: 'department', foreignKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });

export default User;

