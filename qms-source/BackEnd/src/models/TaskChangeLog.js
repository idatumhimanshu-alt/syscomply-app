

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Task from "../models/Task.js";
import User from "./User.js"; 
import Role from "./Role.js";
import TaskAssignment from "./TaskAssignment.js"
import Notification from "./Notification.js"; // Import the Notification model
import { getSocket } from "../config/socket.js";
import { VALID_TASK_CHANGE_FIELDS } from "../config/constants.js"; // ✅ Import ENUM values

export const TaskChangeLog = sequelize.define("TaskChangeLog", {
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
    changed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: User, key: "id" }
    },
    field_changed: {
        type: DataTypes.ENUM(...VALID_TASK_CHANGE_FIELDS), // ✅ Use ENUM from constants.js
        allowNull: false
    },
    old_value: {
        type: DataTypes.STRING,
        allowNull: true
    },
    new_value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    changed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });



// ✅ Define relationships
TaskChangeLog.belongsTo(Task, { foreignKey: "task_id" });
TaskChangeLog.belongsTo(User, { foreignKey: "changed_by", as: "Changer" });

Task.hasMany(TaskChangeLog, { foreignKey: "task_id", onDelete: 'CASCADE' });
User.hasMany(TaskChangeLog, { foreignKey: "changed_by", as: "ChangesMade", onDelete: 'CASCADE' });




TaskChangeLog.afterCreate(async (log) => {
    try {
        console.log("🔥 TaskChangeLog entry detected:", log.dataValues);

        const io = getSocket();
        const { task_id, changed_by, field_changed, new_value, old_value } = log;

        let notifications = [];

        const task = await Task.findByPk(task_id, { attributes: ["Checklist_Item", "company_id"] });

        if (!task || !task.company_id) {
            console.log("❌ Task or Company not found:", task_id);
            return;
        }

        const company_id = task.company_id;

        const superAdmins = await User.findAll({
            include: { model: Role, where: { name: "Super Admin" }, attributes: [] },
            where: { company_id },
            attributes: ["id"]
        });
        const superAdminIds = superAdmins.map(user => user.id);

        const systemSuperAdmins = await User.findAll({
            include: { model: Role, where: { name: "System Super Admin" }, attributes: [] },
            attributes: ["id"]
        });
        const systemSuperAdminIds = new Set(systemSuperAdmins.map(user => user.id));

        const taskAssignments = await TaskAssignment.findAll({
            where: { task_id },
            attributes: ["user_ids", "assign_by"]
        });

        let assigneeIds = [];
        let assignerIds = new Set();

        taskAssignments.forEach(assignment => {
            assigneeIds.push(...assignment.user_ids);
            assignerIds.add(assignment.assign_by);
        });

        const taskCreator = await Task.findByPk(task_id, { attributes: ["createdBy"] });

        const recipients = new Set(superAdminIds);
        assigneeIds.forEach(userId => recipients.add(userId));
        assignerIds.forEach(userId => recipients.add(userId));
        if (taskCreator) recipients.add(taskCreator.createdBy);

        superAdminIds.forEach(userId => recipients.add(userId));
        systemSuperAdminIds.forEach(userId => recipients.delete(userId));
        recipients.delete(changed_by);

        if (recipients.size === 0) {
            console.log("⚠️ No recipients found for task:", task_id);
            return;
        }

        const taskName = task ? task.Checklist_Item : `Task ID: ${task_id}`;
        let message = `Task "${taskName}" updated: ${field_changed} changed from "${old_value}" to "${new_value}"`;

        if (field_changed === "assignment") {
            const oldAssignees = JSON.parse(old_value || "[]");
            const newAssignees = JSON.parse(new_value || "[]");

            const unassignedUsers = oldAssignees.filter(userId => !newAssignees.includes(userId));
            const newlyAssignedUsers = newAssignees.filter(userId => !oldAssignees.includes(userId));
            const remainedAssignedUsers = newAssignees.filter(userId => oldAssignees.includes(userId));

            superAdminIds.forEach(userId => recipients.add(userId));
            recipients.delete(changed_by);

            // 🔁 Create & Emit Notifications for assignment changes
            const emitStructured = (notification) => {
                io.to(notification.user_id).emit("new_notification", {
                    id: null,
                    user_id: notification.user_id,
                    task_id: notification.task_id,
                    type: notification.type,
                    message: notification.message,
                    is_seen: false,
                    created_at: new Date()
                });
            };

            newlyAssignedUsers.forEach(userId => {
                if (!systemSuperAdminIds.has(userId) && userId !== changed_by) {
                    const note = {
                        user_id: userId,
                        task_id,
                        type: field_changed,
                        message: `You have been assigned to task: ${task.Checklist_Item}`,
                        seen: false
                    };
                    notifications.push(note);
                    //emitStructured(note);
                }
            });

            unassignedUsers.forEach(userId => {
                if (!systemSuperAdminIds.has(userId) && userId !== changed_by) {
                    const note = {
                        user_id: userId,
                        task_id,
                        type: field_changed,
                        message: `You have been unassigned from task: ${task.Checklist_Item}`,
                        seen: false
                    };
                    notifications.push(note);
                    //emitStructured(note);
                }
            });

            if (newlyAssignedUsers.length > 0) {
                remainedAssignedUsers.forEach(userId => {
                    if (!systemSuperAdminIds.has(userId) && userId !== changed_by) {
                        const note = {
                            user_id: userId,
                            task_id,
                            type: field_changed,
                            message: `New user(s) assigned to task: ${task.Checklist_Item}`,
                            seen: false
                        };
                        notifications.push(note);
                      //  emitStructured(note);
                    }
                });
            }

            superAdminIds.forEach(userId => {
                if (userId !== changed_by && !newAssignees.includes(userId)) {
                    const note = {
                        user_id: userId,
                        task_id,
                        type: field_changed,
                        message: `Task assignment updated: ${task.Checklist_Item}`,
                        seen: false
                    };
                    notifications.push(note);
                    //emitStructured(note);
                }
            });

        } else {
            // 🔁 General Field Update Notifications
            notifications = Array.from(recipients).map(userId => ({
                user_id: userId,
                task_id,
                type: field_changed,
                message,
                seen: false
            }));

          


            // // Structured emit for general field change
            // notifications.forEach(note => {
            //     io.to(note.user_id).emit("new_notification", {
            //         id: null,
            //         user_id: note.user_id,
            //         task_id: note.task_id,
            //         type: note.type,
            //         message: note.message,
            //         is_seen: false,
            //         created_at: new Date()
            //     });
            // });
        }

      


        if (notifications.length > 0) {
         
            const createdNotifications = await Notification.bulkCreate(notifications, { returning: true });
            console.log("✅ Notifications created successfully:", createdNotifications.map(n => n.toJSON()));

            createdNotifications.forEach(notification => {
                io.to(notification.user_id).emit("new_notification", {
                    id: notification.id,
                    user_id: notification.user_id,
                    task_id: notification.task_id,
                    type: notification.type,
                    message: notification.message,
                    is_seen: notification.seen,
                    created_at: notification.createdAt
                });
            });
        }

    } catch (error) {
        console.error("❌ Error creating notification:", error);
    }
});

export default TaskChangeLog;
