import multer from "multer";
import path from "path";
import fs from "fs";
import Document from "../models/Document.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import TaskChangeLog from "../models/TaskChangeLog.js"


const getAllHigherRoleIds = async (roleId, visited = new Set()) => {
    const role = await Role.findByPk(roleId);
    if (!role || visited.has(role.id)) return [];

    visited.add(role.id);
    const higherRoles = [];

    if (role.parent_role_id) {
        higherRoles.push(role.parent_role_id);
        const parentRoles = await getAllHigherRoleIds(role.parent_role_id, visited);
        higherRoles.push(...parentRoles);
    }

    return higherRoles;
};
// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/documents"; // Folder where files will be stored
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Create folder if not exists
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        cb(null, uniqueName);
    }
});

// File filter (optional, to allow only specific types)
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf", "audio/mpeg", "video/mp4"];
//     if (allowedTypes.includes(file.mimetype)) {
//         cb(null, true);
//     } else {
//         cb(new Error("Invalid file type"), false);
//     }
// };


// File filter (allow all file types)

const fileFilter = (req, file, cb) => {
    cb(null, true); // Accept all file types
};

// Upload middleware
const upload = multer({ storage, fileFilter });

export const uploadDocument = async (req, res) => {
  try {
    upload.array("documents")(req, res, async function (err) {
      if (err) return res.status(400).json({ error: err.message });

      const { task_id, user_id, remark, issue_date } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const taskExists = await Task.findByPk(task_id);
      if (!taskExists) {
        return res.status(400).json({ error: `Task with ID ${task_id} does not exist` });
      }

      const taskFolder = path.join("uploads", task_id.toString());
      if (!fs.existsSync(taskFolder)) fs.mkdirSync(taskFolder, { recursive: true });

      const existingFiles = fs.readdirSync(taskFolder);
      const uploadedDocs = [];

      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const originalName = path.parse(file.originalname).name;
        const cleanFileName = originalName.replace(/_v\d+_\d+$/, "");
        const timestamp = Date.now();

        let version = 1;
        let previousVersionFile = null;
        const versionRegex = new RegExp(`^${cleanFileName}_v(\\d+)_\\d+\\${fileExt}$`);

        for (const existingFile of existingFiles) {
          const match = existingFile.match(versionRegex);
          if (match) {
            const existingVersion = parseInt(match[1], 10);
            if (existingVersion >= version) {
              version = existingVersion + 1;
              previousVersionFile = existingFile;
            }
          }
        }

        const newFileName = `${cleanFileName}_v${version}_${timestamp}${fileExt}`;
        const filePath = path.join(taskFolder, newFileName);

        fs.renameSync(file.path, filePath);

        const document = await Document.create({
          task_id,
          user_id,
          file_name: newFileName,
          file_path: filePath,
          issue_date,
          remark,
        });

        await TaskChangeLog.create({
          task_id,
          changed_by: user_id,
          field_changed: "document",
          old_value: previousVersionFile || null,
          new_value: `Uploaded: ${newFileName}`,
        });

        uploadedDocs.push(document);
      }

      res.status(201).json({
        message: "Documents uploaded successfully",
        documents: uploadedDocs,
      });
    });
  } catch (error) {
    console.error("Error while uploading documents:", error);
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ error: "Invalid task_id. Task does not exist." });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};


// export const uploadDocument = async (req, res) => {
//     try {
//         upload.single("document")(req, res, async function (err) {
//             if (err) return res.status(400).json({ error: err.message });

//             const { task_id, user_id, remark,issue_date } = req.body;
//             if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//             const taskExists = await Task.findByPk(task_id);
//             if (!taskExists) return res.status(400).json({ error: `Task with ID ${task_id} does not exist` });

//             const fileExt = path.extname(req.file.originalname);
//             const originalName = path.parse(req.file.originalname).name;
//             const timestamp = Date.now();

//             const cleanFileName = originalName.replace(/_v\d+_\d+$/, "");
//             const taskFolder = path.join("uploads", task_id);
//             if (!fs.existsSync(taskFolder)) fs.mkdirSync(taskFolder, { recursive: true });

//             const existingFiles = fs.readdirSync(taskFolder);
//             let version = 1;
//             let previousVersionFile = null;

//             const versionRegex = new RegExp(`^${cleanFileName}_v(\\d+)_\\d+\\${fileExt}$`);

