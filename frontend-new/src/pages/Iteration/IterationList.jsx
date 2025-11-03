import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";

const taskModuleId = "1f0f190d-3a83-421c-af98-5d081100230e";

const IterationList = () => {
  const [iterations, setIterations] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIterationId, setSelectedIterationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const refresh = queryParams.get("refresh");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

useEffect(() => {
  if (refresh) {
    fetchIterations().then(() => {
      navigate(location.pathname, { replace: true }); // removes ?refresh=1
    });
  } else {
    fetchIterations();
  }
}, [refresh]);


  const company_id = sessionStorage.getItem("selectedCompany");
  console.log("Company ID from sessionStorage:", company_id);

  // Fetch iterations for the selected company .
  const fetchIterations = async () => {
    try {
      const company_id = sessionStorage.getItem("selectedCompany");

      if (!company_id) {
        toast.error("Company ID is required.");
        return;
      }

      const response = await axiosInstance.get(`/iteration/${taskModuleId}`, {
        params: { company_id },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });

      setIterations(response.data || []);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";

      console.error("Error fetching iterations:", errorMsg, error.response);
      toast.error(`Failed to fetch iterations: ${errorMsg}`);
    }
  };

  // Handle iteration soft delete
  const handleDelete = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("jwtToken");
      const company_id = sessionStorage.getItem("selectedCompany");

      if (!token || !company_id) {
        setError("Authorization or Company ID missing.");
        return;
      }

      await axiosInstance.delete(
        `/iteration/${taskModuleId}/${selectedIterationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { company_id },
        }
      );

      setIterations((prevIterations) =>
        prevIterations.filter(
          (iteration) => iteration.id !== selectedIterationId
        )
      );
      setError("");
      toast.success("Iteration soft deleted successfully!");
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

  // DataGrid column definitions
  const columns = [
    { field: "name", headerName: "Name", width: 180, filterable: true },
    {
      field: "start_date",
      headerName: "Start Date",
      width: 180,
      filterable: true,
    },
    { field: "end_date", headerName: "End Date", width: 180, filterable: true },
    {
      field: "description",
      headerName: "Description",
      width: 300,
      filterable: true,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      filterable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            href={`/iteration/edit/${taskModuleId}/${params.row.id}`}
          >
            <Edit />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => {
              setSelectedIterationId(params.row.id);
              setDeleteDialogOpen(true);
            }}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  //  rows for the DataGrid

  const rows = iterations.map((iter) => ({
    id: iter.id,
    name: iter.name,
    start_date: iter.start_date?.split("T")[0],
    end_date: iter.end_date?.split("T")[0],
    description: iter.description || "No description",
    createdAt: iter.createdAt?.split("T")[0],
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
          Iteration List
        </Typography>

        {/* Button to add a new iteration */}
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            color="primary"
            href={`/iteration/create/${taskModuleId}`}
          >
            Add Iteration
          </Button>
        </Box>

        <Grid container sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                paginationModel={{
                  pageSize: pageSize,
                  page: page,
                }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                pageSizeOptions={[5, 10, 25]}
                pagination
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
              Are you sure you want to soft delete this iteration?
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

export default IterationList;
