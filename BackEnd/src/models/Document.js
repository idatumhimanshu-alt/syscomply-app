import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Task from "./Task.js";  // Import Task model
import User from "./User.js";  // Import User model


const Document = sequelize.define("Document", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: Task, key: "id" }  // Task model is now imported
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: User, key: "id" }  // User model is now imported
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    remark: {
        type: DataTypes.STRING,
        allowNull: true
    },
    uploaded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    issue_date: {
        type: DataTypes.DATE,
        allowNull: true  
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, { timestamps: false });

Document.belongsTo(User, { foreignKey: "user_id", as: "uploader" });


// Document.afterCreate(async (doc) => {
//     try {
//         console.log("📂 New document uploaded:", doc.dataValues);

//         const io = getSocket();
//         const { task_id, user_id, file_name } = doc;

//         // ✅ Fetch task details
//         const task = await Task.findByPk(task_id, { attributes: ["name", "company_id", "createdBy"] });

//         if (!task || !task.company_id) {
//             console.log("❌ Task or Company not found for document:", task_id);
//             return;
//         }

//         const company_id = task.company_id;

//         // ✅ Get Super Admins of the same company
//         const superAdmins = await User.findAll({
//             include: { model: Role, where: { name: "Super Admin" }, attributes: [] },
//             where: { company_id },
//             attributes: ["id"]
//         });

//         const superAdminIds = superAdmins.map(user => user.id);

//         // ✅ Get System Super Admins (to be excluded)
//         const systemSuperAdmins = await User.findAll({
//             include: { model: Role, where: { name: "System Super Admin" }, attributes: [] },
//             attributes: ["id"]
//         });

//         const systemSuperAdminIds = new Set(systemSuperAdmins.map(user => user.id));

//         // ✅ Get Assignees & Assigners
//         const taskAssignments = await TaskAssignment.findAll({
//             where: { task_id },
//             attributes: ["user_ids", "assign_by"]
//         });

//         let assigneeIds = [];
//         let assignerIds = new Set();

//         taskAssignments.forEach(assignment => {
//             assigneeIds.push(...assignment.user_ids);
//             assignerIds.add(assignment.assign_by);
//         });

//         // ✅ Get Task Creator
//         const taskCreatorId = task.createdBy;

//         console.log(`Super Admins: ${superAdminIds}`);
//         console.log(`System Super Admins (excluded): ${Array.from(systemSuperAdminIds)}`);

//         // ✅ Recipients (Super Admins, Assignees, Assigners, Task Creator)
//         const recipients = new Set([...superAdminIds, ...assigneeIds, ...assignerIds, taskCreatorId]);

//         // ✅ Remove uploader and System Super Admins from notifications
//         recipients.delete(user_id);
//         systemSuperAdminIds.forEach((sysAdminId) => recipients.delete(sysAdminId));

//         if (recipients.size === 0) {
//             console.log("⚠️ No recipients found for document upload in task:", task_id);
//             return;
//         }

//         // ✅ Notification message
//         const taskName = task.name || `Task ID: ${task_id}`;
//         const message = `New document "${file_name}" uploaded for task: ${taskName}`;

//         // ✅ Create notifications
//         const notifications = Array.from(recipients).map(userId => ({
//             user_id: userId,
//             task_id,
//             type: "document_upload",
//             message,
//             seen: false
//         }));

//         // ✅ Save notifications to DB
//         if (notifications.length > 0) {
//             // 🔁 Create notifications
//             const createdNotifications = await Notification.bulkCreate(notifications, { returning: true });
        
//             console.log("✅ Notifications created successfully:", createdNotifications.map(n => n.toJSON()));
        
//             // 🔁 Emit each full notification individually
//             createdNotifications.forEach(notification => {
//                 io.to(notification.user_id).emit("new_notification", {
//                     id: notification.id,
//                     user_id: notification.user_id,
//                     task_id: notification.task_id,
//                     type: notification.type,
//                     message: notification.message,
//                     is_seen: notification.seen, // assuming your DB column is `seen`, but frontend expects `is_seen`
//                     created_at: notification.createdAt
//                 });
//             });
//         }
        

//     } catch (error) {
//         console.error("❌ Error creating document upload notification:", error);
//     }
// });


export default Document;

