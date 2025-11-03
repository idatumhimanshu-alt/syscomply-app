import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { CircularProgress } from "@mui/material";
import {
  Paper,
  Button,
  IconButton,
  TextField,
  Box,
  Typography,
  Grid,
  Grid2,
  MenuItem,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFileOutlined,
  FilePresentOutlined,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import "../../styles/UploadPopup.css";

const TaskList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [users, setUsers] = useState([]);
  const params = useParams();
  const [taskAssignments, setTaskAssignments] = useState({});
  const [companyName, setCompanyName] = useState("");
  const [documents, setDocuments] = useState({});
  const [comments, setComments] = useState({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewDocumentsPopupOpen, setIsViewDocumentsPopupOpen] =
    useState(false);
  const [open, setOpen] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [taskChangeLog, setTaskChangeLog] = useState([]);
  const [checklistItem, setChecklistItem] = useState("");
  const scrollContentRef = useRef(null);
  const [iterations, setIterations] = useState([]);
  const location = useLocation();
  const [iterationId, setIterationId] = useState(
    location.state?.iterationId || ""
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [filters, setFilters] = useState({
    task_type: "",
    status: "",
    priority: "",
    auditee: "",
  });
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 5,
    page: 0,
  });

  const userId = localStorage.getItem("userId");
  const moduleId = "1f0f190d-3a83-421c-af98-5d081100230e";
  const Doc_moduleId = "cb5010bc-83fd-4409-9845-bbba4ceda9c8";
  const TaskChangeLog_moduleid = "2566950b-1718-4440-8b8d-d5ec94624d0f";

  useEffect(() => {
    const fetchUsersAndTasks = async () => {
      let token = localStorage.getItem("jwtToken");
      let company_id = sessionStorage.getItem("selectedCompany");
      let company_name = sessionStorage.getItem("companyname");
      let role = localStorage.getItem("userRole");
      setUserRole(role);
      setCompanyName(company_name || "");

      if (!token) {
        toast.error("Session expired! Please log in.");
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [
          usersResponse,
          tasksResponse,
          assignmentsResponse,
          iterationsResponse,
        ] = await Promise.all([
          axiosInstance.get(`/users/${moduleId}`, {
            headers,
            params: { company_id },
          }),
          axiosInstance.get(`/tasks/${moduleId}`, {
            headers,
            params: { company_id, iteration_id: iterationId || undefined },
          }),
          axiosInstance.get(`/task-assignments/${moduleId}`, {
            headers,
            params: { company_id },
          }),
          axiosInstance.get(`/iteration/${moduleId}`, {
            headers,
            params: { company_id },
          }),
        ]);

        setUsers(usersResponse.data || []);
        setTasks(
          (tasksResponse.data || []).map((task, index) => ({
            srNo: index + 1,
            ...task,
          }))
        );
        setIterations(iterationsResponse.data || []);

        const assignments = assignmentsResponse.data.reduce(
          (acc, assignment) => {
            acc[assignment.task_id] = assignment.user_ids
              .map((id) => usersResponse.data.find((user) => user.id === id))
              .filter(Boolean);
            return acc;
          },
          {}
        );

        setTaskAssignments(assignments);
      } catch (error) {
        toast.error("Failed to load data.");
        console.error("Error fetching data:", error.response?.data || error);
      }
    };

    fetchUsersAndTasks();
  }, [navigate, iterationId]);

  const handleDelete = (taskId) => {
    let token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const ConfirmDeleteToast = ({ closeToast }) => (
      <div>
        <p>Are you sure you want to delete this task?</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={async () => {
              try {
                const headers = { Authorization: `Bearer ${token}` };
                await axiosInstance.delete(`/tasks/${moduleId}/${taskId}`, {
                  headers,
                });

                toast.success("Task deleted successfully!");
                setTasks((prevTasks) =>
                  prevTasks.filter((task) => task.id !== taskId)
                );
              } catch (error) {
                console.error(
                  "Error deleting task:",
                  error.response?.data || error
                );
                toast.error("Failed to delete task. Please try again.");
              }
              closeToast(); // Close the toast after the action
            }}
          >
            Yes
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={closeToast}
          >
            No
          </Button>
        </div>
      </div>
    );

    // Show the confirmation toast
    toast.info(<ConfirmDeleteToast />, {
      autoClose: false,
      closeOnClick: false,
    });
  };

  const handleFileUpload = async (taskId) => {
    const selectedFiles = documents[taskId]; // Get selected files from the state
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select at least one file before uploading.");
      return;
    }

    let token = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    const remark = comments[taskId] || ""; // Get comment for the task

    const formData = new FormData();
    selectedFiles.forEach((f) => formData.append("documents", f)); // Append each file
    formData.append("task_id", taskId);
    formData.append("user_id", userId);
    formData.append("remark", remark);
    formData.append("company_id", sessionStorage.getItem("selectedCompany"));

    setUploading(true);

    try {
      const uploadResponse = await axiosInstance.post(
        `/documents/${Doc_moduleId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Documents uploaded successfully!");

      // Clear file input after successful upload
      setDocuments((prevDocs) => ({ ...prevDocs, [taskId]: [] }));
      setComments((prev) => ({ ...prev, [taskId]: "" })); // Clear the comment as well
      setIsPopupOpen(false); // Close the upload popup
    } catch (error) {
      console.error("Upload Failed:", error.response?.data || error);
      toast.error("Failed to upload document.");
    } finally {
      setUploading(false); // STOP loading spinner
    }
  };

  const fetchDocumentsByTask = async (taskId) => {
    try {
      let token = localStorage.getItem("jwtToken");
      const response = await axiosInstance.get(
        `/documents/${Doc_moduleId}/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;
      setDocuments(data);
      console.log("Documents fetched:", data);

      return data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
      return [];
    }
  };

  const handleDeleteDoc = async (taskId, documentId) => {
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
      await axiosInstance.delete(`/documents/${Doc_moduleId}/${documentId}`, {
        headers,
      });

      toast.success("Document deleted successfully!");
      setOpen(false);

      // Remove the deleted document from the UI
      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc.id !== documentId)
      );

      // Close the dialog after deletion
      setOpen(false);
    } catch (error) {
      console.error("Error deleting document:", error.response?.data || error);
      toast.error("Failed to delete document.");
    }
  };

  const handleViewChangeLog = async (moduleId, taskId, name) => {
    const token = localStorage.getItem("jwtToken");
    setChecklistItem(name);
    try {
      const response = await axiosInstance.get(
        `/taskChangeLog/${TaskChangeLog_moduleid}/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      console.log("Raw task changelog response:", data); // Debugging log

      if (Array.isArray(data)) {
        setTaskChangeLog(data);
      } else {
        console.warn("Expected array but got:", data);
        setTaskChangeLog([]);
      }

      setOpenLogModal(true);
    } catch (error) {
      console.error("Error fetching task changelog:", error);
      setTaskChangeLog([]);
    }
  };

  const handleDownloadLogsAsPDF = async () => {
    const input = scrollContentRef.current;
    if (!input) return;

    // Temporarily add task title inside scroll area
    const titleDiv = document.createElement("div");
    titleDiv.innerText = `Task: ${checklistItem || "Unnamed Task"}`;
    titleDiv.style.fontSize = "15px";
    titleDiv.style.fontWeight = "bold";
    titleDiv.style.marginBottom = "16px";
    titleDiv.style.textAlign = "center";
    input.prepend(titleDiv);

    // Remove scroll limitation temporarily
    const originalMaxHeight = input.style.maxHeight;
    const originalOverflow = input.style.overflow;

    input.style.maxHeight = "none";
    input.style.overflow = "visible";

    await new Promise((res) => setTimeout(res, 100)); // wait for DOM

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(checklistItem || "Task Log", 10, 15);
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add extra pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${checklistItem || "task-log"}.pdf`);

    // Restore original styles
    input.style.maxHeight = originalMaxHeight;
    input.style.overflow = originalOverflow;
  };

  const handleSaveEdit = async () => {
    try {
      const { id, remark, issue_date, module_id } = selectedDocument;
      const token = localStorage.getItem("jwtToken");

      const response = await axiosInstance.put(
        `/documents/${moduleId}/${id}`,
        { remark, issue_date },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Document updated successfully");

      // Refresh document list after edit
      const updatedDocs = await fetchDocumentsByTask(selectedTask);
      setDocuments(updatedDocs);

      setEditDialogOpen(false);
    } catch (err) {
      console.error(
        "Update failed:",
        err.response?.status,
        err.response?.data || err.message
      );
      toast.error("Failed to update document");
    }
  };

  const handleEditClick = (doc) => {
    const parsedDate =
      doc.issue_date && !isNaN(new Date(doc.issue_date).getTime())
        ? new Date(doc.issue_date).toISOString().split("T")[0]
        : ""; // fallback

    setSelectedDocument({
      ...doc,
      issue_date: parsedDate,
    });

    setEditDialogOpen(true);
  };

  const formatDateForInput = (dateValue) => {
    const date = new Date(dateValue);
    return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : "";
  };

  // Datagrid columns
  const columns = [
    {
      field: "srNo",
      headerName: "Sr.No.",
      width: 80,
      sortable: false,
      filterable: false,
    },
    { field: "auditee", headerName: "Auditee", width: 150 },
    { field: "area", headerName: "Area", width: 150 },
    { field: "Checklist_Item", headerName: "Checklist Item", width: 300 },
    { field: "notes", headerName: "Notes", width: 180 },
    { field: "Type_of_Finding", headerName: "Type of Finding", width: 180 },
    { field: "status", headerName: "Status", width: 180 },
    { field: "description", headerName: "Description", width: 250 },
    { field: "standard", headerName: "Standard", width: 150 },
    { field: "priority", headerName: "Priority", width: 120 },
    { field: "responsibility", headerName: "Responsibility", width: 180 },
    { field: "RCA_Details", headerName: "RCA Details", width: 250 },
    {
      field: "created_at",
      headerName: "Task Created",
      width: 180,
      renderCell: (params) => {
        const value = params?.value;
        return value ? format(new Date(value), "PPpp") : "N/A";
      },
    },
    {
      field: "assigned_users",
      headerName: "Assigned Users",
      width: 200,
      renderCell: (cell) => {
        return (
          <Box>
            {taskAssignments[cell.row.id]
              ?.map((user) =>
                user?.name
                  ? `${user.name}${
                      user.department?.name ? ` (${user.department.name})` : ""
                    }`
                  : "Unknown"
              )
              .join(", ")}
          </Box>
        );
      },
      sortComparator: (a, b, rowA, rowB) => {
        const usersA = taskAssignments[rowA.id] || [];
        const usersB = taskAssignments[rowB.id] || [];
        const nameA = (usersA[0]?.name || "").toLowerCase();
        const nameB = (usersB[0]?.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      },
    },
    {
      field: "document",
      headerName: "Document",
      width: 180,
      renderCell: (cell) => (
        <Box sx={{ display: "flex", justifyContent: "space-around" }}>
          <IconButton
            title="View document"
            onClick={async () => {
              const docs = await fetchDocumentsByTask(cell.row.id);

              if (!docs || docs.length === 0) {
                // Show alert toast instead of opening popup
                toast.warning("No documents available.");
                return;
              }
              setDocuments(docs || []);
              setSelectedTask(cell.row.id);
              setIsViewDocumentsPopupOpen(true);
            }}
          >
            <FilePresentOutlined />
          </IconButton>

          <IconButton
            title="Attach document"
            onClick={() => {
              setSelectedTask(cell.row.id);
              setIsPopupOpen(true);
            }}
          >
            <AttachFileOutlined />
          </IconButton>
        </Box>
      ),
    },
    {
      field: "Planned_Completion_Date",
      headerName: "Planned Completion Date",
      width: 180,
      renderCell: (params) =>
        params.value ? format(new Date(params.value), "dd MMM yyyy") : "N/A",
    },
    {
      field: "Actual_Completion_Date",
      headerName: "Actual Completion Date",
      width: 180,
      renderCell: (params) =>
        params.value ? format(new Date(params.value), "dd MMM yyyy") : "N/A",
    },

    {
      field: "clause_number",
      headerName: "Reference - Clause",
      width: 150,
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (cell) => {
        return (
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <IconButton
              color="primary"
              onClick={() =>
                navigate(`/edit-task/${moduleId}/${cell.row.id}`, {
                  state: { iterationId },
                })
              }
            >
              <EditIcon />
            </IconButton>
            &nbsp;&nbsp;
            <IconButton color="error" onClick={() => handleDelete(cell.row.id)}>
              <DeleteIcon />
            </IconButton>
            <IconButton
              onClick={() =>
                handleViewChangeLog(
                  cell.row.moduleId,
                  cell.row.id,
                  cell.row.Checklist_Item
                )
              }
              title="View Change Log"
            >
              <HistoryIcon fontSize="small" sx={{ color: "#1976d2" }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  // main renderer
  return (
    <Paper
      elevation={4}
      sx={{ borderRadius: "0.5rem", marginLeft: 4, marginRight: 2 }}
    >
      <Grid2 container sx={{ padding: 2 }}>
        <Grid2 size={{ xs: 12, lg: 9 }} mb={4}>
          <Typography sx={{ fontWeight: "bold" }} variant="h4">
            Compliance Management
          </Typography>
          {userRole === "System Super Admin" && (
            <Typography variant="h4">Company: {companyName}</Typography>
          )}
        </Grid2>
        <Grid2 size={{ xs: 12, lg: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "end" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/select-iteration")}
              sx={{ display: "inline-block", marginRight: 3 }}
            >
              Upload Tasks
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/create-task")}
              className="add-task-btn"
            >
              Add Task
            </Button>
          </Box>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 4 }}>
          <TextField
            select
            label="Filter by Iteration"
            value={iterationId}
            onChange={(e) => setIterationId(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            SelectProps={{
              displayEmpty: true,
              MenuProps: {
                anchorOrigin: { vertical: "bottom", horizontal: "left" },
                transformOrigin: { vertical: "top", horizontal: "left" },
                PaperProps: {
                  style: { maxHeight: 250, width: "auto" },
                },
              },
            }}
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
              },
              "& .MuiInputLabel-root": {
                color: "rgba(0, 0, 0, 0.6)",
              },
            }}
          >
            <MenuItem value="">All Iterations</MenuItem>
            {iterations.map((iter) => (
              <MenuItem key={iter.id} value={iter.id}>
                {iter.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2
          size={{ xs: 12, md: 12, lg: 12 }}
          sx={{
            maxWidth: "100%",
            overflow: "hidden",
            mt: { xs: 2, sm: 0 },
          }}
        >
          <Grid2
            size={{ xs: 12, md: 12, lg: 12 }}
            sx={{
              maxWidth: "100%",
              overflowX: "auto", //  This enables horizontal scrolling
              overflowY: "hidden", //   This hides vertical scrolling
              mt: { xs: 2, sm: 0 },
            }}
          ></Grid2>
          <DataGrid
            rows={tasks}
            columns={columns}
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25]}
            sx={{
              fontSize: "1rem",
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordWrap: "break-word",
                display: "flex",
                alignItems: "center",
                paddingY: 1,
              },
            }}
            initialState={{
              pinnedColumns: { left: ["auditee"] },
            }}
            getRowHeight={() => "auto"}
          />
        </Grid2>

        {isPopupOpen && (
          <Dialog
            open={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent>
              {/* File Upload Section */}
              <div className="file-upload-section">
                <label className="custom-file-input">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files);
                      if (selectedFiles.length > 0) {
                        setDocuments((prevDocs) => ({
                          ...prevDocs,
                          [selectedTask]: selectedFiles,
                        }));
                      }
                    }}
                  />

                  <span className="custom-file-button">Browse File</span>
                </label>

                {/* Show selected file name */}
                {Array.isArray(documents[selectedTask]) &&
                  documents[selectedTask].length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Selected Files:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                        {documents[selectedTask].map((file, index) => (
                          <li key={index}>
                            <Typography variant="body2">{file.name}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}

                {/* Comment Input */}
                <TextField
                  fullWidth
                  label="File Comment"
                  variant="outlined"
                  className="comment-box"
                  placeholder="Add a comment..."
                  value={comments[selectedTask] || ""}
                  onChange={(e) =>
                    setComments((prev) => ({
                      ...prev,
                      [selectedTask]: e.target.value,
                    }))
                  }
                  margin="normal"
                />
              </div>
            </DialogContent>

            {/*Buttons*/}
            <DialogActions className="button-group">
              <Button
                className="MuiButton-outlinedSecondary"
                onClick={() => setIsPopupOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="MuiButton-containedPrimary"
                onClick={() => handleFileUpload(selectedTask)}
                disabled={uploading}
                startIcon={
                  uploading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {uploading ? "Uploading..." : "Upload"}
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
              // value={
              //   selectedDocument?.issue_date &&
              //   !isNaN(new Date(selectedDocument.issue_date).getTime())
              //     ? new Date(selectedDocument.issue_date)
              //         .toISOString()
              //         .split("T")[0]
              //     : ""
              // }
              value={formatDateForInput(selectedDocument?.issue_date)}
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

        {isViewDocumentsPopupOpen && (
          <Dialog
            open={isViewDocumentsPopupOpen}
            onClose={() => setIsViewDocumentsPopupOpen(false)}
            fullWidth
            maxWidth="xl"
            PaperProps={{
              sx: {
                maxWidth: "95vw",
                borderRadius: 2,
                overflow: "hidden",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontWeight: 600,
                fontSize: "1.5rem",
                backgroundColor: "#f9f9f9",
                px: 3,
                py: 2,
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              View Uploaded Documents
            </DialogTitle>

            <DialogContent
              sx={{
                maxHeight: "75vh",
                overflow: "auto",
                p: 2,
                backgroundColor: "#fff",
              }}
            >
              {Array.isArray(documents) && documents.length > 0 ? (
                <Box sx={{ minWidth: "1000px", overflowX: "auto" }}>
                  <DataGrid
                    autoHeight
                    rows={documents.map((doc, index) => ({
                      ...doc,
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
                      file_url: doc.file_url,
                      module_id: doc.module_id,
                    }))}
                    columns={[
                      {
                        field: "file_name",
                        headerName: "Document File Name",
                        flex: 2,
                        minWidth: 280,
                      },
                      {
                        field: "remark",
                        headerName: "Remark",
                        flex: 1,
                        minWidth: 200,
                      },
                      {
                        field: "uploader",
                        headerName: "Uploaded by",
                        flex: 1,
                      },
                      {
                        field: "uploaded_at",
                        headerName: "Uploaded on",
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
                            style={{
                              color: "#1976d2",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                          >
                            Open
                          </a>
                        ),
                      },
                      {
                        field: "delete",
                        headerName: "Actions",
                        flex: 1,
                        sortable: false,
                        filterable: false,
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
                                  handleDeleteDoc(
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
                          const truncated =
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
                                {truncated}
                              </Typography>
                            </Tooltip>
                          );
                        },
                      },
                      {
                        field: "issue_version",
                        headerName: "Version",
                        flex: 1,
                      },
                      {
                        field: "issue_date",
                        headerName: "Issue Date",
                        flex: 1,
                        renderCell: (params) =>
                          params.value &&
                          !isNaN(new Date(params.value).getTime())
                            ? new Date(params.value).toLocaleDateString()
                            : "N/A",
                      },
                    ]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 5, page: 0 },
                      },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                    getRowHeight={() => 64} // Increased from default (~52)
                    sx={{
                      fontSize: "0.95rem",
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f5f5f5",
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                      },
                      "& .MuiDataGrid-row:nth-of-type(odd)": {
                        backgroundColor: "#fafafa",
                      },
                      "& .MuiDataGrid-cell": {
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        lineHeight: "1.6",
                        paddingTop: "12px",
                        paddingBottom: "12px",
                      },
                    }}
                  />
                </Box>
              ) : (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ textAlign: "center", mt: 3 }}
                >
                  No documents available for this task.
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

        <Dialog
          open={openLogModal}
          onClose={() => setOpenLogModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ m: 0, p: 2 }}>
            Task Change Log
            <IconButton
              aria-label="close"
              onClick={() => setOpenLogModal(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          {/* Optional subtitle area for Task name and download */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={3}
            py={1}
            sx={{ backgroundColor: "#f4f4f4", borderBottom: "1px solid #ddd" }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Task: {checklistItem || "Unnamed Task"}
            </Typography>

            <IconButton
              aria-label="Download Logs"
              onClick={handleDownloadLogsAsPDF}
              size="large"
              color="primary"
            >
              <FileDownloadIcon />
            </IconButton>
          </Box>

          <DialogContent dividers ref={scrollContentRef}>
            {taskChangeLog.length === 0 ? (
              <Typography variant="body2">No changelogs available.</Typography>
            ) : (
              taskChangeLog.map((log, index) => {
                const from =
                  Array.isArray(log.old_value) && log.old_value.length > 0
                    ? log.old_value
                        .map((u) => u.name || JSON.stringify(u))
                        .join(", ")
                    : typeof log.old_value === "string" && log.old_value.trim()
                    ? log.old_value
                    : "";

                const to =
                  Array.isArray(log.new_value) && log.new_value.length > 0
                    ? log.new_value
                        .map((u) => u.name || JSON.stringify(u))
                        .join(", ")
                    : typeof log.new_value === "string" && log.new_value.trim()
                    ? log.new_value
                    : "";

                return (
                  <Paper
                    key={index}
                    elevation={3}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1, color: "primary.main" }}
                    >
                      {log.changed_by.name} changed{" "}
                      <strong>{log.field_changed}</strong> on{" "}
                      {new Date(log.changed_at).toLocaleString()}
                    </Typography>

                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" fontWeight={500}>
                          From:
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={10}>
                        <Typography
                          variant="body2"
                          color={from ? "text.primary" : "text.secondary"}
                        >
                          {from || "(empty)"}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" fontWeight={500}>
                          To:
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={10}>
                        <Typography
                          variant="body2"
                          color={to ? "text.primary" : "text.secondary"}
                        >
                          {to || "(empty)"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })
            )}
          </DialogContent>
        </Dialog>
      </Grid2>

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
    </Paper>
  );
};

export default TaskList;
