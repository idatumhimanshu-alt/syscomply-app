import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";
import { jwtDecode } from "jwt-decode";
import {
  Container,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";

const token = localStorage.getItem("jwtToken");
const decodedToken = token ? jwtDecode(token) : null;
const superAdminCompanyId = decodedToken?.company || "";
const sessionCompanyId = sessionStorage.getItem("selectedCompany");

const CreateUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [higherRoleUsers, setHigherRoleUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

  const roleModuleId = "971a88b8-461e-4cd2-9a06-fce42ad6b806";
  const companyModuleId = "5d896834-fedd-4e0b-a882-8d05396fc346";
  const userModuleId = "bd168912-e40c-48e3-b3d1-440a3e129d52";
  let company_id = sessionStorage.getItem("selectedCompany");
  
  // Fetch Companies & Roles
  useEffect(() => {
    const sessionCompanyId = sessionStorage.getItem("selectedCompany");
    setCompanyId(sessionCompanyId);
  }, []);

  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyModuleId}`)
      .then((res) => {
        setCompanies(res.data);
        if (res.data.length > 0 && !superAdminCompanyId)
          setCompanyId(res.data[0].id);
      })
      .catch(() => toast.error("Failed to load companies"))
      .finally(() => setLoading(false));

    axiosInstance
      .get(`/roles/${roleModuleId}`, {
        params: company_id ? { company_id } : {}, // Pass company_id only if it exists
      })

      .then((res) => setRoles(res.data))
      .catch(() => toast.error("Failed to load roles"));
  }, [companyId]);

  // Fetch Higher Role Users when role is selected
  useEffect(() => {
    if (!roleId) {
      setHigherRoleUsers([]);
      return;
    }

    axiosInstance
      .get(`/users/${userModuleId}//getUsersWithHigherRole`, {
        params: { company_id: companyId, role_id: roleId },
      })
      .then((res) => {
        if (res.data.length === 0) {
          toast.info("No higher role exists for the selected role.");
        } else {
          setHigherRoleUsers(res.data);
        }
      })
      .catch(() => toast.error("Failed to load higher role users"));
  }, [roleId]);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!company_id) {
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
            company_id,
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
  }, [companyId]);

  const handleRoleChange = async (e) => {
    const selectedRoleId = e.target.value;
    setRoleId(selectedRoleId);
    setReportTo(""); // Reset Report To field when role changes

    if (!companyId) {
      toast.error("Company ID is required for System Super Admin.");
      console.warn("Missing companyId for System Super Admin.");
      return;
    }

    try {
      console.log("Fetching users with higher role...", {
        company_id: companyId,
        role_id: selectedRoleId,
      });

      const response = await axiosInstance.get(
        `/users/${userModuleId}//getUsersWithHigherRole`,
        {
          params: { company_id: companyId, role_id: selectedRoleId },
        }
      );

      console.log("API Response:", response.data);

      if (response.data?.length > 0) {
        setHigherRoleUsers(response.data);
      } else {
        toast.info("No higher role users available for the selected role.");
        setHigherRoleUsers([]);
      }
    } catch (error) {
      console.error(
        "Error fetching higher role users:",
        error.response?.data || error.message
      );

      // Extract the error message from API response
      const errorMessage =
        error.response?.data?.error || "Failed to load higher role users.";

      if (errorMessage !== "No higher role exists for the given Role ID.") {
        toast.error(errorMessage);
      } else {
        console.log("No higher role exists.");
      }
      setHigherRoleUsers([]); // Clear state in case of API failure
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !companyId || !roleId) {
      toast.error("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post(`/users/${userModuleId}`, {
        name,
        email,
        company_id: companyId,
        role_id: roleId,
        reportTo: reportTo || null, // Send null if not selected
        department_id: departmentId || null,
      });

      toast.success(response.data.message || "User created successfully!");
      setTimeout(() => {
        handleCancel();
      }, 1500);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.error); // Show backend message
      } else {
        toast.error(
          error.response?.data?.error || "An error occurred. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  if (loading)
    return (
      <CircularProgress sx={{ display: "block", margin: "auto", mt: 5 }} />
    );

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={4}
        sx={{
          p: 4,
          mx: 8,
          borderRadius: 3,
          bgcolor: "#f9f9f9",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          mt: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, textAlign: "center", mb: 3 }}
        >
          Create New User
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Company Dropdown - Pre-selected for System Super Admin */}
            <FormControl fullWidth variant="outlined">
              <InputLabel>Company</InputLabel>
              <Select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setRoleId("");
                  setReportTo("");
                  setRoles([]);
                }}
                label="Company"
                disabled={!!superAdminCompanyId}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Role Dropdown */}
            <FormControl fullWidth variant="outlined">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleId}
                onChange={handleRoleChange}
                required
                label="Role"
              >
                <MenuItem value="" disabled>
                  Select Role
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Report To Dropdown - Fetches Higher Role Users */}
            <FormControl fullWidth variant="outlined">
              <InputLabel>Report To</InputLabel>
              <Select
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
                label="Report To"
                disabled={higherRoleUsers.length === 0}
              >
                <MenuItem value="">None</MenuItem>
                {higherRoleUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Department  Dropdown  */}
            <FormControl fullWidth variant="outlined">
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                label="Department"
              >
                <MenuItem value="">None</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
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
              disabled={submitting}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "16px",
                borderRadius: 2,
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
                minWidth: "140px",
              }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create User"
              )}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={submitting}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "16px",
                borderRadius: 2,
                borderWidth: "2px",
                ":hover": { borderWidth: "2px" },
                minWidth: "140px",
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

export default CreateUser;
