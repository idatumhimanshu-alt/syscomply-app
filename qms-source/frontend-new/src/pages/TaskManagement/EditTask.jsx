import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";
import {
  TextField,
  Button,
  Paper,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Chip,
  Grid2,
  Box,
  Tooltip,
  Typography,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import "../../styles/EditTask.css";
let Doc_moduleId = "cb5010bc-83fd-4409-9845-bbba4ceda9c8";
let taskAssignment_ModuleId = "8530da98-7369-4ab7-9400-37cf4019e148";
let User_Moduleid = "bd168912-e40c-48e3-b3d1-440a3e129d52";
let Task_moduleId = "1f0f190d-3a83-421c-af98-5d081100230e";

const EditTask = () => {
  const { moduleId, taskId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [isViewDocumentsPopupOpen, setIsViewDocumentsPopupOpen] =
    useState(false);
  const [files, setFiles] = useState([]);
  const [fileComment, setFileComment] = useState("");
  const [originalTask, setOriginalTask] = useState(null);
  const [open, setOpen] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({});
  const location = useLocation();
  const selectedIterationId = location.state?.iterationId || "";
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  let company_id = sessionStorage.getItem("selectedCompany"); // Get company_id from sessionStorage

  const [task, setTask] = useState({
    auditee: "",
    area: "",
    name: "",
    notes: "",
    description: "",
    standard: "",
    task_type: " ",
    // expected_artifact: "",
    // actual: " ",
    compliance: "",
    status: "",
    priority: "",
    responsibility: "",
    action_to_be_taken: "",
    document_reference: "",
    document: "",
    Checklist_Item: "",
    Type_of_Finding: "",
    RCA_Details: "",
    Planned_Completion_Date: "",
    Actual_Completion_Date: "",
    clause_number: "",
  });

  // Fetch task details
  useEffect(() => {
    if (!taskId || !moduleId) {
      toast.error("Invalid task details.");
      navigate("/tasks");
      return;
    }

    const fetchTask = async () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/tasks/${moduleId}/${taskId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTask(response.data);
        setOriginalTask(response.data);
      } catch (error) {
        toast.error("Failed to load task details.");
      }
    };

    fetchTask();
  }, [taskId, moduleId, navigate]);

  // Handle input change
  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  // Handle file change
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Handle file comment change
  const handleFileCommentChange = (e) => {
    setFileComment(e.target.value);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");

    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const isTaskChanged =
        JSON.stringify(task) !== JSON.stringify(originalTask);
      const isAssigneeChanged =
        JSON.stringify(selectedUsers.map((user) => user.id)) !==
        JSON.stringify(assignedUsers.map((user) => user.id));
      console.log("Selected Users:", selectedUsers);
      console.log("Task update check:", { isTaskChanged, isAssigneeChanged });

      // 1. Task Update
      if (isTaskChanged) {
        const { assigned_users, ...taskWithoutAssignments } = task;

        const cleanedTaskPayload = Object.fromEntries(
          Object.entries(taskWithoutAssignments).filter(
            ([, value]) => value !== null && value !== undefined && value !== ""
          )
        );

        await axiosInstance.put(
          `/tasks/${Task_moduleId}/${taskId}`,
          cleanedTaskPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log(" Task updated:", cleanedTaskPayload);
      }

      // 2. Assignee Update - always try if changed
      try {
        if (isAssigneeChanged && selectedUsers.length > 0) {
          const user_ids = selectedUsers.map((user) => user.id);
          const assignees =
            selectedUsers.length > 0
              ? selectedUsers.map((user) => user.id)
              : assignedUsers.map((user) => user.id); // fallback

          console.log(" Updating assignees:", user_ids);
          console.log(" Updating assignees:", assignees);

          if (assignees.length === 0) {
            console.warn(" No assignees selected!");
          }
          console.log("taskId:", taskId);
          console.log("taskAssignment_ModuleId:", taskAssignment_ModuleId);

          await axiosInstance.put(
            `/task-assignments/${taskAssignment_ModuleId}`,
            {
              task_id: taskId,
              new_assignees: assignees,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          console.log(" Assignees updated");
        }
      } catch (err) {
        console.error(" Failed to update assignees:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          full: err,
        });
        toast.error(err.response?.data?.error || "Failed to update assignees");
      }

      // 3. File Upload - always try if file exists
      try {
        if (files.length > 0) {
          const fileFormData = new FormData();
          files.forEach((file) => fileFormData.append("documents", file)); // updated key name
          fileFormData.append("task_id", taskId);
          fileFormData.append("user_id", userId);
          fileFormData.append("remark", fileComment || "");
          fileFormData.append("company_id", company_id);

          console.log(" Uploading file:", {
            task_id: taskId,
            user_id: userId,
            file_name: files.name,
            remark: fileComment,
          });

          await axiosInstance.post(`/documents/${Doc_moduleId}`, fileFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { company_id },
          });

          console.log(" File uploaded");

          // Clear uploaded files and comment
          setFiles([]);
          setFileComment("");
        }
      } catch (err) {
        console.error(" Failed to upload file:", err);
      }

      toast.success("Task updated successfully");
      navigate("/tasks", { state: { iterationId: selectedIterationId } });
    } catch (error) {
      console.error(" Error updating task:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        full: error,
      });

      toast.error(error.response?.data?.error || "Failed to update task");
    }
  };

  const fetchDocumentsByTask = async (taskId) => {
    console.log("Fetching documents for task ID:", taskId);

    // Ensure taskId is valid before making the request
    if (!taskId) {
      console.error("Task ID is missing or undefined");
      return [];
    }

    try {
      let token = localStorage.getItem("jwtToken");
      console.log("Doc Module ID:", Doc_moduleId);
      console.log("Authorization Token:", token ? "Present" : "Missing");

      const response = await axiosInstance.get(
        `/documents/${Doc_moduleId}/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Ensure response and data exist
      if (response && response.data) {
        const data = response.data;
        setDocuments(Array.isArray(data) ? data : []);
        console.log("Documents fetched successfully:", data);
        return data;
      } else {
        console.error("No data received from API");
        setDocuments([]);
        return [];
      }
    } catch (error) {
      console.error(
        "Error fetching documents:",
        error.response?.data || error.message
      );
      setDocuments([]);
      return [];
    }
  };

  const handleViewDocuments = async () => {
    console.log("Opening View Documents Dialog"); // Debugging log
    setIsViewDocumentsPopupOpen(true);
    await fetchDocumentsByTask(taskId); // Fetch documents before opening
  };

  const handleDelete = async (taskId, documentId) => {
    if (!Doc_moduleId || !documentId) {
      toast.error("Missing document module ID or document ID.");
      return;
    }

    let token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      console.log("Deleting document:", { Doc_moduleId, documentId });

      await axiosInstance.delete(`/documents/${Doc_moduleId}/${documentId}`, {
        headers,
      });

      toast.success("Document deleted successfully!");

      // Remove the deleted document from the state
      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc.id !== documentId)
      );

      setOpen(false);
    } catch (error) {
      console.error("Error deleting document:", error.response?.data || error);
      toast.error("Failed to delete document.");
    }
  };

  const fetchAssignedUsers = async (taskId) => {
    try {
      let token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }

      console.log("Fetching assigned users for task:", taskId);
      console.log("Using token:", token);
      console.log("Task Assignment Module ID:", taskAssignment_ModuleId);
      console.log("Company ID:", company_id);

      const response = await axiosInstance.get(
        `/task-assignments/${taskAssignment_ModuleId}/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { company_id },
        }
      );

      console.log("Assigned Users Response:", response.data);

      const assignedUsers = response.data[0]?.Assignees || [];

      // setTaskAssignments((prev) => ({
      //   ...prev,
      //   [taskId]: assignedUsers,
      // }));

      // setAssignedUsers(assignedUsers);

      const enrichedUsers = assignedUsers.map((assigned) => {
        if (!assigned.id) return assigned;
        const fullUser = allUsers.find((u) => u.id === assigned.id);
        return fullUser ? { ...fullUser, ...assigned } : assigned;
      });

      setAssignedUsers(enrichedUsers);
      setSelectedUsers(enrichedUsers);

      setTaskAssignments((prev) => ({
        ...prev,
        [taskId]: enrichedUsers,
      }));

      {
        assignedUsers && assignedUsers.length > 0 ? (
          assignedUsers.map((user) => (
            <Chip
              key={user.id}
              label={user.name || "Unknown"}
              style={{ margin: "2px" }}
            />
          ))
        ) : (
          <Typography variant="body2" color="textSecondary">
            No assigned users
          </Typography>
        );
      }

      console.log("API Response Keys:", Object.keys(response.data));

      console.log("Extracted Assigned Users:", assignedUsers);
    } catch (error) {
      console.error("Error fetching assigned users:", error);
    }
  };

  const fetchUsers = async () => {
    let token = localStorage.getItem("jwtToken");

    try {
      const response = await axiosInstance.get(
        `/users/${User_Moduleid}//getAssignableUser`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { company_id },
        }
      );
      setAllUsers(response.data);
      console.log("All Users:", response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleUserChange = (newValue) => {
    setSelectedUsers(newValue);
  };

  useEffect(() => {
    const loadUsersAndAssignments = async () => {
      await fetchUsers(); // sets allUsers
    };

    if (task.id) {
      loadUsersAndAssignments();
    }
  }, [task.id]);

  useEffect(() => {
    if (task.id && allUsers.length > 0 && assignedUsers.length === 0) {
      fetchAssignedUsers(task.id);
    }
  }, [task.id, allUsers]);

  const handleEditClick = (doc) => {
    const parsedDate =
      doc.issue_date && !isNaN(new Date(doc.issue_date).getTime())
        ? new Date(doc.issue_date).toISOString().split("T")[0]
        : "";
    setSelectedDocument({ ...doc, issue_date: parsedDate });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const { id, remark, issue_date, module_id } = selectedDocument;
      const token = localStorage.getItem("jwtToken");

      await axiosInstance.put(
        `/documents/${Doc_moduleId}/${id}`,
        { remark, issue_date },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Document updated successfully");

      // Refresh document list after edit
      const updatedDocs = await fetchDocumentsByTask(task.id);
      setDocuments(updatedDocs);
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update document", error);
      toast.error("Failed to update document");
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "0.5rem",
        padding: 2,
        marginLeft: 4,
        mb: 2,
        marginRight: 2,
      }}
    >
      <Typography
        variant="h3"
        fontWeight={"'bold"}
        sx={{ textAlign: "center" }}
      >
        Update Task
      </Typography>

      <form onSubmit={handleUpdate}>
        <Grid2 container spacing={4} mt={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Auditee"
              name="auditee"
              value={task.auditee}
              onChange={handleChange}
              margin="normal"
              required
            >
              {[
                "CISO",
                "HOD-HR",
                "HOD-Facility Admin",
                "HOD-IT",
                "HOD-Purchase",
                "IT Administration",
                "Project Manager - SDLC",
              ].map((auditee) => (
                <MenuItem key={auditee} value={auditee}>
                  {auditee}
                </MenuItem>
              ))}
            </TextField>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Area"
              name="area"
              value={task.area}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Checklist Item"
              name="Checklist_Item"
              value={task.Checklist_Item}
              onChange={handleChange}
              margin="normal"
              required
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={task.notes}
              onChange={handleChange}
              margin="normal"
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Type of Finding"
              name="Type_of_Finding"
              value={task.Type_of_Finding}
              onChange={handleChange}
              margin="normal"
              required
            >
              {[
                "Compliance",
                "Observation",
                "Non-Compliance",
                "Opportunity For Improvement",
              ].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={task.status}
              onChange={handleChange}
              margin="normal"
            >
              {[
                // "FI",
                // "PI",
                // "NI",
                // "NA",
                // "TBD",
                // "OFI",
                // "Obs",
                // "NC- Minor",
                // "NC- Major",
                "Not Done",
                "Partially Done",
                "In-Progress",
                "Largely Done",
                "Done",
                "NA",
              ].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={task.description}
              onChange={handleChange}
              margin="normal"
              multiline
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Standard"
              name="standard"
              value={task.standard}
              onChange={handleChange}
              margin="normal"
              required
              disabled
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              select
              label="Priority"
              name="priority"
              value={task.priority}
              onChange={handleChange}
              margin="normal"
            >
              {["High", "Medium", "Low"].map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </TextField>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Responsibility"
              name="responsibility"
              value={task.responsibility}
              onChange={handleChange}
              margin="normal"
              sx={{ mb: 2 }}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="RCA Details"
              name="RCA_Details"
              value={task.RCA_Details}
              onChange={handleChange}
              margin="normal"
              multiline
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Planned Completion Date"
              name="Planned_Completion_Date"
              value={
                task.Planned_Completion_Date
                  ? new Date(task.Planned_Completion_Date)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Actual Completion Date"
              name="Actual_Completion_Date"
              value={
                task.Actual_Completion_Date
                  ? new Date(task.Actual_Completion_Date)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Reference - Clause"
              name="clause_number"
              value={task.clause_number}
              onChange={handleChange}
              margin="normal"
            />
          </Grid2>

          {/* Assigned Users Dropdown */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Autocomplete
              multiple
              options={allUsers || []}
              getOptionLabel={(user) =>
                user?.name
                  ? `${user.name}${
                      user.department?.name ? ` (${user.department.name})` : ""
                    }${user.is_active ? "" : " (Inactive)"}`
                  : user?.email || "Unknown User"
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedUsers}
              onChange={(event, newValue) => {
                setSelectedUsers(newValue);
              }}
              renderOption={(props, option) => (
                <li
                  {...props}
                  style={{
                    color: option.is_active ? "inherit" : "#888",
                    fontStyle: option.is_active ? "normal" : "italic",
                  }}
                >
                  {option.name || option.email}
                  {option.department?.name
                    ? ` (${option.department.name})`
                    : ""}
                  {!option.is_active && " (Inactive)"}
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.filter(Boolean).map((option, index) => {
                  const tagProps = getTagProps({ index });
                  const { key, ...restTagProps } = tagProps;

                  return (
                    <Chip
                      key={option.id || key}
                      label={`${option.name || option.email}${
                        option.department?.name
                          ? ` (${option.department.name})`
                          : ""
                      }${option.is_active === false ? " (Inactive)" : ""}`}
                      style={{
                        backgroundColor:
                          option.is_active === false ? "#ddd" : undefined,
                        color: option.is_active === false ? "#555" : undefined,
                        fontStyle:
                          option.is_active === false ? "italic" : "normal",
                      }}
                      {...restTagProps}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Users"
                  variant="outlined"
                  fullWidth
                />
              )}
              style={{ minWidth: "250px" }}
            />
          </Grid2>

          {/* File Upload Section */}
          <div className="file-upload-section">
            <label className="custom-file-input">
              <input type="file" multiple onChange={handleFileChange} />
              <span className="custom-file-button">Choose File</span>
            </label>
            {files.length > 0 && (
              <span className="file-name">
                {files.map((file) => file.name).join(", ")}
              </span>
            )}
            <TextField
              fullWidth
              label="File Comment"
              value={fileComment}
              onChange={handleFileCommentChange}
              margin="normal"
              placeholder="Enter a comment for the uploaded file"
            />
          </div>

          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              const docs = await fetchDocumentsByTask(task.id);

              if (!docs || docs.length === 0) {
                // Show alert toast instead of opening popup
                toast.warning("No documents available.");
                return;
              }

              setDocuments(docs || []);
              setSelectedTask(task.id);
              setIsViewDocumentsPopupOpen(true);
            }}
          >
            View Document
          </Button>

          <Grid2 size={{ xs: 12 }}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="contained" color="primary" type="submit">
                Update Task
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={() =>
                  navigate("/tasks", {
                    state: { iterationId: selectedIterationId },
                  })
                }
              >
                Cancel
              </Button>
            </Box>
          </Grid2>
        </Grid2>
      </form>

      {isViewDocumentsPopupOpen && (
        <Dialog
          open={isViewDocumentsPopupOpen}
          onClose={() => setIsViewDocumentsPopupOpen(false)}
          fullWidth
          maxWidth="xl"
          style={{ maxWidth: "90vw" }}
        >
          <DialogTitle>View Uploaded Documents</DialogTitle>

          <DialogContent>
            {documents && Array.isArray(documents) && documents.length > 0 ? (
              <Box sx={{ width: "100%" }}>
                <DataGrid
                  rows={documents.map((doc, index) => ({
                    id: doc.id || index,
                    file_name: doc.file_name,
                    remark: doc.remark || "No remark provided",
                    uploader: doc.uploader?.name || "Unknown",
                    uploaded_at: doc.uploaded_at
                      ? new Date(doc.uploaded_at).toLocaleString()
                      : "N/A",
                    issue_version:
                      doc.issue_version ||
                      (doc.file_name?.match(/_v(\d+)_/)?.[1]
                        ? `v${doc.file_name.match(/_v(\d+)_/)[1]}`
                        : "N/A"),
                    issue_date: doc.issue_date
                      ? new Date(doc.issue_date).toLocaleDateString()
                      : "N/A",
                    file_url: doc.file_url,
                    module_id: doc.module_id,
                  }))}
                  columns={[
                    {
                      field: "file_name",
                      headerName: "Document File Name",
                      flex: 1,
                    },
                    {
                      field: "remark",
                      headerName: "Remark",
                      flex: 1,
                    },
                    {
                      field: "uploader",
                      headerName: "Uploaded by",
                      flex: 1,
                    },
                    {
                      field: "uploaded_at",
                      headerName: "Uploaded on date",
                      flex: 1,
                    },
                    {
                      field: "file_url",
                      headerName: "File Link",
                      flex: 1,
                      renderCell: (params) => (
                        <a
                          href={params.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1976d2", textDecoration: "none" }}
                        >
                          Open File
                        </a>
                      ),
                    },
                    {
                      field: "actions",
                      headerName: "Actions",
                      flex: 1,
                      renderCell: (params) => (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              onClick={() => handleEditClick(params.row)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() =>
                                handleDelete(
                                  params.row.module_id,
                                  params.row.id
                                )
                              }
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ),
                    },

                    {
                      field: "id",
                      headerName: "Document ID",
                      flex: 1,
                      renderCell: (params) => {
                        const fullId = params.value || "N/A";
                        const truncatedId =
                          fullId.length > 16
                            ? `${fullId.slice(0, 8)}...${fullId.slice(-6)}`
                            : fullId;

                        return (
                          <Tooltip title={fullId} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                width: "100%",
                              }}
                            >
                              {truncatedId}
                            </Typography>
                          </Tooltip>
                        );
                      },
                    },
                    {
                      field: "issue_version",
                      headerName: "Document Issue Version",
                      flex: 1,
                    },
                    {
                      field: "issue_date",
                      headerName: "Document Issue Date",
                      flex: 1,
                    },
                  ]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 5, page: 0 },
                    },
                  }}
                  pageSizeOptions={[5, 10, 25]}
                  disableRowSelectionOnClick
                />
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No documents available.
              </Typography>
            )}
          </DialogContent>

          <DialogActions className="button-group">
            <Button
              className="MuiButton-outlinedSecondary"
              onClick={() => setIsViewDocumentsPopupOpen(false)}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <TextField
            label="Remark"
            fullWidth
            margin="dense"
            value={selectedDocument?.remark || ""}
            onChange={(e) =>
              setSelectedDocument({
                ...selectedDocument,
                remark: e.target.value,
              })
            }
          />
          <TextField
            label="Issue Date"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={selectedDocument?.issue_date || ""}
            onChange={(e) =>
              setSelectedDocument({
                ...selectedDocument,
                issue_date: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EditTask;
