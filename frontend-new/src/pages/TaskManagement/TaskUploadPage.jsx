import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Typography,
  Select,
  MenuItem,
  Paper,
  Grid2,
  Box,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import UploadIcon from "@mui/icons-material/Upload";
import axiosInstance from "../../services/axiosinstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

const TaskUploadPage = () => {
  const { moduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  const iterationId = query.get("iterationId") || "";
  const selectedStandard = query.get("standard");

  const [tasks, setTasks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const taskTypes = [
    "Control",
    "Process",
    "Procedure",
    "Monitoring",
    "Material",
  ];
  const statuses = [
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
  ];
  const auditeeOptions = [
    "CISO",
    "HOD-HR",
    "HOD-Facility Admin",
    "HOD-IT",
    "HOD-Purchase",
    "IT Administration",
    "Project Manager - SDLC",
  ];
  const priorities = ["High", "Medium", "Low"];
  const complianceOptions = ["Yes", "No", "Partial", "Not Applicable", ""];

  const TypeofFinding = [
    "Compliance",
    "Observation",
    "Non-Compliance",
    "Opportunity For Improvement",
  ];

  // useEffect(() => {
  //   const fetchIterations = async () => {
  //     try {
  //       const company_id = sessionStorage.getItem("selectedCompany");
  //       if (!company_id) {
  //         toast.error("Company ID is required.");
  //         return;
  //       }

  //       const response = await axiosInstance.get(`/iteration/${moduleId}`, {
  //         params: { company_id },
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
  //         },
  //       });

  //       setIterations(response.data || []);
  //     } catch (error) {
  //       const errorMsg =
  //         error?.response?.data?.error ||
  //         error?.response?.data?.message ||
  //         error?.message ||
  //         "Unknown error";

  //       console.error("Error fetching iterations:", errorMsg, error.response);
  //       toast.error(`Failed to fetch iterations: ${errorMsg}`);
  //     }
  //   };

  //   fetchIterations();
  // }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Upload file and fetch tasks
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    if (!iterationId || !selectedStandard) {
      toast.error("Iteration or standard missing.");
      return;
    }

    if (!selectedStandard) {
      toast.error("No standard selected. Please select a standard first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("iteration_id", iterationId);
    formData.append("company_id", sessionStorage.getItem("selectedCompany"));
    formData.append("standard", selectedStandard);

    try {
      setLoading(true); // Start loading
      const response = await axiosInstance.post(
        `/tasks/upload-tasks/${moduleId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.tasks) {
        setTasks(
          response.data.tasks.map((task, index) => ({
            id: index + 1, // required for DataGrid
            srNo: index + 1, // for Serial Number display
            ...task,
          }))
        );
        toast.success("File uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to upload file.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Insert approved tasks into the database
  const handleInsertApprovedTasks = async () => {
    console.log(
      "handleInsertApprovedTasks - selectedCompany:",
      sessionStorage.getItem("selectedCompany")
    );

    if (tasks.length === 0) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      let company_id;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decodedData = JSON.parse(atob(base64));
      console.log(" Decoded Token:", decodedData);

      const roleId = decodedData.role;
      const companyFromToken = decodedData.company;
      console.log(" User Role ID:", roleId);

      // FETCH ROLE NAME BASED ON ROLE ID
      const response = await axiosInstance.get(`/roles/${moduleId}/${roleId}`, {
        params: { company_id: companyFromToken },
        headers: { Authorization: `Bearer ${token}` },
      });

      const roleName = response.data.name;
      console.log(" Resolved Role Name:", roleName);

      if (roleName === "System Super Admin") {
        company_id = sessionStorage.getItem("selectedCompany");
        console.log(" Company ID from Session (Super Admin):", company_id);

        if (!company_id) {
          toast.error(
            "No company selected in session. Please select a company."
          );
          navigate("/SelectCompany");
          return;
        }
      } else {
        company_id = companyFromToken;
        console.log(" Company ID from Token (non-Super Admin):", company_id);
      }

      console.log("Sending company_id to backend:", company_id);

      await axiosInstance.post(
        `/tasks/insert-approved-tasks/${moduleId}`,
        { tasks, company_id, iteration_id: iterationId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Approved tasks inserted successfully!");
      navigate("/tasks");
    } catch (error) {
      const data = error.response?.data;
      console.error("Insert Task Error:", data || error.message);

      if (data?.failed_tasks?.length) {
        console.table(data.failed_tasks);
        toast.error("Some tasks failed validation. Check console for details.");
      } else {
        toast.error(data?.message || "Failed to insert approved tasks.");
      }
    }
  };

  const renderEditSelectCell = (params, options) => {
    return (
      <Select
        value={params.value || ""}
        onChange={(event) => {
          params.api.setEditCellValue({
            id: params.id,
            field: params.field,
            value: event.target.value,
          });
        }}
        fullWidth
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    );
  };

  const columns = [
    {
      field: "srNo",
      headerName: "Sr.No.",
      width: 80,
      sortable: false,
      filterable: false,
    },
    {
      field: "auditee",
      headerName: "Auditee",
      width: 120,
      editable: true,
      renderEditCell: (params) => renderEditSelectCell(params, auditeeOptions),
    },
    { field: "area", headerName: "Area", width: 180 ,editable: true},
    { field: "Checklist_Item", headerName: "Checklist Item", width: 180 ,editable: true},
    { field: "notes", headerName: "Notes", width: 150 ,editable: true},
    {
      field: "Type_of_Finding",
      headerName: "Type of Finding",
      width: 180,
      editable: true,
      renderEditCell: (params) => renderEditSelectCell(params, TypeofFinding),
    },
    {
      field: "status",
      headerName: "Status of action",
      width: 150,
      editable: true,
      renderEditCell: (params) => renderEditSelectCell(params, statuses),
    },
    { field: "description", headerName: "Description", width: 200 ,editable: true,},
    { field: "standard", headerName: "Standard", width: 180 ,editable: true,},

    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      editable: true,
      renderEditCell: (params) => renderEditSelectCell(params, priorities),
    },

    {
      field: "responsibility",
      headerName: "Responsibility",
      width: 180,
      editable: true,
    },
    {
      field: "RCA_Details",
      headerName: "RCA Details",
      width: 220,
      editable: true,
    },
    {
      field: "Planned_Completion_Date",
      headerName: "Planned Completion Date",
      width: 180,
      editable: true,
      renderCell: (params) =>
        params.value ? format(new Date(params.value), "dd MMM yyyy") : "N/A",
    },
    {
      field: "Actual_Completion_Date",
      headerName: "Actual Completion Date",
      width: 180,
      editable: true,
      renderCell: (params) =>
        params.value ? format(new Date(params.value), "dd MMM yyyy") : "N/A",
    },

    {
      field: "clause_number",
      headerName: "Reference - Clause",
      width: 150,
      editable: true,
    },
  ];

  return (
    <Paper
      elevation={4}
      sx={{ borderRadius: "0.5rem", marginLeft: 4, marginRight: 2 }}
    >
      <Grid2 container  sx={{ padding: 2 }} spacing={2}>
        {/* Left side - Heading */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Typography sx={{ fontWeight: "bold" }} variant="h4">
            Task Upload
          </Typography>
        </Grid2>

        {/* Right side - Iteration Dropdown + Insert Button */}
        <Grid2
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "start", md: "end" },
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="success"
            onClick={handleInsertApprovedTasks}
            disabled={tasks.length === 0}
          >
            Insert Updated Tasks
          </Button>
        </Grid2>

        {/* File input & upload */}
        <Grid2 size={{ xs: 12, md: 12 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              style={{ display: "none" }}
            />
            <label htmlFor="fileInput">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                sx={{ marginRight: 2 }}
              >
                Choose File
              </Button>
            </label>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFileUpload}
              disabled={!selectedFile || !iterationId}
            >
              Upload Excel
            </Button>
          </Box>
        </Grid2>

        {/* File name display */}
        <Grid2 size={{ xs: 12, md: 12 }}>
          <Box sx={{ display: "flex", justifyContent: "end" }}>
            {selectedFile && (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mt: 1, fontStyle: "italic" }}
              >
                Selected file: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </Grid2>
      </Grid2>

      <Grid2
        size={{ xs: 12, md: 12 }}
        sx={{ maxWidth: "100%", overflow: "hidden", padding: 2 }}
      >
        <DataGrid
          loading={loading}
          rows={tasks}
          columns={columns}
          pageSize={10}
          disableSelectionOnClick
          processRowUpdate={(updatedRow) => {
            setTasks((prevTasks) =>
              prevTasks.map((task) =>
                task.id === updatedRow.id ? { ...task, ...updatedRow } : task
              )
            );
            return updatedRow;
          }}
        />
      </Grid2>
    </Paper>
  );
};

export default TaskUploadPage;
