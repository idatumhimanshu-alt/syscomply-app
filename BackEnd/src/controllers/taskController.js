import Task from "../models/Task.js";
import TaskAssignments from "../models/TaskAssignment.js";
import Department from "../models/Department.js"
import User from "../models/User.js";
import Role from "../models/Role.js";
import { Op, where } from "sequelize";
import TaskChangeLog from "../models/TaskChangeLog.js";
import sequelize from "../config/db.js";
import { VALID_STATUS_VALUES, VALID_PRIORITY_VALUES,VALID_TASK_TYPES,VALID_COMPLIANCE_VALUES,VALID_STANDARDS,VALID_STATUSWEIGHTAGE, VALID_TYPE_OF_FINDING } from "../config/constants.js"; 
import multer from "multer";
import Iteration from "../models/Iteration.js"
import { v4 as uuidv4 } from "uuid";
import ExcelJS from "exceljs";
import { parse } from 'date-fns'; // Optional: using date-fns for safe parsing
import fs from "fs"; // Import the File System module

// Create a new Task
export const createTask = async (req, res) => {
    try {
        const { 
            Checklist_Item, 
            description, 
            standard,              
            parent_task_id, 
            clause_number, 
            area, 
            expected_artifact, 
            actual_artifact, 
            compliance, 
            status, 
            priority, 
            responsibility, 
            RCA_Details, 
            notes, 
            auditee,
            iteration_id ,
            Planned_Completion_Date,
            Actual_Completion_Date,
            Type_of_Finding
        } = req.body;

        const createdBy = req.user.id;

        // Fetch user's role and company ID
        const user = await User.findByPk(createdBy, {
            include: [{ model: Role, attributes: ["name"], required: true }]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const userRole = user.Role ? user.Role.name : null;
        let company_id;

        if (userRole === "System Super Admin") {
            company_id = req.body.company_id;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is required for System Super Admin" });
            }
        } else {
            company_id = req.user.company;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
            }
        }

        // Validate required fields
        if (!Checklist_Item || !description || !standard) {
            return res.status(400).json({ error: "Checklist_Item, description and standard are required." });
        }

        if (!VALID_STANDARDS.includes(standard)) {
            return res.status(400).json({ 
                error: `Invalid standard provided: "${standard}". Allowed values: ${VALID_STANDARDS.join(", ")}` 
            });
        }

        // if (!VALID_TASK_TYPES.includes(task_type)) {
        //     return res.status(400).json({ error: `Invalid task type. Allowed: ${VALID_TASK_TYPES.join(", ")}` });
        // }

        if (status && !VALID_STATUS_VALUES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Allowed: ${VALID_STATUS_VALUES.join(", ")}` });
        }

        if (priority && !VALID_PRIORITY_VALUES.includes(priority)) {
            return res.status(400).json({ error: `Invalid priority. Allowed: ${VALID_PRIORITY_VALUES.join(", ")}` });
        }

        if (compliance && !VALID_COMPLIANCE_VALUES.includes(compliance)) {
            return res.status(400).json({ error: `Invalid compliance. Allowed: ${VALID_COMPLIANCE_VALUES.join(", ")}` });
        }

        if (Type_of_Finding && !VALID_TYPE_OF_FINDING.includes(Type_of_Finding)) {
                errors.push(`Invalid Type of Finding. Allowed: ${VALID_TYPE_OF_FINDING.join(", ")}`);
        }

        // ✅ Optional: Validate iteration ID if provided
        if (iteration_id) {
            const iteration = await Iteration.findByPk(iteration_id);
            if (!iteration || iteration.is_active === false) {
                return res.status(400).json({ error: "Invalid or inactive iteration_id." });
            }
        }

        // Create the task
        const task = await Task.create({
            Checklist_Item,
            description,
            standard,
            task_type: "Process",
            parent_task_id: parent_task_id || null,
            clause_number: clause_number || null,
            area: area || null,
            expected_artifact: expected_artifact || null,
            actual_artifact: actual_artifact || null,
            compliance: compliance || "Not Applicable",
            status: status || "Not Done",
            priority: priority || "Medium",
            responsibility: responsibility || null,
            RCA_Details: RCA_Details || null,
            notes: notes || null,
            auditee: auditee || null,
            iteration_id: iteration_id || null, // ✅ New field
            company_id,
            createdBy,
            Planned_Completion_Date,
            Actual_Completion_Date,
            Type_of_Finding: Type_of_Finding || "Non-Compliance"
        });

        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all tasks
export const getAllTasks = async (req, res) => {
    try {
        const user_id = req.user.id;
        const iteration_id = req.query.iteration_id; // ✅ Read iteration_id from query params
        const company_id_from_query = req.query.company_id;

        // Fetch user with role details
        const user = await User.findByPk(user_id, {
            include: [{ model: Role, attributes: ["name"], required: true }]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const userRole = user.Role?.name;
        let tasks;
        let company_id;

        // ✅ Common where clause object
        const baseWhere = { is_active: true };
        if (iteration_id) {
            baseWhere.iteration_id = iteration_id; // Add filter only if passed
        }

        if (userRole === "System Super Admin") {
            company_id = company_id_from_query;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is required for System Super Admin" });
            }

            tasks = await Task.findAll({
                where: { ...baseWhere, company_id }
            });

        } else if (userRole === "Super Admin") {
            company_id = req.user.company;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is required for Super Admin" });
            }

            tasks = await Task.findAll({
                where: { ...baseWhere, company_id }
            });

        } else {
            // For regular users
            const assignedTaskIds = await TaskAssignments.findAll({
                where: sequelize.literal(`JSON_CONTAINS(user_ids, '"${user_id}"')`),
                attributes: ["task_id"],
                raw: true
            });

            const assignedTaskIdList = assignedTaskIds.map(task => task.task_id);

            tasks = await Task.findAll({
                where: {
                    ...baseWhere,
                    [Op.or]: [
                        { createdBy: user_id },
                        assignedTaskIdList.length > 0 ? { id: { [Op.in]: assignedTaskIdList } } : null
                    ].filter(Boolean)
                }
            });
        }

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// export const getAllTasks = async (req, res) => {
//     try {
//         const user_id = req.user.id;

//         // Fetch user with role details
//         const user = await User.findByPk(user_id, {
//             include: [{ model: Role, attributes: ["name"], required: true }]
//         });

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         const userRole = user.Role ? user.Role.name : null;
//         let tasks;
//         let company_id;

//         if (userRole === "System Super Admin") {
//             // Require company_id from the request body
//             company_id = req.query.company_id || req.body.company_id; // Accept from query or body
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//             }

//             // Fetch all tasks related to the specified company
//             tasks = await Task.findAll({
//                 where: { company_id,is_active:true }
//             });

//         } else if (userRole === "Super Admin") {
//             // Fetch tasks related to the user's company
//             const company_id = req.user.company;

//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is required for Super Admin" });
//             }

//             tasks = await Task.findAll({
//                 where: { company_id ,is_active:true}
//             });

//         } else {
//             // Fetch tasks assigned to or created by the user
//             const assignedTaskIds = await TaskAssignments.findAll({
//                 where: sequelize.literal(`JSON_CONTAINS(user_ids, '"${user_id}"')`),
//                 attributes: ["task_id"],
//                 raw: true
//             });

//             const assignedTaskIdList = assignedTaskIds.map(task => task.task_id);

//             tasks = await Task.findAll({
//                 where: {
//                     is_active:true,
//                     [Op.or]: [
//                         { createdBy: user_id },
//                         { id: assignedTaskIdList.length > 0 ? { [Op.in]: assignedTaskIdList } : null }
//                     ]
//                 }
//             });
//         }

//         res.json(tasks);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// Get a single task by ID
export const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id);
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a Task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, standard, task_type, compliance, company_id, ...otherUpdates } = req.body;
        const createdBy = req.user?.id;

        // Fetch user's role and company ID
        const user = await User.findByPk(createdBy, {
            include: [{ model: Role, attributes: ["name"], required: true }]
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const userRole = user.Role ? user.Role.name : null;

        // Fetch the existing task
        const task = await Task.findByPk(id);
        if (!task) return res.status(404).json({ error: "Task not found." });

        let logs = [];

        // Validate ENUM fields
        if (standard && !VALID_STANDARDS.includes(standard)) {
            return res.status(400).json({ error: `Invalid standard. Allowed values: ${VALID_STANDARDS.join(", ")}` });
        }
        if (task_type && !VALID_TASK_TYPES.includes(task_type)) {
            return res.status(400).json({ error: `Invalid task type. Allowed values: ${VALID_TASK_TYPES.join(", ")}` });
        }
        if (status && !VALID_STATUS_VALUES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Allowed values: ${VALID_STATUS_VALUES.join(", ")}` });
        }
        if (priority && !VALID_PRIORITY_VALUES.includes(priority)) {
            return res.status(400).json({ error: `Invalid priority. Allowed values: ${VALID_PRIORITY_VALUES.join(", ")}` });
        }
        if (compliance && !VALID_COMPLIANCE_VALUES.includes(compliance)) {
            return res.status(400).json({ error: `Invalid compliance. Allowed values: ${VALID_COMPLIANCE_VALUES.join(", ")}` });
        }

        // Prevent company_id modification
        if (company_id && company_id !== task.company_id) {
            return res.status(403).json({ error: "Company ID modification is not allowed." });
        }

        // 🔐 Restrict Priority Change
        const isPriorityChanging = priority && task.priority !== priority;
        const isAllowedToChangePriority =
            userRole === 'Super Admin' ||
            userRole === 'System Super Admin' ||
            createdBy === task.created_by;

        if (isPriorityChanging && !isAllowedToChangePriority) {
            return res.status(403).json({
                error: "You are not authorized to change the task priority. Only Super Admin, System Super Admin, or the Task Creator can perform this action."
            });
        }

        // Log status change
        if (status && task.status !== status) {
            logs.push({
                task_id: id,
                changed_by: createdBy,
                field_changed: "status",
                old_value: task.status,
                new_value: status
            });
        }

        // Log priority change (if authorized and changed)
        if (isPriorityChanging && isAllowedToChangePriority) {
            logs.push({
                task_id: id,
                changed_by: createdBy,
                field_changed: "priority",
                old_value: task.priority,
                new_value: priority
            });
        }

        // Update the task
        const updated = await Task.update(req.body, { where: { id } });
        if (!updated[0]) return res.status(400).json({ error: "Task update failed." });

        // Save logs
        if (logs.length > 0) {
            await TaskChangeLog.bulkCreate(logs, { individualHooks: true });
        }

        res.json({ message: "Task updated successfully." });

    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Get Child Tasks for a Given Task ID
