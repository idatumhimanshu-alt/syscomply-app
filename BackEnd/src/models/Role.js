import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Company from "./Company.js"; // Import the Company model

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parent_role_id: {
      // Self-referential hierarchy
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "Role",
        key: "id",
      },
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Company",
        key: "id",
      },
      onDelete: "CASCADE", // Ensures roles are deleted when the company is removed
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

// Define self-referential relationship
Role.belongsTo(Role, { as: "ParentRole", foreignKey: "parent_role_id" });
Role.hasMany(Role, { as: "ChildRoles", foreignKey: "parent_role_id" });

// Associate Role with Company
Role.belongsTo(Company, { foreignKey: "company_id" });
Company.hasMany(Role, { foreignKey: "company_id", onDelete: 'CASCADE' });

export default Role;



// import { DataTypes } from 'sequelize';
// import sequelize from '../config/db.js';


// const Role = sequelize.define('Role', {
//     id: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true
//     },
//     name: {
//         type: DataTypes.STRING,
//         allowNull: false
//     },
//     description: {
//         type: DataTypes.TEXT,
//         allowNull: true
//     }
// }, {
//     timestamps: true,
//     freezeTableName: true    // Prevent pluralization of table name
// });




//export default Role;
