import TaskChangeLog from "../models/TaskChangeLog.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import { Op } from "sequelize";

export const getTaskChangeLogs = async (req, res) => {
    try {
        const { task_id } = req.params;

        // Fetch change logs for the given task_id, including user details
        const changeLogs = await TaskChangeLog.findAll({
            where: { task_id },
            include: [
                { model: User.scope('all'), as: "Changer", attributes: ["id", "name", "email"] }, // User who made the change
                { model: Task, attributes: ["id", "Checklist_Item"] } // Task details
            ],
            order: [["changed_at", "DESC"]] // Show latest changes first
        });

        // Enhance details for assignment changes
        const formattedLogs = await Promise.all(changeLogs.map(async (log) => {
            let detailedOldValue = log.old_value;
            let detailedNewValue = log.new_value;

            if (log.field_changed === "assignment") {
                try {
                    const oldUserIds = JSON.parse(log.old_value || "[]");
                    const newUserIds = JSON.parse(log.new_value || "[]");

                    // Fetch user details for old and new assignees
                    const oldUsers = await User.findAll({
                        where: { id: { [Op.in]: oldUserIds } },
                        attributes: ["id", "name", "email"]
                    });

                    const newUsers = await User.findAll({
                        where: { id: { [Op.in]: newUserIds } },
                        attributes: ["id", "name", "email"]
                    });

                    detailedOldValue = oldUsers.map(user => ({ id: user.id, name: user.name, email: user.email }));
                    detailedNewValue = newUsers.map(user => ({ id: user.id, name: user.name, email: user.email }));
                } catch (parseError) {
                    console.error("Error parsing assignment values:", parseError);
                }
            }

            return {
                id: log.id,
                task_id: log.task_id,
                task_name: log.Task?.Checklist_Item  || "Unknown Task",
                changed_by: log.Changer ? { id: log.Changer.id, name: log.Changer.name, email: log.Changer.email } : null,
                field_changed: log.field_changed,
                old_value: detailedOldValue,
                new_value: detailedNewValue,
                changed_at: log.changed_at
            };
        }));

        res.json(formattedLogs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default{getTaskChangeLogs};