export const getChildTasks = async (req, res) => {
    try {
        const { task_id } = req.params;

        // First check if the parent task exists and is active
        const parentTask = await Task.findOne({
            where: { id: task_id, is_active: true }
        });

        if (!parentTask) {
            return res.status(404).json({ message: "Parent task not found or has been deleted." });
        }

        // Fetch only active child tasks
        const childTasks = await Task.findAll({
            where: {
                parent_task_id: task_id,
                is_active: true
            }
        });

        res.json(childTasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Configure multer for file upload
export const upload = multer({ dest: "uploads/" });

// Utility: Convert dd-mm-yyyy to JS Date
const parseExcelDate = (dateStr) => {
    console.log(`DateStr : ${dateStr}`);
    if (!dateStr) return null;

    const [ddStr, mmStr, yyyyStr] = dateStr.split("-");
    let dd = parseInt(ddStr, 10);
    let mm = parseInt(mmStr, 10);
    let yyyy = parseInt(yyyyStr, 10);

    // Fix 2-digit year to 20xx
    if (yyyy < 100) {
        yyyy += 2000;
    }

    if (!dd || !mm || !yyyy) return null;

    const jsDate = new Date(yyyy, mm - 1, dd); // JS months are 0-indexed
    console.log(`Return date for ${dateStr} is as : ${jsDate}`);
    return jsDate;
};

//get data from excel make it in form of json and return for Approval

export const uploadTasksFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { standard, iteration_id } = req.body;

        if (!VALID_STANDARDS.includes(standard)) {
            return res.status(400).json({
                error: `Invalid or missing standard. Must be one of: ${VALID_STANDARDS.join(", ")}.`
            });
        }

        if (!iteration_id) {
            return res.status(400).json({ error: "Iteration ID is required in request body." });
        }

        const iteration = await Iteration.findByPk(iteration_id);
        if (!iteration || iteration.is_active === false) {
            return res.status(400).json({ error: "Invalid or inactive iteration_id." });
        }

        const filePath = req.file.path;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];

        const headerRow = worksheet.getRow(1).values.map(cell => cell?.toString().trim());
        const colMap = {};
        headerRow.forEach((val, index) => {
            if (val) colMap[val] = index;
        });

        const createdBy = req.user.id;
        const company_id = req.user.role === "System Super Admin"
            ? req.body.company_id
            : req.user.company;

        if (!company_id) {
            return res.status(400).json({ error: "Company ID is required or not assigned." });
        }

        const tasks = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const getCell = (header) => {
                const col = colMap[header];
                return col ? (row.getCell(col).value?.toString().trim() || "") : "";
            };

            const plannedDateStr = getCell("Planned Completion Date");
            const actualDateStr = getCell("Actual Completion Date");

            tasks.push({
                id: uuidv4(),
                Checklist_Item: getCell("Checklist Item") || "Unnamed Task",
                description: getCell("Description") || "",
                standard,
                task_type: "Process",
                parent_task_id: null,
                clause_number: getCell("Reference - Clause / Control") || null,
                area: getCell("Area") || null,
                expected_artifact: null,
                actual_artifact: "",
                compliance: null,
                status: VALID_STATUS_VALUES.includes(getCell("Status of action")) ? getCell("Status of action") : "Not Done",
                priority: VALID_PRIORITY_VALUES.includes(getCell("Priority")) ? getCell("Priority") : "Medium",
                responsibility: getCell("Responsibility") || null,
                RCA_Details: getCell("RCA Details") || null,
                notes: getCell("Notes") || null,
                auditee: getCell("Auditee Department / Project") || null,
                Planned_Completion_Date: parseExcelDate(plannedDateStr),
                Actual_Completion_Date: parseExcelDate(actualDateStr),
                Type_of_Finding:getCell("Type of Finding") || "Non-Compliance",
                createdBy,
                company_id,
                iteration_id
            });
        });

        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });

        res.status(200).json({ message: "Preview data generated", tasks });
    } catch (error) {
        console.error("Error processing Excel upload:", error);
        res.status(500).json({ error: error.message });
    }
};

// export const uploadTasksFromExcel = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const { standard, iteration_id } = req.body;

//         if (!VALID_STANDARDS.includes(standard)) {
//             return res.status(400).json({
//                 error: `Invalid or missing standard. Must be one of: ${VALID_STANDARDS.join(", ")}.`
//             });
//         }

//         if (!iteration_id) {
//             return res.status(400).json({ error: "Iteration ID is required in request body." });
//         }

//         const iteration = await Iteration.findByPk(iteration_id);
//         if (!iteration || iteration.is_active === false) {
//             return res.status(400).json({ error: "Invalid or inactive iteration_id." });
//         }

