import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Paper,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";

const UserModuleId = "bd168912-e40c-48e3-b3d1-440a3e129d52";

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(5);

  const companyId = sessionStorage.getItem("selectedCompany");
  console.log("Company ID from sessionStorage:", companyId);

  // Fetch departments for the selected company
  const loadDepartments = async () => {
    if (!companyId) {
      toast.error("Company ID is missing. Please select a company.");
      console.error("Missing company ID for department load");
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        params: {
          company_id: companyId,
        },
      };

      const res = await axiosInstance.get(
        `/department/${UserModuleId}`,
        config
      );
      setDepartments(res.data || []);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";

      console.error("Error fetching departments:", errorMsg, error.response);
      toast.error(`Failed to fetch departments: ${errorMsg}`);
    }
  };

  // Handle department soft delete
  const handleDelete = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("jwtToken");
      if (!token || !companyId) {
        setError("Authorization or Company ID missing.");
        return;
      }

      await axiosInstance.delete(
        `/department/${UserModuleId}/${selectedDepartmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { company_id: companyId },
        }
      );

      setDepartments((prevDepartments) =>
        prevDepartments.filter((dep) => dep.id !== selectedDepartmentId)
      );
      setError("");
      toast.success("Department soft deleted successfully!");
      setDeleteDialogOpen(false);
    } catch (error) {
      const backendError =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error.message ||
        "Unknown error";

      toast.error(`Delete failed: ${backendError}`);
      setError("Delete failed");
      console.error("Delete failed:", backendError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 180,
      filterable: true,
      flex: 1,
    },
    {
      field: "description",
      headerName: "Description",
      width: 300,
      filterable: true,
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      filterable: true,
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      filterable: false,
      flex: 1,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            href={`/departments/edit/${params.row.id}`}
          >
            <Edit />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => {
              setSelectedDepartmentId(params.row.id);
              setDeleteDialogOpen(true);
            }}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const rows = departments.map((dep) => ({
    id: dep.id,
    name: dep.name,
    description: dep.description || "No description",
    createdAt: dep.createdAt?.split("T")[0],
  }));

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "0.5rem",
        padding: 2,
        marginLeft: 4,
        marginRight: 2,
        marginTop: 4,
        mb: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Department Management
      </Typography>

      {/* Button to add a new department, aligned to the right */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" color="primary" href="/departments/new">
          Add Department
        </Button>
      </Box>

      <Grid container sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <div style={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pagination
              paginationModel={{ pageSize: pageSize, page: 0 }}
              onPaginationModelChange={(model) => setPageSize(model.pageSize)}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              autoHeight
            />
          </div>
        </Grid>
      </Grid>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Soft Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to soft delete this department?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Soft Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DepartmentList;
