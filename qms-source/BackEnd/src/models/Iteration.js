// models/iteration.model.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Company from './Company.js';
import User from './User.js'; 
import Task from './Task.js';

const Iteration = sequelize.define('Iteration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Company',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  creator_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_excel_uploaded:{
    type: DataTypes.BOOLEAN,
    defaultValue:false,
  }
}, {
  tableName: 'iteration',
  timestamps: true,              // Enables createdAt, updatedAt
  underscored: true              // Converts to created_at, updated_at
});

// Associations
Company.hasMany(Iteration, { foreignKey: 'company_id' });
Iteration.belongsTo(Company, { foreignKey: 'company_id' });

User.hasMany(Iteration, { foreignKey: 'creator_id' });
Iteration.belongsTo(User, { foreignKey: 'creator_id' });
export default Iteration;
