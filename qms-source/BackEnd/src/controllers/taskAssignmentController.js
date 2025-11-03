import TaskAssignment from "../models/TaskAssignment.js";
import { Op } from "sequelize";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Task from "../models/Task.js";
import TaskChangeLog from "../models/TaskChangeLog.js";
import { Sequelize } from 'sequelize';
import { getAllReportToUsers } from "../utils/getHigherRoleUserRecurcievly.js";



export const assignTasks = async (req, res) => {
    try {
        const { assignments, user_id, task_ids } = req.body;
        const assign_by = req.user.id;

        if (!assignments && (!user_id || !Array.isArray(task_ids) || task_ids.length === 0)) {
            return res.status(400).json({ error: "Either provide assignments or user_id with task_ids." });
        }

        const taskAssignments = [];

        // ✅ Scenario 1: Bulk assignment { task_id, user_ids[] }
        if (Array.isArray(assignments) && assignments.length > 0) {
            for (const { task_id, user_ids } of assignments) {
                if (!task_id || !Array.isArray(user_ids) || user_ids.length === 0) {
                    return res.status(400).json({ error: "Each assignment must include a valid task_id and a non-empty user_ids array." });
                }

                // 🧠 Build complete user list including managers
                let allUserIds = [...user_ids];
                for (const uid of user_ids) {
                    const hierarchy = await getAllReportToUsers(uid);
                    allUserIds.push(...hierarchy);
                }
                const uniqueUsers = [...new Set(allUserIds)];

                const existingAssignment = await TaskAssignment.findOne({ where: { task_id } });
                const previousUsers = existingAssignment ? existingAssignment.user_ids || [] : [];

                if (existingAssignment) {
                    await existingAssignment.update({ user_ids: uniqueUsers });
                } else {
                    await TaskAssignment.create({
                        task_id,
                        user_ids: uniqueUsers,
                        assign_by,
                    });
                }

                // 📝 Log the change
                await TaskChangeLog.create({
                    task_id,
                    changed_by: assign_by,
                    field_changed: "assignment",
                    old_value: JSON.stringify(previousUsers),
                    new_value: JSON.stringify(uniqueUsers)
                });

                taskAssignments.push({ task_id, user_ids: uniqueUsers });
            }
        }

        // ✅ Scenario 2: Single user to multiple tasks
        else if (user_id && Array.isArray(task_ids)) {
            // 🧠 Resolve full hierarchy once
            let allUserIds = [user_id, ...(await getAllReportToUsers(user_id))];
            const uniqueUsers = [...new Set(allUserIds)];

            for (const task_id of task_ids) {
                const existingAssignment = await TaskAssignment.findOne({ where: { task_id } });
                const previousUsers = existingAssignment ? existingAssignment.user_ids || [] : [];

                if (existingAssignment) {
                    await existingAssignment.update({ user_ids: uniqueUsers });
                } else {
                    await TaskAssignment.create({
                        task_id,
                        user_ids: uniqueUsers,
                        assign_by,
                    });
                }

                await TaskChangeLog.create({
                    task_id,
                    changed_by: assign_by,
                    field_changed: "assignment",
                    old_value: JSON.stringify(previousUsers),
                    new_value: JSON.stringify(uniqueUsers)
                });

                taskAssignments.push({ task_id, user_ids: uniqueUsers });
            }
        }

        res.status(201).json({ message: "Tasks assigned successfully", taskAssignments });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




// export const assignTasks = async (req, res) => {
//     try {
//         const { assignments, user_id, task_ids } = req.body;
//         const assign_by = req.user.id;

//         if (!assignments && (!user_id || !Array.isArray(task_ids) || task_ids.length === 0)) {
//             return res.status(400).json({ error: "Either provide assignments or user_id with task_ids." });
//         }

//         const taskAssignments = [];

//         // 🟢 **Scenario 1: Assign multiple users to tasks (Bulk Assignment)**
//         if (Array.isArray(assignments) && assignments.length > 0) {
//             for (const { task_id, user_ids } of assignments) {
//                 if (!task_id || !Array.isArray(user_ids) || user_ids.length === 0) {
//                     return res.status(400).json({ error: "Each assignment must include a valid task_id and a non-empty user_ids array." });
//                 }

//                 let taskAssignment = await TaskAssignment.findOne({ where: { task_id } });

//                 if (!taskAssignment) {
//                     // Create a new task assignment
//                     taskAssignment = await TaskAssignment.create({ task_id, user_ids: [...new Set(user_ids)], assign_by });

//                     // ✅ Log new assignment
//                     await TaskChangeLog.create({
//                         task_id,
//                         changed_by: assign_by,
//                         field_changed: "assignment",
//                         old_value: null,
//                         new_value: JSON.stringify([...new Set(user_ids)])
//                     });
//                 } else {
//                     // const previousUsers = taskAssignment.user_ids || [];
//                     // const uniqueUsers = [...new Set([...previousUsers, ...user_ids])]; // Remove duplicates
//                     const previousUsers = taskAssignment.user_ids || [];
//                     const uniqueUsers = [...new Set(user_ids)]; 

//                     if (JSON.stringify(previousUsers.sort()) !== JSON.stringify(uniqueUsers.sort())) {
//                         await taskAssignment.update({ user_ids: uniqueUsers });

//                         // ✅ Log the update
//                         await TaskChangeLog.create({
//                             task_id,
//                             changed_by: assign_by,
//                             field_changed: "assignment",
//                             old_value: JSON.stringify(previousUsers),
//                             new_value: JSON.stringify(uniqueUsers)
//                         });
//                     }
//                 }

//                 taskAssignments.push(taskAssignment);
//             }
//         }

//         // 🟢 **Scenario 2: Assign a single user to multiple tasks**
//         else if (user_id && Array.isArray(task_ids) && task_ids.length > 0) {
//             for (const task_id of task_ids) {
//                 let taskAssignment = await TaskAssignment.findOne({ where: { task_id } });

//                 if (!taskAssignment) {
//                     // Create a new assignment
//                     taskAssignment = await TaskAssignment.create({ task_id, user_ids: [user_id], assign_by });

//                     // ✅ Log new assignment
//                     await TaskChangeLog.create({
//                         task_id,
//                         changed_by: assign_by,
//                         field_changed: "assignment",
//                         old_value: null,
//                         new_value: JSON.stringify([user_id])
//                     });
//                 } else {
//                     const previousUsers = taskAssignment.user_ids || [];

//                     if (!previousUsers.includes(user_id)) {
//                         const uniqueUsers = [...new Set([...previousUsers, user_id])];

//                         await taskAssignment.update({ user_ids: uniqueUsers });

//                         // ✅ Log the update
//                         await TaskChangeLog.create({
//                             task_id,
//                             changed_by: assign_by,
//                             field_changed: "assignment",
//                             old_value: JSON.stringify(previousUsers),
//                             new_value: JSON.stringify(uniqueUsers)
//                         });
//                     }
//                 }

//                 taskAssignments.push(taskAssignment);
//             }
//         }

//         res.status(201).json({ message: "Tasks assigned successfully", taskAssignments });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };



// export const assignTask = async (req, res) => {
//     try {
//         const { task_id, user_ids} = req.body;
//          const assign_by = req.user.id;
//         if (!Array.isArray(user_ids) || user_ids.length === 0) {
//             return res.status(400).json({ error: "user_ids must be a non-empty array" });
//         }

//         // Check if a record for this task already exists
//         let taskAssignment = await TaskAssignment.findOne({ where: { task_id } });

//         if (!taskAssignment) {
//             // Create new task assignment with user_ids array
//             taskAssignment = await TaskAssignment.create({ task_id, user_ids, assign_by });

//             // ✅ Log the assignment in TaskChangeLog
//             await TaskChangeLog.create({
//                 task_id,
//                 changed_by: assign_by,
//                 field_changed: "assignment",
//                 old_value: null,
//                 new_value: `Assigned to users: ${JSON.stringify(user_ids)}`
//             });

//         } else {
//             // Existing assignment: update user_ids (merge new users)
//             const previousUsers = taskAssignment.user_ids || [];
//             const newUsers = [...new Set([...previousUsers, ...user_ids])]; // Merge and remove duplicates

//             await taskAssignment.update({ user_ids: newUsers });

//             // ✅ Log the update in TaskChangeLog
//             await TaskChangeLog.create({
//                 task_id,
//                 changed_by: assign_by,
//                 field_changed: "assignment",
//                 old_value: JSON.stringify(previousUsers),
//                 new_value: JSON.stringify(newUsers)
//             });
//         }

//         res.status(201).json(taskAssignment);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export const getAllTaskAssignments = async (req, res) => {
//     try {
//         const user_id = req.user.id; // Assuming `req.user` contains the logged-in user details
        
//         // Fetch the user's role by including Role in the query
//         const user = await User.findByPk(user_id, {
//             include: [{ model: Role, attributes: ["name"] }] // Fetch role name
//         });

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         let assignments;

//         if (user.Role?.name === "Super Admin") {
//             // Super Admin gets all task assignments
//             assignments = await TaskAssignment.findAll({
//                 include: [
//                     { model: Task },
//                     { model: User, as: "Assigner", attributes: ["id", "name", "email"] } // Assigner user details
//                 ]
//             });
//         } else {
//             // Regular users only see tasks where they are assigned or assigned by them
//             assignments = await TaskAssignment.findAll({
//                 where: {
//                     [Op.or]: [
//                         { assign_by: user_id },  // Tasks assigned by the user
//                     ]
//                 },
//                 include: [
//                     { model: Task },
//                     { model: User, as: "Assigner", attributes: ["id", "name", "email"] }
//                 ]
//             });
//         }

//         // Fetch Assignees for each assignment
//         for (let assignment of assignments) {
//             if (assignment.user_ids && assignment.user_ids.length > 0) {
//                 const assignees = await User.findAll({
//                     where: { id: { [Op.in]: assignment.user_ids } },
//                     attributes: ["id", "name", "email"]
//                 });
//                 assignment.dataValues.Assignees = assignees; // Add the assignee list to response
//             } else {
//                 assignment.dataValues.Assignees = []; // Ensure response structure remains consistent
//             }
//         }

//         res.json(assignments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


export const getAllTaskAssignments = async (req, res) => {
    try {
        const user_id = req.user.id;
        let company_id = req.user.company; // Default: fetch from token

        // Fetch the user's role
        const user = await User.findByPk(user_id, {
            include: [{ model: Role, attributes: ["name"] }]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isSystemSuperAdmin = user.Role?.name === "System Super Admin";

        // If system super admin, require company_id from query param
        if (isSystemSuperAdmin) {
            company_id = req.query.company_id;
            if (!company_id) {
                return res.status(400).json({ error: "company_id is required for System Super Admin" });
            }
        }

        let whereClause = { "$Task.company_id$": company_id };

        if (!isSystemSuperAdmin) {
            whereClause[Op.or] = [
                { assign_by: user_id },
                Sequelize.literal(`JSON_CONTAINS(user_ids, '["${user_id}"]')`) // ✅ MySQL JSON column check
            ];
        }

        const assignments = await TaskAssignment.findAll({
            where: whereClause,
            include: [
                { model: Task },
                { model: User, as: "Assigner", attributes: ["id", "name", "email"] }
            ]
        });

        // Fetch Assignees
        for (let assignment of assignments) {
            if (assignment.user_ids && assignment.user_ids.length > 0) {
                const assignees = await User.findAll({
                    where: { id: { [Op.in]: assignment.user_ids } },
                    attributes: ["id", "name", "email"]
                });
                assignment.dataValues.Assignees = assignees;
            } else {
                assignment.dataValues.Assignees = [];
            }
        }

        res.json(assignments);
    } catch (error) {
        console.error("❌ Error in getAllTaskAssignments:", error);
        res.status(500).json({ error: error.message });
    }
};


export const getTaskAssignments = async (req, res) => {
    try {
        const { task_id } = req.params;

        // Fetch task assignments for the given task_id
        const assignments = await TaskAssignment.findAll({
            where: { task_id },
            include: [
                { model: Task },  // Include task details
                { model: User.scope('all'), as: "Assigner", attributes: ["id", "name", "email","is_active"] } // Include assigner details
            ]
        });

        // Fetch Assignees for each assignment
        for (let assignment of assignments) {
            if (assignment.user_ids && assignment.user_ids.length > 0) {
                const assignees = await User.scope('all').findAll({
                    where: { id: { [Op.in]: assignment.user_ids } },
                    attributes: ["id", "name", "email","is_active"]
                });
                assignment.dataValues.Assignees = assignees; // Add assignees to response
            } else {
                assignment.dataValues.Assignees = []; // Ensure structure consistency
            }
        }

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const unassignTask = async (req, res) => {
    try {
        const { task_id, user_id  } = req.body;
         const changed_by =req.user.id;
        // Find the assignment
        const taskAssignment = await TaskAssignment.findOne({ where: { task_id } });

        if (!taskAssignment) {
            return res.status(404).json({ error: "Task assignment not found" });
        }

        const previousUsers = taskAssignment.user_ids || [];
        const newUsers = previousUsers.filter(id => id !== user_id); // Remove the user

        if (newUsers.length === 0) {
            // If no users left, delete the assignment record
            await taskAssignment.destroy();
        } else {
            // Update with new user list
            await taskAssignment.update({ user_ids: newUsers });
        }

        // ✅ Log the removal in TaskChangeLog
        await TaskChangeLog.create({
            task_id,
            changed_by,
            field_changed: "assignment",
            old_value: JSON.stringify(previousUsers),
            new_value: JSON.stringify(newUsers)
        });

        res.json({ message: `User ${user_id} unassigned from task successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const changeAssignee = async (req, res) => {
    try {
        const { task_id, new_assignees } = req.body;
        const changed_by = req.user.id;

        if (!task_id || !Array.isArray(new_assignees) || new_assignees.length === 0) {
            return res.status(400).json({ error: "task_id and non-empty new_assignees array are required." });
        }

        // 🧠 Rebuild full user list based on current selection
        let allUserIds = [...new_assignees];
        for (const uid of new_assignees) {
            const higherUps = await getAllReportToUsers(uid);
            allUserIds.push(...higherUps);
        }

        const uniqueUsers = [...new Set(allUserIds)];

        const existingAssignment = await TaskAssignment.findOne({ where: { task_id } });

        let oldUsers = existingAssignment ? existingAssignment.user_ids || [] : [];

        if (existingAssignment) {
            await existingAssignment.update({ user_ids: uniqueUsers });

        } else {
            await TaskAssignment.create({
                task_id,
                user_ids: uniqueUsers,
                assign_by: changed_by,
            });
        }

        // Log change
        await TaskChangeLog.create({
            task_id,
            changed_by,
            field_changed: "assignment",
            old_value: JSON.stringify(oldUsers),
            new_value: JSON.stringify(uniqueUsers),
        });

        res.status(200).json({ message: "Assignees updated successfully", new_assignees: uniqueUsers });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// export const changeAssignee = async (req, res) => {
//     try {
//         const { task_id, new_assignees } = req.body; // Expect array of new assignees
//         const changed_by = req.user.id;

//         let existingAssignment = await TaskAssignment.findOne({ where: { task_id } });

//         let oldUsers = [];
//         let updatedAssignees = [];

//         if (existingAssignment) {
//             oldUsers = existingAssignment.user_ids || [];

//             // Filter out user IDs that already exist
//             const newUniqueUsers = new_assignees.filter(
//                 (userId) => !oldUsers.includes(userId)
//             );

//             // Merge and deduplicate
//             updatedAssignees = [...new Set([...oldUsers, ...newUniqueUsers])];

//             await existingAssignment.update({ user_ids: updatedAssignees });
//         } else {
//             // No previous assignment, just store unique users
//             updatedAssignees = [...new Set(new_assignees)];

//             existingAssignment = await TaskAssignment.create({
//                 task_id,
//                 user_ids: updatedAssignees,
//                 assign_by: changed_by,
//             });
//         }

//         await TaskChangeLog.create({
//             task_id,
//             changed_by,
//             field_changed: "assignment",
//             old_value: JSON.stringify(oldUsers),
//             new_value: JSON.stringify(updatedAssignees),
//         });

//         res.status(200).json({ message: "Assignees saved successfully", new_assignees: updatedAssignees });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export const changeAssignee = async (req, res) => {
//     try {
//         const { task_id, new_assignees } = req.body; // Expect array of new assignees
//         const changed_by = req.user.id;

//         // Try to find existing task assignment
//         let existingAssignment = await TaskAssignment.findOne({ where: { task_id } });

//         let oldUsers = [];

//         if (existingAssignment) {
//             // Store old users
//             oldUsers = existingAssignment.user_ids || [];

//             // Update the existing assignment
//             await existingAssignment.update({ user_ids: new_assignees });
//         } else {
//             // Create a new assignment with assign_by included
//             existingAssignment = await TaskAssignment.create({
//                 task_id,
//                 user_ids: new_assignees,
//                 assign_by: changed_by, // ✅ Required field
//             });
//         }

//         // Log the change
//         await TaskChangeLog.create({
//             task_id,
//             changed_by,
//             field_changed: "assignment",
//             old_value: JSON.stringify(oldUsers),
//             new_value: JSON.stringify(new_assignees),
//         });

//         res.status(200).json({ message: "Assignees saved successfully", new_assignees });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };




