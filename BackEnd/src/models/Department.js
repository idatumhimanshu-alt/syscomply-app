import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Department = sequelize.define('Department', {
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
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'department',
  timestamps: true,
  underscored: true
});

export default Department;