//         const filePath = req.file.path;
//         const workbook = new ExcelJS.Workbook();
//         await workbook.xlsx.readFile(filePath);
        
//         const worksheet = workbook.worksheets[0]; 
//         const sheetName = worksheet.name.trim();
//         console.log(`Processing sheet: ${sheetName}`);

//         const createdBy = req.user.id;
//         let company_id;

//         if (req.user.role === "System Super Admin") {
//             company_id = req.body.company_id; 
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//             }
//         } else {
//             company_id = req.user.company; 
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//             }
//         }

//         const tasks = [];
//         const tasksMap = {}; // Store parent-child relationships

//         if (standard === "ISO_9001" && sheetName === "Gap Analysis") {
//             worksheet.eachRow((row, rowNumber) => {
//                 if (rowNumber === 1) return;

//                 const [clause, description, expectedArtifact, compliance, actualArtifact] = row.values.slice(1);
//                 if (!clause || !description) return;

//                 let parentTaskId = null;
//                 const clauseStr = String(clause).trim();
//                 const clauseParts = clauseStr.split(".");
//                 if (clauseParts.length > 1) {
//                     const parentClause = clauseParts.slice(0, -1).join(".");
//                     parentTaskId = tasksMap[parentClause] || null;
//                 }

//                 const taskId = uuidv4();
//                 tasks.push({
//                     id: taskId,
//                     name: description,
//                     description,
//                     standard,
//                     task_type: "Process",
//                     priority: "Medium",
//                     parent_task_id: parentTaskId,
//                     clause_number: clause || null,
//                     expected_artifact: expectedArtifact || null,
//                     compliance: compliance || null,
//                     actual_artifact: actualArtifact || "",
//                     createdBy,
//                     company_id,
//                     iteration_id
//                 });

//                 tasksMap[clause] = taskId;
//             });
//         }

//         else if (standard === "ISO_27001" && sheetName === "ISMS Checklist") {
//             const headerRow = worksheet.getRow(1).values.map(v => (v ? String(v).trim() : "")); 
//             if (headerRow.length === 0) {
//                 return res.status(400).json({ error: "Invalid or empty header row in the ISMS Checklist sheet." });
//             }

//             const columnMapping = {
//                 "Sr. No.": "sr_no",
//                 "Auditee": "auditee",
//                 "Area": "area",
//                 "Checklist Item": "name",
//                 "Notes": "notes",
//                 "Status FI/PI/NI/NA/TBD": "status",
//                 "Action to be taken": "action_to_be_taken",
//                 "Responsibility": "responsibility",
//                 "Status of action": "status",
//                 "Document Reference": "document_reference"
//             };

//             const colIndexes = {};
//             for (let i = 1; i < headerRow.length; i++) {
//                 if (headerRow[i] && columnMapping[headerRow[i]]) {
//                     colIndexes[columnMapping[headerRow[i]]] = i;
//                 }
//             }

//             worksheet.eachRow((row, rowNumber) => {
//                 if (rowNumber === 1) return;

//                 const taskId = uuidv4();
//                 const taskType = "Process";
//                 const parentTaskId = null;

//                 const statusValue = row.getCell(colIndexes["status"])?.value?.toString().trim() || "NI";
//                 const mappedStatus = VALID_STATUS_VALUES.includes(statusValue) ? statusValue : "NI";

//                 tasks.push({
//                     id: taskId,
//                     name: row.getCell(colIndexes["name"])?.value?.toString().trim() || "Unnamed Task",
//                     description: row.getCell(colIndexes["notes"])?.value?.toString().trim() || "",
//                     standard,
//                     priority: "Medium",
//                     task_type: taskType,
//                     parent_task_id: parentTaskId,
//                     area: row.getCell(colIndexes["area"])?.value?.toString().trim() || null,
//                     expected_artifact: row.getCell(colIndexes["action_to_be_taken"])?.value?.toString().trim() || null,
//                     actual_artifact: "",
//                     responsibility: row.getCell(colIndexes["responsibility"])?.value?.toString().trim() || null,
//                     action_to_be_taken: row.getCell(colIndexes["action_to_be_taken"])?.value?.toString().trim() || null,
//                     notes: row.getCell(colIndexes["notes"])?.value?.toString().trim() || null,
//                     auditee: row.getCell(colIndexes["auditee"])?.value?.toString().trim() || null,
//                     status: mappedStatus,
//                     createdBy,
//                     company_id,
//                     iteration_id
//                 });
//             });
//         }

//         else {
//             return res.status(400).json({ error: "Unsupported sheet or standard type." });
//         }

//         fs.unlink(filePath, (err) => {
//             if (err) console.error("Error deleting file:", err);
//         });

//         res.status(200).json({ message: "Preview data generated", tasks });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


// export const uploadTasksFromExcel = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const filePath = req.file.path;
//         const workbook = new ExcelJS.Workbook();
//         await workbook.xlsx.readFile(filePath);
        
//         const worksheet = workbook.worksheets[0]; 
//         const sheetName = worksheet.name.trim();

//         console.log(`Processing sheet: ${sheetName}`);

//         const createdBy = req.user.id;
//         let company_id;

//         // Determine company_id based on user role
//         if (req.user.role === "System Super Admin") {
//             company_id = req.body.company_id; 
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//             }
//         } else {
//             company_id = req.user.company; 
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//             }
//         }

//         const tasks = [];
//         const tasksMap = {}; // Store parent-child relationships

//         const iteration_id = req.body.iteration_id;
//            // ✅ Step 1: Validate iteration_id presence
//            if (!iteration_id) {
//             return res.status(400).json({ error: "Iteration ID is required in request body." });
//         }

//            // ✅ Optional: Validate iteration ID if provided
//            if (iteration_id) {
//             const iteration = await Iteration.findByPk(iteration_id);
//             if (!iteration || iteration.is_active === false) {
//                 return res.status(400).json({ error: "Invalid or inactive iteration_id." });
//             }
//         }
//         if (sheetName === "Gap Analysis") {
//             worksheet.eachRow((row, rowNumber) => {
//                 if (rowNumber === 1) return; // Skip header row

//                 const [clause, description, expectedArtifact, compliance, actualArtifact] = row.values.slice(1);

//                 if (!clause || !description) return; // Skip invalid rows

//                 let parentTaskId = null;

//                 if (clause) {
//                     const clauseStr = String(clause).trim();
//                     const clauseParts = clauseStr.split(".");

//                     if (clauseParts.length > 1) {
//                         const parentClause = clauseParts.slice(0, -1).join(".");
//                         parentTaskId = tasksMap[parentClause] || null;
//                     }
//                 }

//                 const taskId = uuidv4();

//                 tasks.push({
//                     id: taskId,
//                     name: description,
//                     description,
//                     standard: "ISO_9001",
//                     task_type: "Process",
//                     priority:"Medium",
//                     parent_task_id: parentTaskId,
//                     clause_number: clause || null,
//                     expected_artifact: expectedArtifact || null,
//                     compliance: compliance || null,
//                     actual_artifact: actualArtifact || "",
//                     createdBy,
//                     company_id,
//                     iteration_id
//                 });

//                 tasksMap[clause] = taskId;
//             });
//         } 
        
//         else if (sheetName === "ISMS Checklist") {

            
//             const headerRow = worksheet.getRow(1).values.map(v => (v ? String(v).trim() : "")); 
//             console.log(`header row ${headerRow}`);
            
//             if (headerRow.length === 0) {
//                 return res.status(400).json({ error: "Invalid or empty header row in the ISMS Checklist sheet." });
//             }
            
