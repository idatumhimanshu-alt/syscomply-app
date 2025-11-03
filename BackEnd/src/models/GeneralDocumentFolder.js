// models/GeneralDocumentFolder.js
import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";
import User from './User.js';

const GeneralDocumentFolder = sequelize.define('GeneralDocumentFolder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  parent_folder_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  folder_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  visibility_scope: {
    type: DataTypes.ENUM('all', 'above', 'below', 'specific', 'private'),
    allowNull: false
  },
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'general_document_folder',
  timestamps: true,
  paranoid: true,
  deletedAt: 'deleted_at'
});




export default GeneralDocumentFolder;
