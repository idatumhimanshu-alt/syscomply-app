import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import iteration from "./Iteration.js"
import Company from "./Company.js"; // Import Company model
import Iteration from "./Iteration.js";
import { VALID_STATUS_VALUES, VALID_PRIORITY_VALUES, VALID_TASK_TYPES, VALID_COMPLIANCE_VALUES,VALID_STANDARDS,VALID_TYPE_OF_FINDING } from "../config/constants.js";

const Task = sequelize.define("Task", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    Checklist_Item: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    standard: {
        type: DataTypes.ENUM(...VALID_STANDARDS),
        allowNull: false,
    },
    task_type: {
        type: DataTypes.ENUM(...VALID_TASK_TYPES),
        allowNull: true,
    },
    parent_task_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    clause_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    area: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    expected_artifact: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    actual_artifact: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    compliance: {
        type: DataTypes.ENUM(...VALID_COMPLIANCE_VALUES),
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM(...VALID_STATUS_VALUES),
        defaultValue: "Not Done",
    },
    priority: {
        type: DataTypes.ENUM(...VALID_PRIORITY_VALUES),
        allowNull: false,
        defaultValue: "Medium",
    },
     Type_of_Finding: {
        type: DataTypes.ENUM(...VALID_TYPE_OF_FINDING),
        allowNull: false,
        defaultValue: "Non-Compliance",
    },
    responsibility: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    RCA_Details : {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    auditee: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
    },
    company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Company,
            key: "id",
        },
        onDelete: "CASCADE", // Delete tasks if company is deleted
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    Planned_Completion_Date: {
        type: DataTypes.DATE,
       allowNull:true
    },
    Actual_Completion_Date: {
        type: DataTypes.DATE,
       allowNull:true
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    iteration_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: iteration, // table name in DB (not model name)
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
    
}, {
    timestamps: false,
    freezeTableName: true,
});

// Relationships
Task.belongsTo(User, { foreignKey: "createdBy", as: "Creator" });
User.hasMany(Task, { foreignKey: "createdBy", onDelete: 'SET NULL' });

Task.belongsTo(Company, { foreignKey: "company_id", as: "Company" });
Company.hasMany(Task, { foreignKey: "company_id", onDelete: 'CASACDE' });


// ✅ Many-to-Many Relationship for Assignees
Task.belongsToMany(User, { 
    through: "TaskAssignees", 
    as: "Assignees",  
    foreignKey: "task_id"
});
User.belongsToMany(Task, { 
    through: "TaskAssignees", 
    as: "AssignedTasks",  
    foreignKey: "user_id"
});


Task.belongsTo(Iteration, { foreignKey: 'iteration_id', as: 'Iteration' });


export default Task;

