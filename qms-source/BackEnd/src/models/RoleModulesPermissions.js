import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Role from './Role.js';
import Module from './Module.js';

const RoleModulePermission = sequelize.define('Role_Module_Permission', {
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Role',
            key: 'id'
        }
    },
    module_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Module',
            key: 'id'
        }
    },
    can_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    can_write: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    can_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: false
});

// Define relationships
RoleModulePermission.belongsTo(Role, { foreignKey: 'role_id', targetKey: 'id' })
Role.hasMany(RoleModulePermission, { foreignKey: 'role_id', onDelete: 'CASCADE' });

RoleModulePermission.belongsTo(Module, { foreignKey: 'module_id', targetKey: 'id' })
Module.hasMany(RoleModulePermission, { foreignKey: 'module_id', onDelete: 'CASCADE' });

export default RoleModulePermission;