//             for (const file of existingFiles) {
//                 const match = file.match(versionRegex);
//                 if (match) {
//                     const existingVersion = parseInt(match[1], 10);
//                     if (existingVersion >= version) {
//                         version = existingVersion + 1;
//                         previousVersionFile = file; // keep track of latest version
//                     }
//                 }
//             }

//             const newFileName = `${cleanFileName}_v${version}_${timestamp}${fileExt}`;
//             const filePath = path.join(taskFolder, newFileName);

//             fs.renameSync(req.file.path, filePath);

//             const document = await Document.create({
//                 task_id,
//                 user_id,
//                 file_name: newFileName,
//                 file_path: filePath,
//                 issue_date,
//                 remark,
//             });

//             // Create changelog entry
//             await TaskChangeLog.create({
//                 task_id,
//                 changed_by: user_id,
//                 field_changed: "document",
//                 old_value: previousVersionFile || null,
//                 new_value: `Uploaded: ${newFileName}`
//             });

//             res.status(201).json({ message: "File uploaded successfully", document });
//         });
//     } catch (error) {
//         console.error("Error while uploading document:", error);
//         if (error.name === "SequelizeForeignKeyConstraintError") {
//             return res.status(400).json({ error: "Invalid task_id. Task does not exist." });
//         }
//         res.status(500).json({ error: "Internal server error." });
//     }
// };

 // API to Get Documents by Task ID
 
 
 export const getDocumentsByTask = async (req, res) => {
    try {
        const { task_id } = req.params;
        const documents = await Document.findAll({
            where: { task_id, is_deleted: false },
            order: [['uploaded_at', 'DESC']],
            include: [
                {
                    model: User.scope('all'), // Include inactive users as well
                    attributes: ['name'],
                    as: 'uploader'
                }
            ]
        });

        if (!documents || documents.length === 0) {
            return res.status(404).json({ message: "No documents found for the given task ID." });
        }

        const documentsWithDetails = documents.map(doc => ({
            ...doc.toJSON(),
            file_url: `${req.protocol}://${req.get("host")}/api/${doc.file_path}`,
            uploaded_by: doc.uploader ? doc.uploader.name : "Unknown"
        }));

        res.json(documentsWithDetails);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        const document = await Document.findByPk(id);
        if (!document || document.is_deleted) {
            return res.status(404).json({ error: "Document not found or already deleted" });
        }

        const documentOwner = await User.scope('all').findByPk(document.user_id);
        const currentUser = await User.findByPk(currentUserId);

        const currentRole = await Role.findByPk(currentUser.role_id);
        const ownerRole = await Role.findByPk(documentOwner?.role_id);
        const currentRoleName = currentRole?.name?.toLowerCase();

        const hasAccess = (
            currentUserId === document.user_id ||
            ["system super admin", "super admin"].includes(currentRoleName) ||
            (await getAllHigherRoleIds(ownerRole?.id)).includes(currentRole.id)
        );

        if (!hasAccess) {
            return res.status(403).json({ error: "You do not have permission to delete this document" });
        }

        // Perform soft delete
        document.is_deleted = true;
        await document.save();

        // ✅ Add Task Change Log
        await TaskChangeLog.create({
            task_id: document.task_id,
            changed_by: currentUserId,
            field_changed: "document",
            old_value: `Deleted: ${document.file_name}`,
            new_value: '❌ File Deleted'
        });

        res.json({ message: "Document deleted successfully." });

    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: error.message });
    }
};

const softDelete = async (document, res) => {
    const originalPath = document.file_path;
    const filename = path.basename(originalPath);
    const deletedFolder = path.join("deleted_documents");

    if (!fs.existsSync(deletedFolder)) {
        fs.mkdirSync(deletedFolder, { recursive: true });
    }

    const newPath = path.join(deletedFolder, filename);
    fs.renameSync(originalPath, newPath);

    document.file_path = newPath;
    document.is_deleted = true;
    await document.save();

    return res.json({ message: "Document soft deleted and moved to deleted_documents." });
};

