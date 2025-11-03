import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Box, Paper, Grid } from "@mui/material";
import { toast } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState({ name: "", description: "" });
  const company_id = sessionStorage.getItem("selectedCompany");
  const UserModuleId = "bd168912-e40c-48e3-b3d1-440a3e129d52";

  useEffect(() => {
    if (id) {
      axiosInstance
        .get(`/department/${UserModuleId}/${id}`)
        .then((res) => setDepartment(res.data))
        .catch((err) => {
          console.error("Failed to fetch department:", err);
          toast.error("Failed to fetch department");
        });
    }
  }, [id]);

  const handleChange = (e) => {
    setDepartment({ ...department, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!company_id) {
      toast.error("Company ID is required.");
      return;
    }

    const dataToSend = { ...department, company_id };

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        toast.error("JWT Token is missing.");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (id) {
        await axiosInstance.put(
          `/department/${UserModuleId}/${id}`,
          dataToSend,
          config
        );
      } else {
        await axiosInstance.post(
          `/department/${UserModuleId}`,
          dataToSend,
          config
        );
      }

      toast.success("Department saved successfully!");
      navigate("/departments"); // Redirect to departments list page after save
    } catch (err) {
      console.error("Failed to save department:", err);
      toast.error("Failed to save department");
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "0.5rem",
        padding: 2,
        marginLeft: 4,
        marginRight: 2,
        marginTop: 4,
        mb: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {id ? "Edit Department" : "Create Department"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              name="name"
              fullWidth
              required
              margin="normal"
              value={department.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              fullWidth
              margin="normal"
              value={department.description}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} container justifyContent="flex-end" mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/departments")}
            >
              Cancel
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default DepartmentForm;
