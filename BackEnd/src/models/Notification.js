import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Task from "./Task.js";

const Notification = sequelize.define("Notification", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: "id" } },
    task_id: { type: DataTypes.UUID, allowNull: false, references: { model: Task, key: "id" } },
    type: { type: DataTypes.ENUM("status", "priority", "assignment","document","task"), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

Notification.belongsTo(User, { foreignKey: "user_id" });
Notification.belongsTo(Task, { foreignKey: "task_id" });

export default Notification;
