import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Container,
  Paper,
  Grid,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import axiosInstance from "../../services/axiosinstance";
const modulesModelId = "881fc061-b852-4a9b-a430-ea96ba99194d";

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch module list on component mount
    axiosInstance
      .get(`/modules/${modulesModelId}`)
      .then((res) => setModules(res.data))
      .catch((err) => {
        console.error("Error fetching modules:", err);
        toast.error("Failed to fetch modules");
      });
  }, []);

  const handleEdit = (moduleId) => navigate(`/modules/${moduleId}`); // Navigate to edit page

  const handleDelete = (moduleId) => {
    toast.dismiss();
    toast.info(
      <div>
        <p>Are you sure you want to delete this module?</p>
        <button onClick={() => confirmDelete(moduleId)}>Yes</button>
        <button onClick={() => toast.dismiss()}>No</button>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const confirmDelete = (moduleId) => {
    axiosInstance
      .delete(`/modules/${modulesModelId}/${moduleId}`)
      .then(() => {
        setModules(modules.filter((module) => module.id !== moduleId)); // Remove deleted module
        toast.success("Module deleted successfully");
      })
      .catch((err) => {
        console.error("Error deleting module:", err);
        toast.error("Failed to delete module");
      });
    toast.dismiss();
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, mt: 4 }}>
      <ToastContainer />

      <Paper
        elevation={4}
        sx={{
          p: 3,
          mx: { xs: 1, sm: 3, md: 4 }, // 👈 add horizontal margin (left & right)
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header Section */}
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Grid item>
            <Typography variant="h5" fontWeight={600}>
              Modules
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/modules/new")}
              sx={{ textTransform: "none", px: 3 }}
            >
              Add Module
            </Button>
          </Grid>
        </Grid>

        {/* Grid Header */}
        <Grid
          container
          sx={{
            display: { xs: "none", sm: "flex" },
            py: 1,
            px: 1,
            backgroundColor: "#f5f5f5",
            borderBottom: "2px solid #ddd",
            fontWeight: "bold",
          }}
        >
          <Grid item sm={4}>
            Module Name
          </Grid>
          <Grid item sm={6}>
            Description
          </Grid>
          <Grid item sm={2}>
            Actions
          </Grid>
        </Grid>

        {/* Module Rows */}
        {modules.map((module, index) => (
          <Grid
            container
            key={module.id}
            spacing={2}
            sx={{
              py: 1.5,
              px: 1,
              borderBottom:
                index !== modules.length - 1 ? "1px solid #eee" : "none",
              bgcolor: "#fff",
              borderRadius: { xs: 2, sm: 0 },
              mt: { xs: 2, sm: 0 },
              flexDirection: { xs: "column", sm: "row" },
              transition: "background-color 0.2s ease",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            {/* Module Name */}
            <Grid item xs={12} sm={4}>
              <Typography
                fontWeight="bold"
                sx={{ display: { sm: "none" }, mb: 0.5 }}
              >
                Module Name:
              </Typography>
              <Typography>{module.name}</Typography>
            </Grid>

            {/* Description */}
            <Grid item xs={12} sm={6}>
              <Typography
                fontWeight="bold"
                sx={{ display: { sm: "none" }, mb: 0.5 }}
              >
                Description:
              </Typography>
              <Typography>{module.description}</Typography>
            </Grid>

            {/* Actions */}
            <Grid
              item
              xs={12}
              sm={2}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: { xs: 1, sm: 0 },
                justifyContent: { xs: "flex-start", sm: "center" },
              }}
            >
              <IconButton color="primary" onClick={() => handleEdit(module.id)}>
                <Edit />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(module.id)}>
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Paper>
    </Container>
  );
};

export default ModuleList;
