import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Task from "./Task.js";
import User from "./User.js";

const Comment = sequelize.define("Comment", {
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
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: User, key: "id" }
    },
    comment_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

export default Comment;
