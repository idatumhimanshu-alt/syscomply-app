import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosinstance";

const API_URL = "/users/bd168912-e40c-48e3-b3d1-440a3e129d52";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const company_id = sessionStorage.getItem("selectedCompany");
      const response = await axiosInstance.get(API_URL, {
        params: company_id ? { company_id } : {},
      });
      console.log("Users API response:", response.data);

      setUsers(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load users");
      toast.error("Error fetching users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axiosInstance.delete(`${API_URL}/${deleteUserId}`);
      setUsers(users.filter((user) => user.id !== deleteUserId));
      toast.success("User deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setDeleteUserId(null);
    }
  };

  const columns = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    {
      field: "Role",
      headerName: "Role",
      width: 200,
      renderCell: (params) => (
        <span>{params.row.Role ? params.row.Role.name : "N/A"}</span>
      ),
    },
    {
      field: "Company",
      headerName: "Company",
      width: 200,
      renderCell: (params) => (
        <span>{params.row.Company ? params.row.Company.name : "N/A"}</span>
      ),
    },
    {
      field: "Manager",
      headerName: "Report To",
      width: 200,
      renderCell: (params) => (
        <span>{params.row.Manager ? params.row.Manager.name : "N/A"}</span>
      ),
    },
    {
      field: "Department",
      headerName: "Department",
      width: 200,
      renderCell: (params) => (
        <span>
          {params.row.department ? params.row.department.name : "N/A"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => {
              toast.info("Redirecting to Update User...");
              navigate(`/users/update/${params.row.id}`, {
                state: {
                  name: params.row.name,
                  email: params.row.email,
                  company_id: params.row.company_id,
                  role_id: params.row.Role ? params.row.Role.id : "",
                  company_name: params.row.Company
                    ? params.row.Company.name
                    : "",
                  manager: params.row.Manager ? params.row.Manager.id : "",
                  managerName: params.row.Manager
                    ? params.row.Manager.name
                    : "",
                  department_id: params.row.department
                    ? params.row.department.id
                    : "",
                },
              });
            }}
          >
            <Edit />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => setDeleteUserId(params.row.id)}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: "0.5rem",
          mx: { xs: 1, sm: 2, md: 4 },
          my: 2,
          p: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <div className="user-list-container">
          <ToastContainer />
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3, px: 2 }}
          >
            <Grid item xs={12} sm={6}>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                Users
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              sx={{
                textAlign: { xs: "left", sm: "right" },
                mt: { xs: 2, sm: 0 },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  toast.info("Redirecting to Add User Page...");
                  navigate("/users/create");
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: "medium",
                  px: 3,
                  boxShadow: 2,
                }}
              >
                Add New User
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Paper elevation={2} sx={{ p: 2 }}>
              <DataGrid
                rows={users}
                columns={columns}
                getRowId={(row) => row.id}
                autoHeight
                pagination
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                disableRowSelectionOnClick
                sx={{
                  fontSize: "1rem",
                  "& .MuiDataGrid-cell": {
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    alignItems: "center",
                    display: "flex",
                  },
                }}
              />
            </Paper>
          )}

          {/* Delete Dialog */}
          <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this user?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteUserId(null)} color="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                color="error"
                variant="contained"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </Paper>
    </Container>
  );
};

export default UserList;
