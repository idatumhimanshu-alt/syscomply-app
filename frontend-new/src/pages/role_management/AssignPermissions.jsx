import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import axiosInstance from "../../services/axiosinstance";

const AssignPermissions = () => {
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  let company_id = sessionStorage.getItem("selectedCompany");

  const Module_id = "971a88b8-461e-4cd2-9a06-fce42ad6b806";

  useEffect(() => {
    axiosInstance
      .get(`/roles/${Module_id}`, {
        params: company_id ? { company_id } : {}, // Pass company_id only if it exists
      })
      .then((response) => {
        setRoles(response.data);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
      });
  }, []);

  const handleNext = (roleId) => {
    navigate(`/assignpermissionstorole/${roleId}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          mx: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {/* Page Title */}
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          Assign Role Permissions
        </Typography>

        {/* Header Row */}
        <Grid
          container
          sx={{
            mb: 1,
            px: 1,
            py: 1,
            backgroundColor: "#f0f0f0", // light gray
            borderRadius: 1,
          }}
          spacing={2}
        >
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{
                fontWeight: "bold",
                display: { xs: "none", sm: "block" }, 
              }}
            >
              Role Name
            </Typography>
          </Grid>
          <Grid item xs={12} sm={5}>
            <Typography
              sx={{
                fontWeight: "bold",
                display: { xs: "none", sm: "block" }, 
              }}
            >
              Description
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography
              sx={{
                fontWeight: "bold",
                display: { xs: "none", sm: "block" }, 
              }}
            >
              Action
            </Typography>
          </Grid>
        </Grid>

        {/* Roles List */}
        {roles.map((role) => (
          <Grid
            container
            key={role.id}
            alignItems="center"
            spacing={2}
            sx={{
              px: 1,
              py: 2,
              mb: 1,
              borderRadius: 1,
              backgroundColor: "#fff",
              boxShadow: 1,
              transition: "background-color 0.2s ease",
              "&:hover": {
                backgroundColor: "#f9f9f9",
              },
            }}
          >
            <Grid item xs={12} sm={4}>
              <Typography
                sx={{
                  fontWeight: 500,
                  display: { xs: "block", sm: "none" },
                  color: "text.secondary",
                }}
              >
                Role Name
              </Typography>
              <Typography>{role.name}</Typography>
            </Grid>

            <Grid item xs={12} sm={5}>
              <Typography
                sx={{
                  fontWeight: 500,
                  display: { xs: "block", sm: "none" },
                  color: "text.secondary",
                }}
              >
                Description
              </Typography>
              <Typography>{role.description}</Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Typography
                sx={{
                  fontWeight: 500,
                  display: { xs: "block", sm: "none" },
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Action
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth={true}
                onClick={() => handleNext(role.id)}
                sx={{
                  px: 2,
                  py: 0.8,
                  fontSize: 14,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                Assign Permissions
              </Button>
            </Grid>
          </Grid>
        ))}
      </Paper>
    </Container>
  );
};

export default AssignPermissions;
