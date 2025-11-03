import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { toast, ToastContainer } from "react-toastify";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";

const moduleId = "881fc061-b852-4a9b-a430-ea96ba99194d";

const ModuleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState({ name: "", description: "" });

  useEffect(() => {
    if (id) {
      // Fetch module details if editing
      axiosInstance
        .get(`/modules/${moduleId}/${id}`)
        .then((res) => {
          setModuleData(res.data);
          toast.info("Module details loaded", { position: "top-right" });
        })
        .catch((err) => {
          console.error("Error fetching module:", err);
          toast.error("Failed to fetch module details", {
            position: "top-right",
          });
        });
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = id
      ? axiosInstance.put(`/modules/${moduleId}/${id}`, moduleData) // Update module
      : axiosInstance.post(`/modules/${moduleId}`, moduleData); // Create new module

    request
      .then(() => {
        toast.success(`Module ${id ? "updated" : "created"} successfully`, {
          position: "top-right",
        });
        setTimeout(() => navigate("/modules"), 1500); // Delay navigation so toast is visible
      })
      .catch((err) => {
        console.error("Error saving module:", err);
        toast.error("Failed to save module", { position: "top-right" });
      });
  };

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <ToastContainer />
      <Paper
        elevation={4}
        sx={{
          mt: 4,
          p: 3,
          mx: 4,
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Title */}
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            {id ? "Edit Module" : "Create Module"}
          </Typography>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Module Name"
              fullWidth
              required
              value={moduleData.name}
              onChange={(e) =>
                setModuleData({ ...moduleData, name: e.target.value })
              }
            />
            <TextField
              label="Module Description"
              multiline
              rows={3}
              fullWidth
              value={moduleData.description}
              onChange={(e) =>
                setModuleData({ ...moduleData, description: e.target.value })
              }
            />
          </Box>

          {/* Submit Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2, // adds space between buttons
              mt: 3,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "16px",
                fontWeight: 500,
                borderRadius: 2,
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
              }}
            >
              {id ? "Update" : "Create"}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => window.history.back()}
              sx={{
                px: 3,
                py: 1.5,
                fontSize: "16px",
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              Close
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ModuleForm;