//             // Define column mapping
//             const columnMapping = {
//                 "Sr. No.": "sr_no",  // Not stored, used for reference
//                 "Auditee": "auditee",
//                 "Area": "area",
//                 "Checklist Item": "name",
//                 "Notes": "notes",
//                 "Status FI/PI/NI/NA/TBD": "status",
//                 "Action to be taken": "action_to_be_taken",
//                 "Responsibility": "responsibility",
//                 "Status of action": "status",
//                 "Document Reference": "document_reference" // Not stored, can be used for reference
//             };
        
//             // Store column indexes dynamically
//             const colIndexes = {};
//             for (let i = 1; i < headerRow.length; i++) {
//                 if (headerRow[i] && columnMapping[headerRow[i]]) {
//                     colIndexes[columnMapping[headerRow[i]]] = i;
//                 }
//             }
            
//             worksheet.eachRow((row, rowNumber) => {
//                 if (rowNumber === 1) return; // Skip header row
            
//                 const taskId = uuidv4(); 
//                 const parentTaskId = null;  
//                 const taskType = "Process";  
//                 const standard = "ISO_27001"; 
            
//                 // Extract values from the row based on column indexes
//                 const statusValue = row.getCell(colIndexes["status"])?.value?.toString().trim() || "Not Done";
//                 const mappedStatus = VALID_STATUS_VALUES.includes(statusValue) ? statusValue : "Not Done";
            
//                 // Create a task object
//                 const taskData = {
//                     id: taskId,
//                     name: row.getCell(colIndexes["name"])?.value?.toString().trim() || "Unnamed Task",
//                     description: row.getCell(colIndexes["notes"])?.value?.toString().trim() || "",
//                     standard,
//                     priority:"Medium",
//                     task_type: taskType,
//                     parent_task_id: parentTaskId,
//                     area: row.getCell(colIndexes["area"])?.value?.toString().trim() || null,
//                     expected_artifact: row.getCell(colIndexes["action_to_be_taken"])?.value?.toString().trim() || null,
//                    // compliance: mappedStatus,  // Now storing correct status
//                     actual_artifact: "",  
//                     responsibility: row.getCell(colIndexes["responsibility"])?.value?.toString().trim() || null,
//                     action_to_be_taken: row.getCell(colIndexes["action_to_be_taken"])?.value?.toString().trim() || null,
//                     notes: row.getCell(colIndexes["notes"])?.value?.toString().trim() || null,
//                     auditee: row.getCell(colIndexes["auditee"])?.value?.toString().trim() || null,
//                     status: mappedStatus,  // Assigning status properly
//                     createdBy,
//                     company_id,
//                     iteration_id
//                 };
            
//                 tasks.push(taskData);
//             });
//         } 
        
//         else {
//             return res.status(400).json({ error: "Unsupported sheet name." });
//         }

//         // Delete the file after reading
//         fs.unlink(filePath, (err) => {
//             if (err) console.error("Error deleting file:", err);
//         });
        
//         // Return parsed tasks for preview
//         res.status(200).json({ message: "Preview data generated", tasks });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

