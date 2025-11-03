import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputLabel,
  Grid,
  Paper,
  Divider,
  Menu,
  MenuItem,
  Breadcrumbs,
  FormControl,
  Select,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack,
  CreateNewFolder,
  Folder as FolderIcon,
  UploadFile,
  InsertDriveFile,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import axiosInstance from "../../services/axiosinstance";
import { toast, ToastContainer } from "react-toastify";

const MODULE_ID = "cb5010bc-83fd-4409-9845-bbba4ceda9c8";

const DocumentManagementPage = () => {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [folderNames, setFolderNames] = useState([]);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [visibilityScope, setVisibilityScope] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [contextItem, setContextItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editScope, setEditScope] = useState("all");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFolders(currentFolderId);
  }, [currentFolderId]);

  const fetchFolders = async (folderId) => {
    const token = localStorage.getItem("jwtToken");
    const company_id = sessionStorage.getItem("selectedCompany"); // Get company ID from sessionStorage
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axiosInstance.get(
        `/generalDocuments/${MODULE_ID}/${folderId || "null"}`,
        {
          headers,
          params: { company_id }, // Passing the company_id here
        }
      );
      setFolders(res.data.folders || []);
      setDocuments(res.data.documents || []);
      if (res.data.current_folder_name) {
        setFolderNames((prev) => [...prev, res.data.current_folder_name]);
      }
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err);
    }
  };

  const handleOpenFolder = (folderId, folderName) => {
    setFolderStack((prev) => [...prev, currentFolderId]);
    setFolderNames((prev) => [...prev, folderName]);
    setCurrentFolderId(folderId);
  };

  const handleGoBack = () => {
    const newStack = [...folderStack];
    const prevFolderId = newStack.pop();
    const newNames = [...folderNames];
    newNames.pop();
    setFolderNames(newNames);
    setFolderStack(newStack);
    setCurrentFolderId(prevFolderId || null);
  };

  const handleCreateFolder = async () => {
    const company_id = sessionStorage.getItem("selectedCompany"); // Get company ID from sessionStorage
    if (!company_id) {
      toast.error("Company ID is required. Please select a company.");
      return;
    }

    if (!newFolderName) return;
    const token = localStorage.getItem("jwtToken");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axiosInstance.post(
        `/generalDocuments/folder/${MODULE_ID}`,
        {
          parent_folder_id: currentFolderId,
          folder_name: newFolderName,
          visibility_scope: visibilityScope, // Include visibility scope here
          company_id, // Pass the company_id in the request body
        },
        {
          headers,
        }
      );

      setCreateFolderOpen(false);
      setNewFolderName("");
      setVisibilityScope("all"); // Reset visibility scope after creation
      toast.success("Folder created successfully.");
      fetchFolders(currentFolderId);
    } catch (error) {
      console.error("Failed to create folder:", error.response?.data || error);
      toast.error("Failed to create folder.");
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFiles.length) return;

    const company_id = sessionStorage.getItem("selectedCompany");
    if (!company_id) {
      toast.error("Company ID is missing.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("documents", file); 
    });

    formData.append("company_id", company_id); 
    formData.append("folder_id", currentFolderId);
    formData.append("visibility_scope", visibilityScope);

    setUploading(true); //  Show progress indicator

    try {
      const token = localStorage.getItem("jwtToken");
      await axiosInstance.post(
        `/generalDocuments/document/${MODULE_ID}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Documents uploaded successfully.");
      fetchFolders(currentFolderId);
      setUploadOpen(false);
      setSelectedFiles([]);
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err);
      toast.error(err.response?.data?.error || "Document upload failed.");
    } finally {
      setUploading(false); //  Hide progress
    }
  };

  const handleDeleteItem = async (itemId, isFolder) => {
    const token = localStorage.getItem("jwtToken");
    try {
      const company_id = sessionStorage.getItem("selectedCompany"); // Get company ID from sessionStorage
      if (isFolder) {
        await axiosInstance.delete(
          `/generalDocuments/folder/${MODULE_ID}/${itemId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { company_id }, // Passing the company_id here
          }
        );
        toast.success("Folder deleted successfully.");
      } else {
        await axiosInstance.delete(
          `/generalDocuments/document/${MODULE_ID}/${itemId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { company_id }, // Passing the company_id here
          }
        );
        toast.success("Document deleted successfully.");
      }
      fetchFolders(currentFolderId);
      setAnchorEl(null); // Close menu after deletion
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err);
      if (err.response?.data?.message) {
        toast.error(err.response?.data?.message);
      } else {
        toast.error("Failed to delete item.");
      }
    }
  };

  const handleOpenContextMenu = (e, item, isFolder) => {
    e.preventDefault();
    setContextItem({ item, isFolder });
    setAnchorEl(e.currentTarget);
  };

  const handleCloseContextMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        p: 4,
        backgroundColor: "#fafafa",
      }}
    >
      {/* Top Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Document Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {folderStack.length > 0 && (
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              sx={{ textTransform: "none", backgroundColor: "#6200ea" }}
            >
              Back
            </Button>
          )}
          <Tooltip title="Create a New Folder">
            <Button
              variant="contained"
              startIcon={<CreateNewFolder />}
              onClick={() => setCreateFolderOpen(true)}
              sx={{
                textTransform: "none",
                backgroundColor: "#00bcd4",
                "&:hover": { backgroundColor: "#008ba3" },
              }}
            >
              New Folder
            </Button>
          </Tooltip>
          <Tooltip title="Upload a Document">
            <Button
              variant="contained"
              startIcon={<UploadFile />}
              onClick={() => {
                if (currentFolderId) {
                  setUploadOpen(true);
                } else {
                  toast.error("Please open a folder first.");
                }
              }}
              sx={{
                textTransform: "none",
                backgroundColor: "#4caf50",
                "&:hover": { backgroundColor: "#388e3c" },
              }}
            >
              Upload
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Typography color="text.primary">Root</Typography>
        {folderNames.map((name, index) => (
          <Typography key={index} color="text.primary">
            {name}
          </Typography>
        ))}
      </Breadcrumbs>

      {/* Files & Folders */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Files & Folders
      </Typography>
      <Grid container spacing={2}>
        {folders.map((folder) => (
          <Grid item xs={6} sm={4} md={3} key={folder.id}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                textAlign: "center",
                position: "relative",
                cursor: "pointer",
                backgroundColor: "#f8f9fa",
                "&:hover": {
                  backgroundColor: "#e9ecef",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                },
              }}
              onClick={() => handleOpenFolder(folder.id, folder.folder_name)}
              onContextMenu={(e) => handleOpenContextMenu(e, folder, true)}
            >
              <FolderIcon
                sx={{
                  fontSize: 40,
                  color: "#5c6bc0",
                  "&:hover": { color: "#3f51b5" },
                  transition: "color 0.3s",
                }}
              />
              <Typography
                noWrap
                sx={{ color: "#495057", fontWeight: 400, fontSize: "0.875rem" }}
              >
                {folder.folder_name}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {documents.map((doc) => (
          <Grid item xs={6} sm={4} md={3} key={doc.id}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                textAlign: "center",
                position: "relative",
                cursor: "pointer",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
              onClick={() => {
                const backendBaseUrl = axiosInstance.defaults.baseURL;
                const relativePath = doc.file_path.replace(
                  /^uploads[\\/]+/,
                  ""
                );
                const fileUrl = `${backendBaseUrl}/uploads/${encodeURIComponent(
                  relativePath
                ).replace(/%2F/g, "/")}`;
                window.open(fileUrl, "_blank");
              }}
              onContextMenu={(e) => handleOpenContextMenu(e, doc, false)}
            >
              <InsertDriveFile sx={{ fontSize: 50 }} />
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                {doc.document_name}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu Dialog */}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseContextMenu}
      >
        <MenuItem
          onClick={() => {
            setEditDialogOpen(true);
            setEditName(
              contextItem?.item?.folder_name ||
                contextItem?.item?.document_name ||
                ""
            );
            setEditScope(contextItem?.item?.visibility_scope || "all");
            handleCloseContextMenu();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextItem.isFolder) {
              handleDeleteItem(contextItem.item.id, true);
            } else {
              handleDeleteItem(contextItem.item.id, false);
            }
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="visibility-scope-label">
              Visibility Scope
            </InputLabel>
            <Select
              labelId="visibility-scope-label"
              value={visibilityScope}
              label="Visibility Scope"
              onChange={(e) => setVisibilityScope(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="above">Above</MenuItem>
              <MenuItem value="below">Below</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFolder}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label>
              <Button variant="contained" component="span">
                Choose Files
              </Button>
              <input
                type="file"
                name="documents"
                multiple
                hidden
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
            </label>

            {selectedFiles.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Selected Files:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                  {selectedFiles.map((file, index) => (
                    <li key={index}>
                      <Typography variant="body2">{file.name}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel id="visibility-scope-label">
                Visibility Scope
              </InputLabel>
              <Select
                labelId="visibility-scope-label"
                value={visibilityScope}
                label="Visibility Scope"
                onChange={(e) => setVisibilityScope(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="above">Above</MenuItem>
                <MenuItem value="below">Below</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUploadDocument}
            disabled={uploading}
            startIcon={
              uploading && <CircularProgress size={20} color="inherit" />
            }
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Edit {contextItem?.isFolder ? "Folder" : "Document"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel id="edit-visibility-label">Visibility Scope</InputLabel>
            <Select
              labelId="edit-visibility-label"
              value={editScope}
              label="Visibility Scope"
              onChange={(e) => setEditScope(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="above">Above</MenuItem>
              <MenuItem value="below">Below</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                const company_id = sessionStorage.getItem("selectedCompany");
                const data = {
                  visibility_scope: editScope,
                  company_id,
                  ...(contextItem.isFolder
                    ? { folder_name: editName }
                    : { document_name: editName }),
                };

                if (contextItem.isFolder) {
                  await axiosInstance.put(
                    `/generalDocuments/folder/${MODULE_ID}`,
                    {
                      folder_id: contextItem.item.id,
                      ...data,
                    }
                  );
                } else {
                  await axiosInstance.put(
                    `/generalDocuments/document/${MODULE_ID}`,
                    {
                      document_id: contextItem.item.id,
                      ...data,
                    }
                  );
                }

                toast.success("Update successful.");
                setEditDialogOpen(false);
                fetchFolders(currentFolderId);
              } catch (err) {
                const errorMessage =
                  err?.response?.data?.error ||
                  err?.error ||
                  "Update failed. Please try again.";

                console.error("Update failed:", err.response?.data || err);
                toast.error(errorMessage);
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />

      {uploading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1300,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};

export default DocumentManagementPage;
