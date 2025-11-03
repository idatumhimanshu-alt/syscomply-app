import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Grid,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";

const API_URL = "/roles/971a88b8-461e-4cd2-9a06-fce42ad6b806"; // API URL for roles

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteRoleId, setDeleteRoleId] = useState(null); // Store role ID for deletion
  const navigate = useNavigate();

  useEffect(() => {
    let company_id = sessionStorage.getItem("selectedCompany");

    fetchRoles();
  }, []);

  // const fetchRoles = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axiosInstance.get(API_URL,{params: company_id});
  //     setRoles(response.data);
  //     setError("");
  //   } catch (err) {
  //     setError("Failed to load roles");
  //     toast.error("Error fetching roles.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchRoles = async () => {
    try {
      setLoading(true);

      // Retrieve company_id from sessionStorage inside the function
      const company_id = sessionStorage.getItem("selectedCompany");

      const response = await axiosInstance.get(API_URL, {
        params: company_id ? { company_id } : {}, // Only send if company_id exists
      });

      setRoles(response.data);
      setError("");
    } catch (err) {
      setError("Failed to load roles");
      toast.error("Error fetching roles.");
    } finally {
      setLoading(false);
    }
  };

  // Handle role deletion
  const handleDeleteRole = async () => {
    try {
      await axiosInstance.delete(`${API_URL}/${deleteRoleId}`);
      setRoles(roles.filter((role) => role.id !== deleteRoleId));
      toast.success("Role deleted successfully!");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to delete role.");
      }
    } finally {
      setDeleteRoleId(null);
    }
  };
  

  // return (
  //   <div className="role-list-container">
  //     <ToastContainer /> {/* Required for showing toast messages */}

  //     <Typography variant="h6" gutterBottom>Roles</Typography>

  //     <Button
  //       variant="contained"
  //       color="primary"
  //       onClick={() => {
  //         toast.info("Redirecting to Add Role Page...");
  //         navigate("/roles/create");
  //       }}
  //       sx={{ mb: 2 }}
  //     >
  //       Add New Role
  //     </Button>

  //     {loading ? (
  //       <CircularProgress />
  //     ) : error ? (
  //       <Typography color="error">{error}</Typography>
  //     ) : (
  //       <TableContainer component={Paper} className="role-table">
  //         <Table>
  //           <TableHead>
  //             <TableRow>
  //               <TableCell><strong>Role Name</strong></TableCell>
  //               <TableCell><strong>Description</strong></TableCell>
  //               <TableCell><strong>Actions</strong></TableCell>
  //             </TableRow>
  //           </TableHead>
  //           <TableBody>
  //             {roles.map((role) => (
  //               <TableRow key={role.id}>
  //                 <TableCell>{role.name}</TableCell>
  //                 <TableCell>{role.description}</TableCell>
  //                 <TableCell className="action-buttons">
  //                   <IconButton
  //                     color="primary"
  //                     onClick={() => {
  //                       toast.info("Redirecting to Edit Role...");
  //                       navigate(`/roles/edit/${role.id}`);
  //                     }}
  //                   >
  //                     <Edit />
  //                   </IconButton>
  //                   {/* <IconButton
  //                     color="error"
  //                     onClick={() => setDeleteRoleId(role.id)}
  //                   >
  //                     <Delete />
  //                   </IconButton> */}
  //                 </TableCell>
  //               </TableRow>
  //             ))}
  //           </TableBody>
  //         </Table>
  //       </TableContainer>
  //     )}

  //     {/* Delete Confirmation Dialog */}
  //     <Dialog open={!!deleteRoleId} onClose={() => setDeleteRoleId(null)}>
  //       <DialogTitle>Confirm Delete</DialogTitle>
  //       <DialogContent>
  //         <Typography>Are you sure you want to delete this role?</Typography>
  //       </DialogContent>
  //       <DialogActions>
  //         <Button onClick={() => setDeleteRoleId(null)} color="secondary">
  //           Cancel
  //         </Button>
  //         <Button onClick={handleDeleteRole} color="error" variant="contained">
  //           Delete
  //         </Button>
  //       </DialogActions>
  //     </Dialog>
  //   </div>
  // );
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
        <ToastContainer />

        {/* Header */}
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3, px: 2 }}
        >
          <Grid item xs={12} sm={6}>
            <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
              Roles
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
                toast.info("Redirecting to Add Role Page...");
                navigate("/roles/create");
              }}
              sx={{
                textTransform: "none",
                fontWeight: "medium",
                px: 3,
                boxShadow: 2,
              }}
            >
              Add New Role
            </Button>
          </Grid>
        </Grid>

        {/* Content */}
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Paper elevation={2} sx={{ p: 2 }}>
            {/* Table Header */}
            <Grid
              container
              sx={{
                py: 2,
                px: 1,
                fontWeight: "bold",
                borderBottom: "2px solid #ddd",
                display: { xs: "none", sm: "flex" },
                backgroundColor: "#f5f5f5",
                fontSize: "1.1rem",
              }}
            >
              <Grid item sm={4}>
                Role Name
              </Grid>
              <Grid item sm={6}>
                Description
              </Grid>
              <Grid item sm={2}>
                Actions
              </Grid>
            </Grid>

            {/* Table Body */}
            {roles.map((role, index) => (
              <Grid
                container
                key={role.id}
                spacing={2}
                sx={{
                  py: 1.5,
                  px: 1,
                  borderBottom:
                    index !== roles.length - 1 ? "1px solid #eee" : "none",
                  backgroundColor: "#fff",
                  borderRadius: { xs: 2, sm: 0 },
                  mb: { xs: 2, sm: 0 },
                  flexDirection: { xs: "column", sm: "row" },
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                {/* Role Name */}
                <Grid item xs={12} sm={4}>
                  <Typography
                    fontWeight="bold"
                    sx={{ display: { sm: "none" }, mb: 0.5 }}
                  >
                    Role Name:
                  </Typography>
                  <Typography sx={{ wordBreak: "break-word" }}>
                    {role.name}
                  </Typography>
                </Grid>

                {/* Description */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    fontWeight="bold"
                    sx={{ display: { sm: "none" }, mb: 0.5 }}
                  >
                    Description:
                  </Typography>
                  <Typography sx={{ wordBreak: "break-word" }}>
                    {role.description}
                  </Typography>
                </Grid>

                {/* Actions */}
                <Grid
                  item
                  xs={12}
                  sm={2}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: { xs: "flex-start", sm: "center" },
                    gap: 1,
                    mt: { xs: 1, sm: 0 },
                  }}
                >
                  <IconButton
                    color="primary"
                    onClick={() => {
                      toast.info("Redirecting to Edit Role...");
                      navigate(`/roles/edit/${role.id}`);
                    }}
                  >
                    <Edit />
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => setDeleteRoleId(role.id)}
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Paper>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteRoleId} onClose={() => setDeleteRoleId(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this role?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteRoleId(null)} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteRole}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default RoleList;