export const updateDocumentDetails = async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const { remark, issue_date } = req.body;

        const document = await Document.findByPk(documentId);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        document.remark = remark ?? document.remark;
        document.issue_date = issue_date ?? document.issue_date;

        await document.save();

        return res.status(200).json({
            message: "Document updated successfully",
            document
        });
    } catch (error) {
        console.error("Error updating document:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


// API to Upload Document





// export const uploadDocument = async (req, res) => {
//     try {
//         upload.single("document")(req, res, async function (err) {
//             if (err) {
//                 return res.status(400).json({ error: err.message });
//             }

//             const { task_id, user_id, remark } = req.body;
//             if (!req.file) {
//                 return res.status(400).json({ error: "No file uploaded" });
//             }

//             // Check if task_id exists before inserting the document
//             const taskExists = await Task.findByPk(task_id);
//             if (!taskExists) {
//                 return res.status(400).json({ error: `Task with ID ${task_id} does not exist` });
//             }

//             let fileExt = path.extname(req.file.originalname);
//             let originalName = path.parse(req.file.originalname).name;
//             let timestamp = Date.now();

//             // Remove previous versioning (_vX_TIMESTAMP) if exists
//             const cleanFileName = originalName.replace(/_v\d+_\d+$/, "");

//             // Define task-specific directory
//             const taskFolder = path.join("uploads", task_id);
//             if (!fs.existsSync(taskFolder)) {
//                 fs.mkdirSync(taskFolder, { recursive: true });
//             }

//             // Get existing files for the task
//             const existingFiles = fs.readdirSync(taskFolder);
//             let version = 1;

//             // Find highest version number for the file
//             const versionRegex = new RegExp(`^${cleanFileName}_v(\\d+)_\\d+\\${fileExt}$`);

//             for (const file of existingFiles) {
//                 const match = file.match(versionRegex);
//                 if (match) {
//                     const existingVersion = parseInt(match[1], 10);
//                     version = Math.max(version, existingVersion + 1);
//                 }
//             }

//             // Create new versioned file name
//             const newFileName = `${cleanFileName}_v${version}_${timestamp}${fileExt}`;
//             const filePath = path.join(taskFolder, newFileName);

//             // Move uploaded file to the task folder
//             fs.renameSync(req.file.path, filePath);

//             // Save file details in DB
//             const document = await Document.create({
//                 task_id,
//                 user_id,
//                 file_name: newFileName,
//                 file_path: filePath,
//                 remark,
//             });

//             res.status(201).json({ message: "File uploaded successfully", document });
//         });
//     } catch (error) {
//         console.error("Error while uploading document:", error);

//         // Handle specific database errors
//         if (error.name === "SequelizeForeignKeyConstraintError") {
//             return res.status(400).json({ error: "Invalid task_id. Task does not exist." });
//         }

//         res.status(500).json({ error: "Internal server error." });
//     }
// };






// export const getDocumentsByTask = async (req, res) => {
//     try {
//         const { task_id } = req.params;
//         const documents = await Document.findAll({ where: { task_id } });

//         if (!documents || documents.length === 0) {
//             return res.status(404).json({ message: "No documents found for the given task ID." });
//         }

//         // Convert file path to URL format
//         const documentsWithUrls = documents.map(doc => ({
//             ...doc.toJSON(),
//             file_url: `${req.protocol}://${req.get("host")}/api/${doc.file_path}`
//         }));

//         res.json(documentsWithUrls);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


// API to Delete Document


// export const deleteDocument = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const currentUserId = req.user.id; // From auth middleware

//         const document = await Document.findByPk(id);
//         if (!document || document.is_deleted) {
//             return res.status(404).json({ error: "Document not found or already deleted" });
//         }

//         const documentOwner = await User.scope('all').findByPk(document.user_id);
//         const currentUser = await User.findByPk(currentUserId);

//         // ✅ Allow if user is the uploader
//         if (currentUserId === document.user_id) {
//             return await softDelete(document, res);
//         }

//         const currentRole = await Role.findByPk(currentUser.role_id);
//         const ownerRole = await Role.findByPk(documentOwner?.role_id); // Optional chaining in case user was deleted

//         const currentRoleName = currentRole?.name?.toLowerCase();

//         // ✅ Allow System Super Admin or Super Admin
//         if (["system super admin", "super admin"].includes(currentRoleName)) {
//             return await softDelete(document, res);
//         }

//         // ✅ Allow if current user has higher role than uploader
//         const higherRoles = await getAllHigherRoleIds(ownerRole?.id);
//         const isHigher = higherRoles.includes(currentRole.id);

//         if (!isHigher) {
//             return res.status(403).json({ error: "You do not have permission to delete this document" });
//         }

//         return await softDelete(document, res);

//     } catch (error) {
//         console.error("Error deleting document:", error);
//         res.status(500).json({ error: error.message });
//     }
// };