export const insertApprovedTasks = async (req, res) => {
    try {
        const { tasks, company_id: providedCompanyId } = req.body;

        if (!tasks || tasks.length === 0) {
            return res.status(400).json({ error: "No tasks to insert" });
        }

        // Fetch role name using role ID from the database
        const role = await Role.findByPk(req.user.role);
        if (!role) {
            return res.status(403).json({ error: "Invalid role" });
        }

        let company_id;

        if (role.name === "System Super Admin") {
            company_id = providedCompanyId;
            if (!company_id) {
                return res.status(400).json({ error: "Company ID is required for System Super Admin" });
            }
        } else {
            company_id = req.user.company;
            if (!company_id) {
                return res.status(400).json({ error: "User must be associated with a company to insert tasks" });
            }
        }

        // Array to store validation errors
        const failedTasks = [];

 const isExcelUploaded = async (iterationId) => {
  try {
    const iteration = await Iteration.findByPk(iterationId, {
      attributes: ['is_excel_uploaded']
    });

    if (!iteration) {
      console.warn(`Iteration not found for ID: ${iterationId}`);
      return false;
    }

    return iteration.is_excel_uploaded === true;
  } catch (error) {
    console.error(`Error checking Excel upload status for iteration ${iterationId}:`, error);
    throw error;
  }
};

        const iterationUsed = await isExcelUploaded(tasks[0].iteration_id); // <-- add await
console.log(`isExcelUploaded : ${iterationUsed}`);

if (iterationUsed) {
  return res.status(400).json({
    message: "Please select another Iteration, this iteration is already used for uploading Excel.",
    failed_tasks: failedTasks,
  });
}
        // Validate all tasks first
        const validatedTasks = tasks.map((task, index) => {
            let errors = [];

            // Check required fields (Removed description validation)
            if (!task.Checklist_Item || !task.standard || !task.task_type) {
                errors.push("Missing required fields: Checklist_Item, standard, task_type.");
            }

            if (task.standard && !VALID_STANDARDS.includes(task.standard)) {
                errors.push(`Invalid standard. Allowed: ${VALID_STANDARDS.join(", ")}`);
            }

            if (task.compliance && !VALID_COMPLIANCE_VALUES.includes(task.compliance)) {
                errors.push(`Invalid compliance value. Allowed: ${VALID_COMPLIANCE_VALUES.join(", ")}`);
            }

            if (task.status && !VALID_STATUS_VALUES.includes(task.status)) {
                errors.push(`Invalid status. Allowed: ${VALID_STATUS_VALUES.join(", ")}`);
            }

            if (task.priority && !VALID_PRIORITY_VALUES.includes(task.priority)) {
                errors.push(`Invalid priority. Allowed: ${VALID_PRIORITY_VALUES.join(", ")}`);
            }

            if (task.Type_of_Finding && !VALID_TYPE_OF_FINDING.includes(task.Type_of_Finding)) {
                errors.push(`Invalid Type of Finding. Allowed: ${VALID_TYPE_OF_FINDING.join(", ")}`);
            }

            if (errors.length > 0) {
                failedTasks.push({ row: index + 1, task, errors });
                return null; // Mark this task as invalid
            }

            // Return validated task (Allowing description to be null)
            return {
                ...task,
                description: task.description || null, // Allow null value
                company_id,
                status: task.status || "Not Done",
                priority: task.priority || "Medium",
                createdBy: req.user.id,
            };
        });

        // If there are validation errors, return them before inserting anything
        if (failedTasks.length > 0) {
            return res.status(400).json({
                message: "Validation failed. Please correct the errors and re-upload.",
                failed_tasks: failedTasks,
            });
        }

        // Insert all validated tasks at once
        const createdTasks = await Task.bulkCreate(validatedTasks, { returning: true });
        const isExcelUploade = await Iteration.update({is_excel_uploaded:true},{where:{id:tasks[0].iteration_id}})

        res.status(201).json({
            message: "All tasks inserted successfully",
            inserted_tasks: createdTasks,
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // Assuming user ID is attached to the request via middleware

        // ✅ Find the task
        const task = await Task.findOne({ where: { id, is_active: true } });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // ✅ Soft delete the main task
        task.is_active = false;
        await task.save();

        // ✅ Log the task deletion
        await TaskChangeLog.create({
            task_id: id,
            field_changed: "task",
            previous_value: task.name,
            new_value: "Task Deleted",
            changed_by: userId,
            changed_at: new Date(),
        });

        // ✅ Soft delete child tasks
        const childTasks = await Task.findAll({ where: { parent_task_id: id, is_active: true } });

        for (const child of childTasks) {
            child.is_active = false;
            await child.save();

            // ✅ Log each child task deletion
            await TaskChangeLog.create({
                task_id: child.id,
                field_changed: "task",
                previous_value: child.name,
                new_value: "Task Deleted because Parent Task deleted",
                changed_by: userId,
                changed_at: new Date(),
            });
        }

        res.json({ message: "Task and child tasks soft-deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: error.message });
    }
};

const getDepartmentWiseSummary = (tasks, taskAssignments, userMap) => {
  const taskMap = new Map(tasks.map(task => [task.id, task]));
  const departmentTaskMap = {};

  taskAssignments.forEach(assign => {
    const task = taskMap.get(assign.task_id);
    if (!task) return;

    const seenDepartments = new Set();

    (assign.user_ids || []).forEach(uid => {
      const user = userMap[uid];
      if (user && user.department && !seenDepartments.has(user.department.id)) {
        seenDepartments.add(user.department.id);
        if (!departmentTaskMap[user.department.id]) {
          departmentTaskMap[user.department.id] = {
            department: user.department,
            tasks: []
          };
        }
        departmentTaskMap[user.department.id].tasks.push(task);
      }
    });
  });

  return Object.values(departmentTaskMap).map(entry => {
    const statusSummary = {};
    entry.tasks.forEach(task => {
      const status = task.status;
      statusSummary[status] = (statusSummary[status] || 0) + 1;
    });

    return {
      department: entry.department,
      total_tasks: entry.tasks.length,
      status_summary: statusSummary
    };
  });
};

export const getTaskSummary = async (req, res) => {
  try {
    const { iteration_id } = req.body;
    const statusWeightage = VALID_STATUSWEIGHTAGE;
    const user_id = req.user.id;

    const user = await User.findByPk(user_id, {
      include: [{ model: Role, attributes: ["name"], required: true }]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = user.Role?.name;
    let company_id;

    if (userRole === "System Super Admin") {
      company_id = req.body.company_id;
      if (!company_id) {
        return res.status(400).json({ error: "Company ID is required for System Super Admin" });
      }
    } else {
      company_id = req.user.company;
      if (!company_id) {
        return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
      }
    }

    const calculateSummary = (tasks) => {
      const summary = {};
      let totalWeight = 0;
      let totalTasks = tasks.length;

      VALID_STATUS_VALUES.forEach(status => {
        summary[status] = 0;
      });

      tasks.forEach(task => {
        const status = task.status;
        summary[status] = (summary[status] || 0) + 1;

        if (statusWeightage && statusWeightage[status] !== undefined) {
          totalWeight += statusWeightage[status];
        }
      });

      const percentageCompleted = totalTasks > 0 && Object.keys(statusWeightage).length > 0
        ? parseFloat((totalWeight / (totalTasks * 100)) * 100).toFixed(2)
        : null;

      return {
        total_tasks: totalTasks,
        status_summary: summary,
        percentage_completed: percentageCompleted
      };
    };

 const calculateTypeOfFindingSummary = (tasks) => {
  const summary = {};
  let totalTasksWithFinding = 0;

  VALID_TYPE_OF_FINDING.forEach(type => {
    summary[type] = 0;
  });

  tasks.forEach(task => {
    const findingType = task.Type_of_Finding; // Ensure this matches your task field
    if (VALID_TYPE_OF_FINDING.includes(findingType)) {
      summary[findingType] += 1;
      totalTasksWithFinding += 1;
    }
  });

  return {
    total_with_type_of_finding: totalTasksWithFinding,
    type_of_finding_summary: summary
  };
};


    // Common fetch: get all tasks
    const tasks = await Task.findAll({
      where: {
        company_id,
        ...(iteration_id ? { iteration_id } : {}),
        is_active: true
      },
      include: [{
        model: Iteration,
        as: 'Iteration',
        attributes: ['id', 'name', 'start_date', 'end_date']
      }]
    });

    // Fetch all assignments in one go
    const taskAssignments = await TaskAssignments.findAll({
      where: { task_id: tasks.map(t => t.id) }
    });

    // Build user map for departments
    const allUserIds = new Set();
    taskAssignments.forEach(ta => {
      (ta.user_ids || []).forEach(uid => allUserIds.add(uid));
    });

    const users = await User.findAll({
      where: { id: [...allUserIds] },
      attributes: ['id', 'department_id'],
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });

    const userMap = {};
    users.forEach(user => {
      if (user.department) {
        userMap[user.id] = {
          id: user.id,
          department: user.department
        };
      }
    });

    // 🔹 Case 1: Single iteration summary
    if (iteration_id) {
      const iteration = await Iteration.findOne({
        where: { id: iteration_id },
        attributes: ['id', 'name', 'start_date', 'end_date']
      });

      const departmentSummary = getDepartmentWiseSummary(tasks, taskAssignments, userMap);
      const summary = calculateSummary(tasks);
      const typeOfFindingSummary = calculateTypeOfFindingSummary(tasks);

      return res.status(200).json({
        iteration: iteration ? {
          id: iteration.id,
          name: iteration.name,
          start_date: iteration.start_date,
          end_date: iteration.end_date
        } : null,
        ...summary,
        standard:tasks[0].standard,
        Type_of_Finding_Summary: typeOfFindingSummary,
        department_summary: departmentSummary
      });
    }

    // 🔹 Case 2: Group by iteration and calculate summary + department_summary per iteration
    const grouped = {};
    tasks.forEach(task => {
      const iterId = task.iteration_id || "no_iteration";
      if (!grouped[iterId]) {
        grouped[iterId] = {
          iteration: task.Iteration ? {
            id: task.Iteration.id,
            name: task.Iteration.name,
            start_date: task.Iteration.start_date,
            end_date: task.Iteration.end_date
          } : {
            id: null,
            name: "Unassigned",
            start_date: null,
            end_date: null
          },
          tasks: [],
          assignments: []
        };
      }
      grouped[iterId].tasks.push(task);
    });

    // Group assignments per iteration
    taskAssignments.forEach(assign => {
      const task = tasks.find(t => t.id === assign.task_id);
      const iterId = task?.iteration_id || "no_iteration";
      if (grouped[iterId]) {
        grouped[iterId].assignments.push(assign);
      }
    });

    const iterations = Object.keys(grouped).map(iterId => {
      const group = grouped[iterId];
      const summary = calculateSummary(group.tasks);
      const departmentSummary = getDepartmentWiseSummary(group.tasks, group.assignments, userMap);
      const typeOfFindingSummary = calculateTypeOfFindingSummary(group.tasks);
      return {
        iteration: group.iteration,
        ...summary,
        Type_of_Finding_Summary: typeOfFindingSummary,
        department_summary: departmentSummary,
        standard:group.tasks[0].standard
      };
    });

    return res.status(200).json({
      iterations
    });

  } catch (error) {
    console.error("Error in getTaskSummary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const getTaskSummary = async (req, res) => {
//     try {
//       const { iteration_id } = req.body;
//       const statusWeightage = VALID_STATUSWEIGHTAGE;
//       const user_id = req.user.id;
  
//       const user = await User.findByPk(user_id, {
//         include: [{ model: Role, attributes: ["name"], required: true }]
//       });
  
//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }
  
//       const userRole = user.Role?.name;
//       let company_id;
  
//       if (userRole === "System Super Admin") {
//         company_id = req.body.company_id;
//         if (!company_id) {
//           return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//         }
//       } else {
//         company_id = req.user.company;
//         if (!company_id) {
//           return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//         }
//       }
  
//       const calculateSummary = (tasks) => {
//         const summary = {};
//         let totalWeight = 0;
//         let totalTasks = tasks.length;
  
//         VALID_STATUS_VALUES.forEach(status => {
//           summary[status] = 0;
//         });
  
//         tasks.forEach(task => {
//           const status = task.status;
//           summary[status] = (summary[status] || 0) + 1;
  
//           if (statusWeightage && statusWeightage[status] !== undefined) {
//             totalWeight += statusWeightage[status];
//           }
//         });
  
//         const percentageCompleted = totalTasks > 0 && Object.keys(statusWeightage).length > 0
//           ? parseFloat((totalWeight / (totalTasks * 100)) * 100).toFixed(2)
//           : null;
  
//         return {
//           total_tasks: totalTasks,
//           status_summary: summary,
//           percentage_completed: percentageCompleted
//         };
//       };
  
//       // 🔹 Case 1: iteration_id is provided
//       if (iteration_id) {
//         const tasks = await Task.findAll({
//           where: {
//             company_id,
//             iteration_id,
//             is_active: true
//           }
//         });
  
//         const iteration = await Iteration.findOne({
//           where: { id: iteration_id },
//           attributes: ['id', 'name', 'start_date', 'end_date']
//         });
  
//         const summary = calculateSummary(tasks);
  
//         return res.status(200).json({
//           iteration: iteration ? {
//             id: iteration.id,
//             name: iteration.name,
//             start_date: iteration.start_date,
//             end_date: iteration.end_date
//           } : null,
//           ...summary
//         });
//       }
  
//       // 🔹 Case 2: No iteration_id — group by iteration
//       const tasks = await Task.findAll({
//         where: {
//           company_id,
//           is_active: true
//         },
//         include: [{
//           model: Iteration,
//           as: 'Iteration',
//           attributes: ['id', 'name', 'start_date', 'end_date']
//         }]
//       });
  
//       // 🔸 Fetch TaskAssignments with user_ids
//       const taskAssignments = await TaskAssignments.findAll({
//         where: { task_id: tasks.map(t => t.id) }
//       });
  
//       // 🔸 Collect all user_ids from assignments
//       const allUserIds = new Set();
//       taskAssignments.forEach(ta => {
//         (ta.user_ids || []).forEach(uid => allUserIds.add(uid));
//       });
  
//       // 🔸 Get User + Department details
//       const users = await User.findAll({
//         where: { id: [...allUserIds] },
//         attributes: ['id', 'department_id'],
//         include: [{
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'name']
//         }]
//       });
  
//       const userMap = {};
//       users.forEach(user => {
//         if (user.department) {
//           userMap[user.id] = {
//             id: user.id,
//             department: user.department
//           };
//         }
//       });
  
//       // 🔸 Map department-wise tasks
//       const taskMap = new Map(tasks.map(task => [task.id, task]));
//       const departmentTaskMap = {};
  
//       taskAssignments.forEach(assign => {
//         const task = taskMap.get(assign.task_id);
//         if (!task) return;
  
//         const departmentsSeen = new Set();
  
//         (assign.user_ids || []).forEach(uid => {
//           const user = userMap[uid];
//           if (user && !departmentsSeen.has(user.department.id)) {
//             departmentsSeen.add(user.department.id);
//             if (!departmentTaskMap[user.department.id]) {
//               departmentTaskMap[user.department.id] = {
//                 department: user.department,
//                 tasks: []
//               };
//             }
//             departmentTaskMap[user.department.id].tasks.push(task);
//           }
//         });
//       });
  
//       const departmentSummary = Object.values(departmentTaskMap).map(entry => {
//         const summary = calculateSummary(entry.tasks);
//         return {
//           department: entry.department,
//           ...summary
//         };
//       });
  
//       // 🔸 Group tasks by iteration
//       const grouped = {};
//       tasks.forEach(task => {
//         const iterId = task.iteration_id || "no_iteration";
//         if (!grouped[iterId]) {
//           grouped[iterId] = {
//             iteration: task.Iteration ? {
//               id: task.Iteration.id,
//               name: task.Iteration.name,
//               start_date: task.Iteration.start_date,
//               end_date: task.Iteration.end_date
//             } : {
//               id: null,
//               name: "Unassigned",
//               start_date: null,
//               end_date: null
//             },
//             tasks: []
//           };
//         }
//         grouped[iterId].tasks.push(task);
//       });
  
//       const iterations = Object.keys(grouped).map(key => {
//         const group = grouped[key];
//         const summary = calculateSummary(group.tasks);
//         return {
//           iteration: group.iteration,
//           ...summary
//         };
//       });
  
//       return res.status(200).json({
//         iterations,
//         department_summary: departmentSummary
//       });
  
//     } catch (error) {
//       console.error("Error in getTaskSummary:", error);
//       res.status(500).json({ message: "Server error", error: error.message });
//     }
//   };
  
  
  

// export const getTaskSummary = async (req, res) => {
//     try {
//       const {  iteration_id } = req.body;
//           const statusWeightage =    VALID_STATUSWEIGHTAGE;                //req.body.status_weightage || {}; // Optional
  
//       const user_id = req.user.id;
  
//           // Fetch user's role and company ID
//           const user = await User.findByPk(user_id, {
//               include: [{ model: Role, attributes: ["name"], required: true }]
//           });
  
//           if (!user) {
//               return res.status(404).json({ error: "User not found" });
//           }
  
//           const userRole = user.Role ? user.Role.name : null;
//           let company_id;
  
//           if (userRole === "System Super Admin") {
//               company_id = req.body.company_id;
//               if (!company_id) {
//                   return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//               }
//           } else {
//               company_id = req.user.company;
//               if (!company_id) {
//                   return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//               }
//           }
   
  
  
//       // Helper function to calculate status summary and weighted percentage
//       const calculateSummary = (tasks) => {
//         const summary = {};
//         let totalWeight = 0;
//         let totalTasks = tasks.length;
  
//         VALID_STATUS_VALUES.forEach(status => {
//           summary[status] = 0;
//         });
  
//         tasks.forEach(task => {
//           const status = task.status;
//           summary[status] = (summary[status] || 0) + 1;
  
//           // Apply weightage if provided
//           if (statusWeightage && statusWeightage[status] !== undefined) {
//             totalWeight += statusWeightage[status];
//           }
//         });
  
//         const percentageCompleted = totalTasks > 0 && Object.keys(statusWeightage).length > 0
//           ? parseFloat((totalWeight / (totalTasks * 100)) * 100).toFixed(2)
//           : null;
  
//         return {
//           total_tasks: totalTasks,
//           status_summary: summary,
//           percentage_completed: percentageCompleted
//         };
//       };
  
//       // Case 1: Specific iteration_id provided
//       if (iteration_id) {
//         const tasks = await Task.findAll({
//           where: {
//             company_id,
//             iteration_id,
//             is_active: true
//           }
//         });
  
//         const iteration = await Iteration.findOne({
//           where: { id: iteration_id },
//           attributes: ['id', 'name', 'start_date', 'end_date']
//         });
  
//         const summary = calculateSummary(tasks);
  
//         return res.status(200).json({
//           iteration: iteration ? {
//             id: iteration.id,
//             name: iteration.name,
//             start_date: iteration.start_date,
//             end_date: iteration.end_date
//           } : null,
//           ...summary
//         });
//       }
  
//       // Case 2: No iteration_id → group by iteration
//       const tasks = await Task.findAll({
//         where: {
//           company_id,
//           is_active: true
//         },
//         include: [{
//           model: Iteration,
//            as: 'Iteration',
//           attributes: ['id', 'name', 'start_date', 'end_date']
//         }]
//       });
  


//      // Step: Department-wise summary
// const tasksWithAssignees = await Task.findAll({
//     where: {
//       company_id,
//       is_active: true,
//       ...(iteration_id ? { iteration_id } : {})
//     },
//     include: [
//       {
//         model: TaskAssignments,
//         as: 'Assignees',
//         include: [
//           {
//             model: User,
//             as: 'user',
//             attributes: ['id', 'department_id'],
//             include: [
//               {
//                 model: Department,
//                 as: 'department',
//                 attributes: ['id', 'name']
//               }
//             ]
//           }
//         ]
//       }
//     ]
//   });
  
//   const departmentTaskMap = {};
  
//   tasksWithAssignees.forEach(task => {
//     const departmentsSeen = new Set();
  
//     task.assignees.forEach(assignee => {
//       const dept = assignee.user?.department;
//       if (dept && !departmentsSeen.has(dept.id)) {
//         departmentsSeen.add(dept.id);
//         if (!departmentTaskMap[dept.id]) {
//           departmentTaskMap[dept.id] = {
//             department: {
//               id: dept.id,
//               name: dept.name
//             },
//             tasks: []
//           };
//         }
//         departmentTaskMap[dept.id].tasks.push(task);
//       }
//     });
//   });
  
//   const departmentSummary = Object.values(departmentTaskMap).map(entry => {
//     const summary = calculateSummary(entry.tasks);
//     return {
//       department: entry.department,
//       ...summary
//     };
//   });
  

//       // Group tasks by iteration_id
//       const grouped = {};
  
//       tasks.forEach(task => {
//         const iterId = task.iteration_id || "no_iteration";
//         if (!grouped[iterId]) {
//           grouped[iterId] = {
//             iteration: task.Iteration ? {
//               id: task.Iteration.id,
//               name: task.Iteration.name,
//               start_date: task.Iteration.start_date,
//               end_date: task.Iteration.end_date
//             } : {
//               id: null,
//               name: "Unassigned",
//               start_date: null,
//               end_date: null
//             },
//             tasks: []
//           };
//         }
//         grouped[iterId].tasks.push(task);
//       });
  
//       const iterations = Object.keys(grouped).map(key => {
//         const group = grouped[key];
//         const summary = calculateSummary(group.tasks);
//         return {
//           iteration: group.iteration,
//           ...summary
//         };
//       });
      
//       return res.status(200).json({
//         iterations,
//         department_summary: departmentSummary
//       });
      
  
  
//     } catch (error) {
//       console.error("Error in getTaskSummary:", error);
//       res.status(500).json({ message: "Server error", error: error.message });
//     }
//   };

// export const getTaskSummary = async (req, res) => {
//   try {
//     const {  iteration_id } = req.body;
//         const statusWeightage =    VALID_STATUSWEIGHTAGE;                //req.body.status_weightage || {}; // Optional

//     const user_id = req.user.id;

//         // Fetch user's role and company ID
//         const user = await User.findByPk(user_id, {
//             include: [{ model: Role, attributes: ["name"], required: true }]
//         });

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         const userRole = user.Role ? user.Role.name : null;
//         let company_id;

//         if (userRole === "System Super Admin") {
//             company_id = req.body.company_id;
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//             }
//         } else {
//             company_id = req.user.company;
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//             }
//         }
 


//     // Helper function to calculate status summary and weighted percentage
//     const calculateSummary = (tasks) => {
//       const summary = {};
//       let totalWeight = 0;
//       let totalTasks = tasks.length;

//       VALID_STATUS_VALUES.forEach(status => {
//         summary[status] = 0;
//       });

//       tasks.forEach(task => {
//         const status = task.status;
//         summary[status] = (summary[status] || 0) + 1;

//         // Apply weightage if provided
//         if (statusWeightage && statusWeightage[status] !== undefined) {
//           totalWeight += statusWeightage[status];
//         }
//       });

//       const percentageCompleted = totalTasks > 0 && Object.keys(statusWeightage).length > 0
//         ? parseFloat((totalWeight / (totalTasks * 100)) * 100).toFixed(2)
//         : null;

//       return {
//         total_tasks: totalTasks,
//         status_summary: summary,
//         percentage_completed: percentageCompleted
//       };
//     };

//     // Case 1: Specific iteration_id provided
//     if (iteration_id) {
//       const tasks = await Task.findAll({
//         where: {
//           company_id,
//           iteration_id,
//           is_active: true
//         }
//       });

//       const iteration = await Iteration.findOne({
//         where: { id: iteration_id },
//         attributes: ['id', 'name', 'start_date', 'end_date']
//       });

//       const summary = calculateSummary(tasks);

//       return res.status(200).json({
//         iteration: iteration ? {
//           id: iteration.id,
//           name: iteration.name,
//           start_date: iteration.start_date,
//           end_date: iteration.end_date
//         } : null,
//         ...summary
//       });
//     }

//     // Case 2: No iteration_id → group by iteration
//     const tasks = await Task.findAll({
//       where: {
//         company_id,
//         is_active: true
//       },
//       include: [{
//         model: Iteration,
//          as: 'Iteration',
//         attributes: ['id', 'name', 'start_date', 'end_date']
//       }]
//     });

//     // Group tasks by iteration_id
//     const grouped = {};

//     tasks.forEach(task => {
//       const iterId = task.iteration_id || "no_iteration";
//       if (!grouped[iterId]) {
//         grouped[iterId] = {
//           iteration: task.Iteration ? {
//             id: task.Iteration.id,
//             name: task.Iteration.name,
//             start_date: task.Iteration.start_date,
//             end_date: task.Iteration.end_date
//           } : {
//             id: null,
//             name: "Unassigned",
//             start_date: null,
//             end_date: null
//           },
//           tasks: []
//         };
//       }
//       grouped[iterId].tasks.push(task);
//     });

//     const iterations = Object.keys(grouped).map(key => {
//       const group = grouped[key];
//       const summary = calculateSummary(group.tasks);
//       return {
//         iteration: group.iteration,
//         ...summary
//       };
//     });

//     return res.status(200).json({ iterations });

//   } catch (error) {
//     console.error("Error in getTaskSummary:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



// export const getTaskSummary = async (req, res) => {
//   try {
//     const { iteration_id } = req.query;
//     const statusWeightage =    VALID_STATUSWEIGHTAGE;                //req.body.status_weightage || {}; // Optional

//     const user_id = req.user.id;

//         // Fetch user's role and company ID
//         const user = await User.findByPk(user_id, {
//             include: [{ model: Role, attributes: ["name"], required: true }]
//         });

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         const userRole = user.Role ? user.Role.name : null;
//         let company_id;

//         if (userRole === "System Super Admin") {
//             company_id = req.body.company_id;
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//             }
//         } else {
//             company_id = req.user.company;
//             if (!company_id) {
//                 return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//             }
//         }
 

//     // Fetch tasks
//     const whereClause = {
//       company_id,
//       is_active: true
//     };
//     if (iteration_id) whereClause.iteration_id = iteration_id;

//     const tasks = await Task.findAll({ where: whereClause });

//     // 1. Status-wise count
//     const statusSummary = {};
//     let weightedSum = 0;
//     for (const status of VALID_STATUS_VALUES) {
//       statusSummary[status] = 0;
//     }

//     for (const task of tasks) {
//       const status = task.status || "TBD";
//       statusSummary[status] = (statusSummary[status] || 0) + 1;

//       if (statusWeightage[status] !== undefined) {
//         weightedSum += statusWeightage[status];
//       }
//     }

//     // 2. Completion Percentage
//     let completionPercentage = 0;
//     if (tasks.length > 0 && Object.keys(statusWeightage).length > 0) {
//       completionPercentage = weightedSum / tasks.length;
//     }

//     // 3. Iteration Timeline
//     let iterationTimeline = null;
//     if (iteration_id) {
//       const iteration = await Iteration.findByPk(iteration_id);
//       if (iteration) {
//         iterationTimeline = {
//           start: iteration.start_date,
//           end: iteration.end_date
//         };
//       }
//     }

//     return res.json({
//       statusSummary,
//       totalTasks: tasks.length,
//       completionPercentage: +completionPercentage.toFixed(2),
//       iterationTimeline
//     });

//   } catch (error) {
//     console.error("Error in getTaskSummary:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };



// export const deleteTask = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // ✅ Delete related records first
//         await TaskAssignments.destroy({ where: { task_id: id } });
//         await TaskChangeLog.destroy({ where: { task_id: id } });

//         // ✅ Delete child tasks recursively
//         await Task.destroy({ where: { parent_task_id: id } });

//         // ✅ Delete the main task
//         const deleted = await Task.destroy({ where: { id } });

//         if (!deleted) {
//             return res.status(404).json({ error: "Task not found" });
//         }

//         res.json({ message: "Task and related records deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


// Route for inserting approved tasks
//router.post("/insert-approved-tasks", insertApprovedTasks);




// import Task from "../models/Task.js";
// import TaskAssignments from "../models/TaskAssignment.js";
// import User from "../models/User.js";
// import Role from "../models/Role.js"
// import { Op } from "sequelize";


// // Create a new Task
// export const createTask = async (req, res) => {
//     try {
//         const { name, description, task_type, parent_task_id,createdBy } = req.body;
//         const task = await Task.create({ name, description, task_type, parent_task_id,createdBy });
//         res.status(201).json(task);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get all tasks
// export const getAllTasks = async (req, res) => {
//     try {
//         const { user_id } = req.body; // Extract user_id from request body

//         // Fetch user role
//         const user = await User.findByPk(user_id, {
//             include: [{ model: Role, attributes: ["name"], required: true }]  // Ensure role is included
//         });

        

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         const userRole = user.Role ? user.Role.name : null;


//         console.log(`userRole ${userRole}`);

//         let tasks;

//         if (userRole === "Super Admin") {
//             // Super Admin gets all tasks
//             tasks = await Task.findAll();
//         } else {
//             // Get task IDs where the user is either an assignee or an assigner
//             const assignedTaskIds = await TaskAssignments.findAll({
//                 where: {
//                     [Op.or]: [
//                         { user_id },     // Tasks assigned to the user
//                         { assign_by: user_id }  // Tasks assigned by the user
//                     ]
//                 },
//                 attributes: ["task_id"], // Get only task_id
//                 raw: true
//             });

//             // Extract task IDs from TaskAssignment results
//             const assignedTaskIdList = assignedTaskIds.map(task => task.task_id);

//             // Fetch tasks where:
//             // - User is the creator
//             // - User has assigned the task or was assigned a task
//             tasks = await Task.findAll({
//                 where: {
//                     [Op.or]: [
//                         { createdBy: user_id },
//                         { id: assignedTaskIdList.length > 0 ? { [Op.in]: assignedTaskIdList } : null }
//                     ]
//                 }
//             });
//         }

//         res.json(tasks);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Get a single task by ID
// export const getTaskById = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const task = await Task.findByPk(id);
//         if (!task) return res.status(404).json({ error: "Task not found" });
//         res.json(task);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Update a Task
// export const updateTask = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updated = await Task.update(req.body, { where: { id } });
//         if (!updated[0]) return res.status(404).json({ error: "Task not found" });
//         res.json({ message: "Task updated successfully" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// // Delete a Task
// export const deleteTask = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const deleted = await Task.destroy({ where: { id } });
//         if (!deleted) return res.status(404).json({ error: "Task not found" });
//         res.json({ message: "Task deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


// import TaskAssignment from "../models/TaskAssignment.js";
// import TaskChangeLog from "../models/TaskChangeLog.js";
// import { Op } from "sequelize";
// import User from "../models/User.js";
// import Role from "../models/Role.js";
// import Task from "../models/Task.js";

// export const assignTask = async (req, res) => {
//     try {
//         const { task_id, user_ids } = req.body; // Expecting an array of user IDs
//         const assign_by=req.user.id;

//         if (!Array.isArray(user_ids) || user_ids.length === 0) {
//             return res.status(400).json({ error: "user_id must be a non-empty array" });
//         }

//         const assignments = await Promise.all(
//             user_ids.map(async (user_id) => {
//                 // Check if the assignment already exists
//                 const existingAssignment = await TaskAssignment.findOne({
//                     where: { task_id, user_id }
//                 });

//                 if (!existingAssignment) {
//                     const newAssignment = await TaskAssignment.create({ task_id, user_id, assign_by });

//                     // ✅ Log task assignment in TaskChangeLog
//                     await TaskChangeLog.create({
//                         task_id,
//                         changed_by: assign_by,
//                         field_changed: "assignment",
//                         old_value: null,
//                         new_value: `Assigned to user ${user_id}`,
//                     });

//                     return newAssignment;
//                 }

//                 return existingAssignment; // If it exists, return the existing assignment
//             })
//         );

//         res.status(201).json(assignments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export const changeAssignee = async (req, res) => {
//     try {
//         const { task_id, old_assignee, new_assignee } = req.body;
//         const changed_by=req.user.id;
//         // Ensure task assignment exists for old assignee
//         const existingAssignment = await TaskAssignment.findOne({
//             where: { task_id, user_id: old_assignee }
//         });

//         if (!existingAssignment) {
//             return res.status(404).json({ error: "Old assignee not found for this task" });
//         }

//         // Remove old assignee
//         await TaskAssignment.destroy({ where: { task_id, user_id: old_assignee } });

//         // Assign new assignee
//         const newAssignment = await TaskAssignment.create({
//             task_id,
//             user_id: new_assignee,
//             assign_by: changed_by
//         });

//         // ✅ Log the change in TaskChangeLog
//         await TaskChangeLog.create({
//             task_id,
//             changed_by,
//             field_changed: "assignment",
//             old_value: `Assigned to user ${old_assignee}`,
//             new_value: `Assigned to user ${new_assignee}`,
//         });

//         res.status(200).json({ message: "Assignee changed successfully", newAssignment });
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
//                     { model: User, as: "Assignee", attributes: ["id", "name", "email"] }, // Assigned user details
//                     { model: User, as: "Assigner", attributes: ["id", "name", "email"] } // Assigner user details
//                 ]
//             });
//         } else {
//             // Regular users only see tasks where they are assigned (user_id) or assigned by (assign_by)
//             assignments = await TaskAssignment.findAll({
//                 where: {
//                     [Op.or]: [
//                         { user_id }, // User is assigned this task
//                         { assign_by: user_id } // User assigned this task
//                     ]
//                 },
//                 include: [
//                     { model: Task },
//                     { model: User, as: "Assignee", attributes: ["id", "name", "email"] },
//                     { model: User, as: "Assigner", attributes: ["id", "name", "email"] }
//                 ]
//             });
//         }

//         res.json(assignments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export const getTaskAssignments = async (req, res) => {
//     try {
//         const { task_id } = req.params;
//         const assignments = await TaskAssignment.findAll({
//             where: { task_id },
//             include: [
//                 { model: User, as: "Assignee", attributes: ["id", "name", "email"] },
//                 { model: User, as: "Assigner", attributes: ["id", "name", "email"] }
//             ]
//         });
//         res.json(assignments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

// export const unassignTask = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const assignment = await TaskAssignment.findByPk(id);

//         if (!assignment) {
//             return res.status(404).json({ error: "Assignment not found" });
//         }

//         // ✅ Log task unassignment in TaskChangeLog
//         await TaskChangeLog.create({
//             task_id: assignment.task_id,
//             changed_by: assignment.assign_by,
//             field_changed: "assignment",
//             old_value: `Assigned to user ${assignment.user_id}`,
//             new_value: "Unassigned",
//         });

//         // Delete the assignment
//         await TaskAssignment.destroy({ where: { id } });

//         res.json({ message: "User unassigned from task successfully" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
