import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Container,
  Paper,
  Grid,
} from "@mui/material";
import { toast } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";

const API_ROLE_URL = "/roles/971a88b8-461e-4cd2-9a06-fce42ad6b806";

const RoleUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState({
    name: "",
    description: "",
    parent_role_id: "",
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  let company_id = sessionStorage.getItem("selectedCompany");

  useEffect(() => {
    fetchRole();
    fetchRoles();
  }, []);

  const fetchRole = async () => {
    try {
      const response = await axiosInstance.get(`${API_ROLE_URL}/${id}`, {
        params: company_id ? { company_id } : {},
      });

      setRole(response.data);
    } catch (err) {
      setError("Failed to load role details");
      toast.error("Error fetching role details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
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

  const handleUpdateRole = async () => {
    if (role.name.trim() === "" || role.description.trim() === "") {
      setError("Both fields are required");
      return;
    }

    try {
      await axiosInstance.put(`${API_ROLE_URL}/${id}`, role);
      toast.success("Role updated successfully!");
      setTimeout(() => {
        navigate("/roles"); // Delay navigation by 1 second
      }, 1000);
    } catch (err) {
      toast.error("Failed to update role.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          mx: 4,
          borderRadius: 2,
          boxShadow: 3,
          mt: 3,
        }}
      >
        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <Box>
            {/* Title - Top Left */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 3,
                textAlign: "left",
              }}
            >
              Update Role
            </Typography>

            {/* Form */}
            <Grid container spacing={2}>
              {/* Role Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  variant="outlined"
                  value={role.name}
                  onChange={(e) => setRole({ ...role, name: e.target.value })}
                />
              </Grid>

              {/* Role Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role Description"
                  variant="outlined"
                  value={role.description}
                  onChange={(e) =>
                    setRole({ ...role, description: e.target.value })
                  }
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Parent Role Select */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="parent-role-label">Parent Role</InputLabel>
                  <Select
                    labelId="parent-role-label"
                    value={role.parent_role_id || ""}
                    onChange={(e) =>
                      setRole({ ...role, parent_role_id: e.target.value })
                    }
                    label="Parent Role"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {roles.map((roleItem) => (
                      <MenuItem key={roleItem.id} value={roleItem.id}>
                        {roleItem.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Action Buttons */}
              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateRole}
                  sx={{ textTransform: "none", fontWeight: "bold" }}
                >
                  Update
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate(-1)}
                  sx={{ textTransform: "none", fontWeight: "medium" }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default RoleUpdate;
