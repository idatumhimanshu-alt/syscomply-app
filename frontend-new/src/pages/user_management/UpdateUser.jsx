import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";
import {
  Container,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";

const ROLES_API_URL = "/roles/bd168912-e40c-48e3-b3d1-440a3e129d52";
const userModuleId = "bd168912-e40c-48e3-b3d1-440a3e129d52"; // Use same module ID

const UpdateUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get passed state from UserList

  // Read user details from state (fallback to empty string if missing)
  const [user, setUser] = useState({
    name: location.state?.name || "",
    email: location.state?.email || "",
    company_id: location.state?.company_id || "",
    company_name: location.state?.company_name || "",
    role_id: location.state?.role_id || "",
    manager: location.state?.manager || "",
    managerName: location.state?.managerName || "",
    department_id: location.state?.department_id || "",
  });
  const [higherRoleUsers, setHigherRoleUsers] = useState([]); // state for higher roles

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (!id) {
      toast.error("Invalid User ID!");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch user details first
        const userRes = await axiosInstance.get(`/users/${id}`);

        if (userRes.data) {
          setUser((prevUser) => ({
            ...prevUser,
            name: prevUser.name || userRes.data.name, // Ensure name is preselected
            email: prevUser.email || userRes.data.email,
            company_id: prevUser.company_id || userRes.data.company_id,
            role_id: prevUser.role_id || userRes.data.role_id, // Keep previous role
            manager: prevUser.manager || userRes.data.manager,
          }));
        } else {
          toast.error("User not found!");
        }
      } catch (error) {
        //toast.error("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  //  Fetch roles when `user.company_id` updates
  useEffect(() => {
    if (user.company_id) {
      fetchRoles(user.company_id);
    }
  }, [user.company_id]);

  useEffect(() => {
    if (!user.role_id) {
      setHigherRoleUsers([]);
      return;
    }

    axiosInstance
      .get(`/users/${userModuleId}//getUsersWithHigherRole`, {
        params: { company_id: user.company_id, role_id: user.role_id },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((res) => {
        console.log("Higher role users response:", res.data);
        setHigherRoleUsers(res.data || []);
      })
      .catch((error) => {
        console.error("Error fetching higher role users:", error);
        if (res.data.length === 0) {
          toast.info("No higher role users available to report to.");
        }
      });
  }, [user.role_id]);

  const fetchRoles = async (companyId) => {
    if (!companyId) return;

    try {
      const response = await axiosInstance.get(ROLES_API_URL, {
        params: { company_id: companyId },
      });
      const rolesData = response.data || [];
      setRoles(rolesData);

      if (user.role_id) {
        const matchedRole = rolesData.find((role) => role.id === user.role_id);
        if (matchedRole) {
          setUser((prevUser) => ({
            ...prevUser,
            role_id: matchedRole.id,
          }));
        }
      }
    } catch (error) {
      toast.error("Failed to load roles.");
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      if (!user.company_id) {
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
            company_id: user.company_id,
          },
        };

        const res = await axiosInstance.get(
          `/department/${userModuleId}`,
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

    loadDepartments();
  }, [user.company_id]);

  const handleChange = (e) => {
    setUser((prevUser) => ({ ...prevUser, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axiosInstance.put(`/users/${userModuleId}/${id}`, {
        ...user,
        reportTo: user.manager || null,
        department_id: user.department_id || null,
      });
      toast.success("User updated successfully!");
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response);

      if (error.response?.status === 409) {
        const subordinates = error.response?.data?.subordinates || [];
        let errorMessage = "Cannot update role. User has subordinates.";

        if (subordinates.length > 0) {
          errorMessage += `\n\nSubordinates:\n${subordinates
            .map((sub) => `• ${sub.name} (ID: ${sub.id})`)
            .join("\n")}`;
        }

        alert(errorMessage); // Use a dialog instead of toast
      }

      //  Ensure toast message is valid before calling toast.error
      const errorMessage =
        error.response?.data?.message || "Failed to update user.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <CircularProgress sx={{ display: "block", margin: "auto", mt: 5 }} />
    );

  return (
    <Container maxWidth="sm" sx={{ px: 2 }}>
      {" "}
      {/* Added horizontal padding */}
      <ToastContainer />
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
          mt: 4,
          mx: { xs: 2, sm: 4, md: 8 },
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, textAlign: "center", mb: 2 }}
        >
          Update User
        </Typography>

        <form onSubmit={handleUpdate}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Name"
              name="name"
              value={user.name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              value={user.email}
              fullWidth
              disabled
            />
            <TextField
              label="Company"
              name="company_name"
              value={user.company_name}
              fullWidth
              disabled
            />
            <FormControl fullWidth required>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role_id"
                value={user.role_id || ""}
                onChange={handleChange}
              >
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Roles Available</MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel>Report To</InputLabel>
              <Select
                name="manager"
                value={user.manager || ""}
                onChange={(e) => setUser({ ...user, manager: e.target.value })}
                disabled={higherRoleUsers.length === 0}
              >
                <MenuItem value="">None</MenuItem>
                {!higherRoleUsers.find((u) => u.id === user.manager) &&
                  user.manager && (
                    <MenuItem value={user.manager}>
                      {user.managerName || "Current Manager"}
                    </MenuItem>
                  )}
                {higherRoleUsers.map((higherUser) => (
                  <MenuItem key={higherUser.id} value={higherUser.id}>
                    {higherUser.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Department  Dropdown  */}
            <FormControl fullWidth required>
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={user.department_id || ""}
                onChange={handleChange}
              >
                {departments.length > 0 ? (
                  departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Departments Available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end", // aligned right
              gap: 2,
              mt: 3,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              sx={{ minWidth: 130 }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Update User"
              )}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate(-1)}
              disabled={submitting}
              sx={{ minWidth: 130 }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default UpdateUser;
