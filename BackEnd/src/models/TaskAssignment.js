import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Task from "./Task.js";
import User from "./User.js";

const TaskAssignment = sequelize.define("TaskAssignment", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: Task, key: "id" }
    },
    user_ids: {  // Changed from `user_id` to `user_ids`
        type: DataTypes.JSON,  // Store multiple user IDs in an array
        allowNull: false
    },
    assign_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: User, key: "id" }
    },
    assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

// ✅ Define relationships
TaskAssignment.belongsTo(Task, { foreignKey: "task_id" });
TaskAssignment.belongsTo(User, { foreignKey: "assign_by", as: "Assigner" });
//TaskAssignment.belongsTo(User, { foreignKey: "user_id", as: "Assignees" });  


Task.hasMany(TaskAssignment, { foreignKey: "task_id", onDelete: 'CASCADE' });
User.hasMany(TaskAssignment, { foreignKey: "assign_by", as: "AssignedBy", onDelete: 'CASCADE' });

export default TaskAssignment;