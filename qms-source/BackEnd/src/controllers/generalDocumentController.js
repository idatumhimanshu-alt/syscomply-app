// controllers/generalDocumentController.js
import GeneralDocument from '../models/GeneralDocument.js';
import GeneralDocumentFolder from '../models/GeneralDocumentFolder.js';
import multer from "multer";
import User from "../models/User.js";
import Role from "../models/Role.js";
import path from 'path';
import fs from 'fs';


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

const fileFilter = (req, file, cb) => {
  cb(null, true); // Accept all file types
};

// Upload middleware
const upload = multer({ storage, fileFilter });

async function buildFullFolderPath(parent_folder_id) {
  let folders = [];
  
  while (parent_folder_id) {
    const folder = await GeneralDocumentFolder.findByPk(parent_folder_id);
    if (!folder) break; // safety: stop if parent not found
    folders.unshift(folder.folder_name); // add at start
    parent_folder_id = folder.parent_folder_id;
  }
  
  return folders.join('/'); // return relative path
}

export const createFolder = async (req, res) => {
  try {
    const { parent_folder_id, folder_name, visibility_scope } = req.body;
    const created_by_user_id = req.user.id;

    console.log("Request Body while create folder:", req.body);

    const user = await User.findByPk(created_by_user_id, {
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

    const folder = await GeneralDocumentFolder.create({
      company_id,
      parent_folder_id,
      folder_name,
      visibility_scope,
      created_by_user_id
    });

    // ****** Build Full Path based on Parent Hierarchy ******
    const uploadRoot = path.join('uploads'); // base uploads folder
    const parentPath = await buildFullFolderPath(parent_folder_id);
    const fullFolderPath = parentPath ? path.join(uploadRoot, parentPath, folder_name) : path.join(uploadRoot, folder_name);

    // Check if uploads directory exists, if not create it
    if (!fs.existsSync(uploadRoot)) {
      fs.mkdirSync(uploadRoot);
    }

    // Check if full folder path exists
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true }); // recursively create all missing parent folders
      console.log(`Folder created at path: ${fullFolderPath}`);
    } else {
      console.log(`Folder already exists at path: ${fullFolderPath}`);
    }

    res.status(201).json({ success: true, folder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getFolderPathFromId = async (folder_id) => {
  const segments = [];

  let currentFolderId = folder_id;

  while (currentFolderId) {
    const folder = await GeneralDocumentFolder.findByPk(currentFolderId);
    if (!folder) break;

    // Sanitize name to avoid file system issues
    const safeName = folder.folder_name   ;          //.replace(/[<>:"/\\|?*]/g, "_");
    segments.unshift(safeName);

    currentFolderId = folder.parent_folder_id;
  }

  return path.join("uploads", ...segments); // Final upload path
};

export const uploadGeneralDocument = async (req, res) => {
  try {
    upload.array("documents")(req, res, async function (err) {
      if (err) return res.status(400).json({ error: err.message });

      const { folder_id, visibility_scope } = req.body;
      if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

      if (!folder_id || !visibility_scope) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const user_id = req.user.id;

      const user = await User.findByPk(user_id, {
        include: [{ model: Role, attributes: ["name"], required: true }],
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = user.Role ? user.Role.name : null;
      let company_id;

      if (userRole === "System Super Admin") {
        company_id = req.body.company_id;
        if (!company_id) {
          return res.status(400).json({
            error: "Company ID is required for System Super Admin",
          });
        }
      } else {
        company_id = req.user.company;
        if (!company_id) {
          return res.status(400).json({
            error:
              "Company ID is not assigned to your account. Contact the administrator.",
          });
        }
      }

      const folderPath = await getFolderPathFromId(folder_id);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const existingFiles = fs.readdirSync(folderPath);
      const savedDocuments = [];

      for (const file of req.files) {
        const fileExt = path.extname(file.originalname);
        const originalName = path.parse(file.originalname).name;
        const cleanFileName = originalName.replace(/_v\d+_\d+$/, "");
        const timestamp = Date.now();

        let version = 1;
        const versionRegex = new RegExp(
          `^${cleanFileName}_v(\\d+)_\\d+\\${fileExt}$`
        );

        for (const existingFile of existingFiles) {
          const match = existingFile.match(versionRegex);
          if (match) {
            const existingVersion = parseInt(match[1], 10);
            if (existingVersion >= version) {
              version = existingVersion + 1;
            }
          }
        }

        const newFileName = `${cleanFileName}_v${version}_${timestamp}${fileExt}`;
        const filePath = path.join(folderPath, newFileName);

        fs.renameSync(file.path, filePath);

        const document = await GeneralDocument.create({
          company_id,
          folder_id,
          document_name: newFileName,
          file_path: filePath.replace(/\\/g, "/"),
          visibility_scope,
          created_by_user_id: user_id,
        });

        savedDocuments.push(document);
      }

      res.status(201).json({
        message: "Documents uploaded successfully.",
        documents: savedDocuments,
      });
    });
  } catch (error) {
    console.error("Error while uploading general documents:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


// export const uploadGeneralDocument = async (req, res) => {
//   console.log("Request body before upload :",req.body);
//     try {
//         upload.single("document")(req, res, async function (err) {
//             if (err) return res.status(400).json({ error: err.message });

//             const { folder_id, visibility_scope } = req.body;
//             if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//             if ( !folder_id || !visibility_scope) {
//                 return res.status(400).json({ error: "Missing required fields." });
//             }
//            let user_id = req.user.id;
            
//     console.log("Request Body while upload document:", req.body);

//     const user = await User.findByPk(user_id, {
//       include: [{ model: Role, attributes: ["name"], required: true }]
//     });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const userRole = user.Role ? user.Role.name : null;
//     let company_id;

//     if (userRole === "System Super Admin") {
//       company_id = req.body.company_id;
//       if (!company_id) {
//         return res.status(400).json({ error: "Company ID is required for System Super Admin" });
//       }
//     } else {
//       company_id = req.user.company;
//       if (!company_id) {
//         return res.status(400).json({ error: "Company ID is not assigned to your account. Contact the administrator." });
//       }
//     }

//             const fileExt = path.extname(req.file.originalname);
//             const originalName = path.parse(req.file.originalname).name;
//             const timestamp = Date.now();

//             const cleanFileName = originalName.replace(/_v\d+_\d+$/, ""); // Remove any previous _v pattern
//             const folderPath = await getFolderPathFromId(folder_id);

            

//             if (!fs.existsSync(folderPath)) {
//                 fs.mkdirSync(folderPath, { recursive: true });
//             }

//             const existingFiles = fs.readdirSync(folderPath);
//             let version = 1;

//             const versionRegex = new RegExp(`^${cleanFileName}_v(\\d+)_\\d+\\${fileExt}$`);

//             for (const file of existingFiles) {
//                 const match = file.match(versionRegex);
//                 if (match) {
//                     const existingVersion = parseInt(match[1], 10);
//                     if (existingVersion >= version) {
//                         version = existingVersion + 1;
//                     }
//                 }
//             }

//             const newFileName = `${cleanFileName}_v${version}_${timestamp}${fileExt}`;
//             const filePath = path.join(folderPath, newFileName);

//             fs.renameSync(req.file.path, filePath);

//             console.log("Data while upload general document ",req.body);

//             const document = await GeneralDocument.create({
//                 company_id,
//                 folder_id,
//                 document_name: newFileName,
//                 file_path: filePath.replace(/\\/g, "/"), // Windows path fix
//                 visibility_scope,
//                 created_by_user_id: user_id,
//             });

//             res.status(201).json({ message: "General Document uploaded successfully.", document });
//         });
//     } catch (error) {
//         console.error("Error while uploading general document:", error);
//         res.status(500).json({ error: "Internal server error." });
//     }
// };

const findManagers = async (userId, managers = new Set()) => {
  const user = await User.findByPk(userId);
  if (user && user.reportTo) {
    managers.add(user.reportTo);
    await findManagers(user.reportTo, managers);
  }
  return Array.from(managers);
};

const findSubordinates = async (userId, subordinates = new Set()) => {
  const users = await User.findAll({ where: { reportTo: userId } });
  for (const user of users) {
    subordinates.add(user.id);
    const deeperSubs = await findSubordinates(user.id, subordinates);
    deeperSubs.forEach(id => subordinates.add(id));
  }
  return Array.from(subordinates);
};

export const listDocuments = async (req, res) => {
  try {
    let { folderId } = req.params;
    const requestingUserId = req.user.id;

    if (folderId === 'null') {
      folderId = null;
    }

    const folderWhereCondition = {
      parent_folder_id: folderId
    };
    const documentWhereCondition = {
      folder_id: folderId
    };

    const allFolders = await GeneralDocumentFolder.findAll({ where: folderWhereCondition });

    const allDocuments = await GeneralDocument.findAll({
      where: documentWhereCondition,
      // include: [
      //   {
      //     model: User.scope('all')
      //   }
      //]
    });

    const accessibleFolders = [];
    for (const folder of allFolders) {
      const creatorId = folder.created_by_user_id;

      if (folder.visibility_scope === "all") {
        accessibleFolders.push(folder);
      } else if (folder.visibility_scope === "private" && creatorId === requestingUserId) {
        accessibleFolders.push(folder);
      } else if (folder.visibility_scope === "above") {
        const managersOfCreator = await findManagers(creatorId);
        managersOfCreator.push(creatorId);
        if (managersOfCreator.includes(requestingUserId)) {
          accessibleFolders.push(folder);
        }
      } else if (folder.visibility_scope === "below") {
        const subsOfCreator = await findSubordinates(creatorId);
        subsOfCreator.push(creatorId);
        if (subsOfCreator.includes(requestingUserId)) {
          accessibleFolders.push(folder);
        }
      }
    }

    const accessibleDocuments = [];
    for (const doc of allDocuments) {
      const creatorId = doc.created_by_user_id;

      let isAccessible = false;
      if (doc.visibility_scope === "all") {
        isAccessible = true;
      } else if (doc.visibility_scope === "private" && creatorId === requestingUserId) {
        isAccessible = true;
      } else if (doc.visibility_scope === "above") {
        const managersOfCreator = await findManagers(creatorId);
        managersOfCreator.push(creatorId);
        if (managersOfCreator.includes(requestingUserId)) {
          isAccessible = true;
        }
      } else if (doc.visibility_scope === "below") {
        const subsOfCreator = await findSubordinates(creatorId);
        subsOfCreator.push(creatorId);
        if (subsOfCreator.includes(requestingUserId)) {
          isAccessible = true;
        }
      }

      if (isAccessible) {
        const fullDoc = doc.toJSON();
        fullDoc.file_url = `${req.protocol}://${req.get("host")}/api/${doc.file_path}`;
        fullDoc.uploaded_by = doc.uploader ? doc.uploader.name : "Unknown";
        accessibleDocuments.push(fullDoc);
      }
    }

    res.status(200).json({
      success: true,
      folders: accessibleFolders,
      documents: accessibleDocuments
    });

  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateFolder = async (req, res) => {
  try {
    const { folder_id, folder_name, visibility_scope } = req.body;
    const user_id = req.user.id;

    if (!folder_id) {
      return res.status(400).json({ error: "Folder ID is required." });
    }

    const folder = await GeneralDocumentFolder.findByPk(folder_id);
    if (!folder) {
      return res.status(404).json({ error: "Folder not found." });
    }

    if (folder.created_by_user_id !== user_id) {
      return res.status(403).json({ error: "You are not authorized to update this folder. Only the creator can make changes." });
    }

    if (folder_name) folder.folder_name = folder_name;
    if (visibility_scope) folder.visibility_scope = visibility_scope;

    await folder.save();

    res.status(200).json({ message: "Folder updated successfully.", folder });
  } catch (error) {
    console.error("Error while updating folder:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { document_id, document_name, visibility_scope } = req.body;
    const user_id = req.user.id;

    console.log("Body while update document ",req.body);
    
    if (!document_id) {
      return res.status(400).json({ error: "Document ID is required." });
    }

    const document = await GeneralDocument.findByPk(document_id);
    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    if (document.created_by_user_id !== user_id) {
      return res.status(403).json({ error: "You are not authorized to update this document. Only the creator can make changes." });
    }

    if (document_name) document.document_name = document_name;
    if (visibility_scope) document.visibility_scope = visibility_scope;

    await document.save();

    res.status(200).json({ message: "Document updated successfully.", document });
  } catch (error) {
    console.error("Error while updating document:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


export const deleteDocument = async (req, res) => {
  try {
    const { document_id } = req.params; // Fixed typo
    const userId = req.user.id;
    console.log("Delete document called for document_id ",document_id);
    const document = await GeneralDocument.findByPk(document_id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }


    if (document.created_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this document.'
      });
    }

    const originalPath = document.file_path;
    const fileName = path.basename(originalPath);

    // Reconstruct deleted_documents path
    const deletedDir = path.join("deleted_documents", path.dirname(originalPath).replace(/^uploads[\/\\]?/, ""));
    if (!fs.existsSync(deletedDir)) {
      fs.mkdirSync(deletedDir, { recursive: true });
    }

    const deletedPath = path.join(deletedDir, fileName);

    // Move the file
    if (fs.existsSync(originalPath)) {
      fs.renameSync(originalPath, deletedPath);
    }

    // Soft delete (paranoid mode handles this)
    await document.destroy();

    res.status(200).json({
      success: true,
      message: 'Document soft deleted and moved to deleted_documents folder.'
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { folder_id } = req.params;
    const userId = req.user.id;

    // 1. Find the folder
    const folder = await GeneralDocumentFolder.findByPk(folder_id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }


    
    if (folder.created_by_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this document.'
      });
    }
    // 2. Recursively fetch all child folder IDs
    const getAllSubfolderIds = async (parentId) => {
      const subfolders = await GeneralDocumentFolder.findAll({ where: { parent_folder_id: parentId } });
      const ids = subfolders.map(f => f.id);

      for (const subfolder of subfolders) {
        const nestedIds = await getAllSubfolderIds(subfolder.id);
        ids.push(...nestedIds);
      }

      return ids;
    };

    const allFolderIds = [folder.id, ...(await getAllSubfolderIds(folder.id))];

    // 3. Check if any document exists in any of those folders
    const documentCount = await GeneralDocument.count({
      where: {
        folder_id: allFolderIds
      }
    });

    if (documentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete folder. One or more documents exist in this folder or its subfolders. Please delete them first.'
      });
    }

    // 4. Soft delete the folder
    await folder.destroy();

    res.status(200).json({ success: true, message: 'Folder deleted successfully.' });

  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//  