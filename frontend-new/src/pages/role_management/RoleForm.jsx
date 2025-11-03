import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Container,
} from "@mui/material";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";

const API_ROLE_URL = "/roles/971a88b8-461e-4cd2-9a06-fce42ad6b806";
const API_COMPANY_URL = "/companies/5d896834-fedd-4e0b-a882-8d05396fc346";

const RoleForm = () => {
  const [userRole, setUserRole] = useState("");
  const [role, setRole] = useState({
    name: "",
    description: "",
    parent_role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch companies if user is System Super Admin
  useEffect(() => {
    // Retrieve userRole from localStorage
    let role = localStorage.getItem("userRole");
    setUserRole(role);
    console.log("User Role from Role Form " + userRole);
    if (role === "System Super Admin") {
      axiosInstance
        .get(API_COMPANY_URL)
        .then((response) => setCompanies(response.data || []))
        .catch((error) => {
          console.error("Error fetching companies:", error);
          toast.error("Failed to fetch companies.");
        });
    } else {
      fetchRoles(); // Fetch roles for specific company
    }
  }, [userRole]);

  const fetchRoles = async () => {
    let company_id = sessionStorage.getItem("selectedCompany");
    if (!company_id) {
      toast.error("No company selected! Please choose a company.");
      return;
    }

    try {
      const response = await axiosInstance.get(API_ROLE_URL, {
        params: { company_id },
      });
      setRoles(response.data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to fetch roles.");
    }
  };

  // Fetch roles when company changes
  useEffect(() => {
    if (userRole === "System Super Admin" && selectedCompany) {
      fetchRoles(selectedCompany);
    }
  }, [selectedCompany]);

  // Handle input change
  const handleChange = (e) => {
    setRole({ ...role, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role.name.trim() || !role.description.trim()) {
      toast.warn("Role Name and Description are required");
      return;
    }

    let company_id =
      userRole === "System Super Admin"
        ? selectedCompany
        : sessionStorage.getItem("selectedCompany");

    if (userRole === "System Super Admin" && !company_id) {
      toast.error("Please select a company before submitting.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...role,
        company_id:
          userRole === "System Super Admin"
            ? selectedCompany
            : sessionStorage.getItem("selectedCompany"), // Pass only if needed
      };
      await axiosInstance.post(API_ROLE_URL, payload);
      toast.success("Role added successfully!");
      setTimeout(() => {
        navigate("/roles"); // Delay navigation by 1 second
      }, 1000);
    } catch (err) {
      console.error("Error adding role:", err);
      toast.error(err.response?.data?.message || "Failed to add role.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={4}
        sx={{
          p: 4,
          mt: 4,
          mx: 8,
          borderRadius: 3,
          bgcolor: "#f9f9f9",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ToastContainer />

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, pl: 1 }}>
          Add New Role
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "grid", gap: 2 }}>
            {userRole === "System Super Admin" && (
              <FormControl fullWidth>
                <InputLabel>Select Company</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  required
                  label="Select Company"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Role Name"
              variant="outlined"
              name="name"
              value={role.name}
              onChange={handleChange}
              required
            />

            <TextField
              fullWidth
              label="Role Description"
              variant="outlined"
              name="description"
              value={role.description}
              onChange={handleChange}
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel shrink={true} id="parent-role-label">
                Parent Role
              </InputLabel>
              <Select
                labelId="parent-role-label"
                name="parent_role_id"
                value={role.parent_role_id || ""}
                onChange={handleChange}
                displayEmpty
                renderValue={(selected) =>
                  selected ? roles.find((r) => r.id === selected)?.name : "None"
                }
              >
                <MenuItem value="">None</MenuItem>
                {roles.map((roleItem) => (
                  <MenuItem key={roleItem.id} value={roleItem.id}>
                    {roleItem.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "flex-end",
              gap: 2,
              mt: 4,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                px: 3,
                py: 1,
                fontSize: "14px",
                borderRadius: 2,
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.15)",
                minWidth: "120px",
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Add Role"
              )}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={loading}
              sx={{
                px: 3,
                py: 1,
                fontSize: "14px",
                borderRadius: 2,
                borderWidth: "1.5px",
                ":hover": { borderWidth: "1.5px" },
                minWidth: "120px",
              }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default RoleForm;

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   TextField,
//   Button,
//   Typography,
//   CircularProgress,
// } from "@mui/material";
// import { toast } from "react-toastify"; // Import toast
// import axiosInstance from "../../services/axiosinstance";

// const API_URL = "/roles/971a88b8-461e-4cd2-9a06-fce42ad6b806"; // Backend API endpoint

// const RoleForm = () => {
//   const [role, setRole] = useState({ name: "", description: "" });
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   // Handle input change
//   const handleChange = (e) => {
//     setRole({ ...role, [e.target.name]: e.target.value });
//   };

//   // Submit role to backend
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!role.name.trim() && !role.description.trim()) {
//       toast.warn("Both Role Name and Description are required");
//       return;
//     }
//     if (!role.name.trim()) {
//       toast.warn("Role Name is required");
//       return;
//     }
//     if (!role.description.trim()) {
//       toast.warn("Role Description is required");
//       return;
//     }

//     setLoading(true);
//     try {
//       await axiosInstance.post(API_URL, role);
//       toast.success("Role added successfully!");
//       navigate("/roles"); // Redirect to Role List page
//     } catch (err) {
//       console.error("Error adding role:", err);
//       toast.error(err.response?.data?.message || "Failed to add role.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Box p={3} maxWidth="400px" margin="auto">
//       <Typography variant="h5" mb={2}>
//         Add New Role
//       </Typography>
//       <form onSubmit={handleSubmit}>
//         <TextField
//           fullWidth
//           label="Role Name"
//           variant="outlined"
//           name="name"
//           value={role.name}
//           onChange={handleChange}
//           sx={{ mb: 2 }}
//         />
//         <TextField
//           fullWidth
//           label="Role Description"
//           variant="outlined"
//           name="description"
//           value={role.description}
//           onChange={handleChange}
//           sx={{ mb: 2 }}
//         />
//         <Button
//           fullWidth
//           type="submit"
//           variant="contained"
//           color="primary"
//           disabled={loading}
//         >
//           {loading ? <CircularProgress size={24} /> : "Add Role"}
//         </Button>
//       </form>
//     </Box>
//   );
// };

// export default RoleForm;
