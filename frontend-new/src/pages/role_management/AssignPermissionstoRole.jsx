import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosinstance";

const AssignPermissionstoRole = () => {
  const { roleId } = useParams(); // Get the role ID from URL parameters
  const [roleName, setRoleName] = useState("");
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState({});
  const navigate = useNavigate();
  let company_id = sessionStorage.getItem("selectedCompany");
  useEffect(() => {
    // Fetch role name using roleId
    axiosInstance
      .get(`/roles/971a88b8-461e-4cd2-9a06-fce42ad6b806/${roleId}`, {
        params: { company_id },
      })
      .then((response) => {
        setRoleName(response.data.name);
      })
      .catch((error) => {
        console.error("Error fetching role details:", error);
        toast.error("Error fetching role details.");
      });

    // Fetch modules from the backend
    axiosInstance
      .get("/modules/881fc061-b852-4a9b-a430-ea96ba99194d")
      .then((response) => {
        setModules(response.data);
      })
      .catch((error) => {
        console.error("Error fetching modules:", error);
        toast.error("Error fetching modules.");
      });

    // Fetch existing permissions for the role
    axiosInstance
      .get(`/permissions/${roleId}`)
      .then((response) => {
        const existingPermissions = {};
        response.data.forEach((perm) => {
          existingPermissions[perm.module_id] = {
            can_read: perm.can_read,
            can_write: perm.can_write,
            can_delete: perm.can_delete,
            all: perm.can_read && perm.can_write && perm.can_delete,
          };
        });
        setPermissions(existingPermissions);
      })
      .catch((error) => {
        console.error("Error fetching assigned permissions:", error);
        toast.error("Error fetching assigned permissions.");
      });
  }, [roleId]);

  const handleCheckboxChange = (moduleId, permissionType) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev };

      if (permissionType === "all") {
        // Toggle all permissions for a module
        const allChecked = !prev[moduleId]?.all;
        newPermissions[moduleId] = {
          all: allChecked,
          can_read: allChecked,
          can_write: allChecked,
          can_delete: allChecked,
        };
      } else {
        // Toggle individual permission type
        newPermissions[moduleId] = {
          ...prev[moduleId],
          [permissionType]: !prev[moduleId]?.[permissionType] || false,
        };

        const { can_read, can_write, can_delete } = newPermissions[moduleId];
        newPermissions[moduleId].all = can_read && can_write && can_delete;
      }

      return newPermissions;
    });
  };

  const handleAssignPermissions = () => {
    const apiUrl = `/permissions/2f06d3b2-9121-4a2b-a5fe-7f1e4aae7270`;
    const formattedPermissions = Object.entries(permissions).map(
      ([moduleId, perms]) => ({
        module_id: moduleId,
        can_read: perms.can_read || false,
        can_write: perms.can_write || false,
        can_delete: perms.can_delete || false,
      })
    );

    const requestBody = {
      roleId: roleId,
      modules: formattedPermissions,
    };

    axiosInstance
      .post(apiUrl, requestBody)
      .then(() => {
        toast.success("Permissions assigned successfully!");
        navigate(-1); // Redirect to the previous page
      })
      .catch((error) => {
        console.error("Error assigning permissions:", error);
        toast.error("Error assigning permissions.");
      });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{ p: { xs: 2, sm: 3 }, mx: 4, borderRadius: 2, boxShadow: 3 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Assign Permissions to Role:{" "}
          <Box component="span" sx={{ color: "primary.main" }}>
            {roleName}
          </Box>
        </Typography>

        {/* Header Row */}
        <Grid
          container
          spacing={1}
          sx={{
            backgroundColor: "#f0f0f0",
            py: 1,
            px: 1,
            borderRadius: 1,
            mb: 1,
          }}
        >
          <Grid item xs={4}>
            <Typography fontWeight="bold">Module Name</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography fontWeight="bold">All</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography fontWeight="bold">Write</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography fontWeight="bold">Read</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography fontWeight="bold">Delete</Typography>
          </Grid>
        </Grid>

        {/* Module Rows */}
        {modules.map((module) => (
          <Grid
            container
            key={module.id}
            spacing={1}
            alignItems="center"
            sx={{
              px: 1,
              py: 1,
              borderRadius: 1,
              mb: 0.5,
              "&:hover": {
                backgroundColor: "#f9f9f9",
              },
            }}
          >
            <Grid item xs={12} sm={6} md={4}>
              <Typography>{module.name}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Checkbox
                checked={permissions[module.id]?.all || false}
                onChange={() => handleCheckboxChange(module.id, "all")}
                sx={{
                  width: 22,
                  height: 22,
                  p: 0.5,
                  "& .MuiSvgIcon-root": {
                    border: "1px solid rgba(0, 0, 0, 0.4)",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Checkbox
                checked={permissions[module.id]?.can_write || false}
                onChange={() => handleCheckboxChange(module.id, "can_write")}
                sx={{
                  width: 22,
                  height: 22,
                  p: 0.5,
                  "& .MuiSvgIcon-root": {
                    border: "1px solid rgba(0, 0, 0, 0.4)",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Checkbox
                checked={permissions[module.id]?.can_read || false}
                onChange={() => handleCheckboxChange(module.id, "can_read")}
                sx={{
                  width: 22,
                  height: 22,
                  p: 0.5,
                  "& .MuiSvgIcon-root": {
                    border: "1px solid rgba(0, 0, 0, 0.4)",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <Checkbox
                checked={permissions[module.id]?.can_delete || false}
                onChange={() => handleCheckboxChange(module.id, "can_delete")}
                sx={{
                  width: 22,
                  height: 22,
                  p: 0.5,
                  "& .MuiSvgIcon-root": {
                    border: "1px solid rgba(0, 0, 0, 0.4)",
                    borderRadius: "4px",
                  },
                }}
              />
            </Grid>
          </Grid>
        ))}

        {/* Action Buttons */}
        <Box
          mt={4}
          display="flex"
          justifyContent="flex-end"
          gap={2}
          flexWrap="wrap"
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleAssignPermissions}
            sx={{
              px: 3,
              py: 1.2,
              fontSize: "14px",
              borderRadius: 2,
              minWidth: "130px",
              boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
            }}
          >
            Assign Permissions
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate(-1)}
            sx={{
              px: 3,
              py: 1.2,
              fontSize: "14px",
              borderRadius: 2,
              minWidth: "130px",
            }}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AssignPermissionstoRole;
