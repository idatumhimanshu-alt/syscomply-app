import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  Paper,
} from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";

const CreateIteration = () => {
  const { taskModuleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Basic validation to check if name, startDate, and endDate are provided
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error("Name, Start Date, and End Date are required.");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      start_date: form.startDate,
      end_date: form.endDate,
      company_id: form.company_id,
    };

    const fromSelectPage = location.state?.fromSelectPage;

    try {
      // Submit the form data to the backend
      await axiosInstance.post(`/iteration/${taskModuleId}`, payload);

      toast.success("Iteration created successfully!");
      //navigate(-1,{ state: { refresh: true } });
      if (fromSelectPage) {
        navigate("/select-iteration?refresh=1");
      } else {
        navigate(`/iteration/${taskModuleId}?refresh=1`);
      }
    } catch (err) {
      // Handle errors more gracefully with better feedback
      if (err.response) {
        // The server responded with an error status
        toast.error(`Error: ${err.response.data.error || "Unknown error"}`);
        console.error("Error creating iteration:", err.response.data);
      } else {
        toast.error("Network error, please try again.");
        console.error("Error creating iteration:", err);
      }
    }
  };

  // Load company_id from sessionStorage for System Super Admin
  React.useEffect(() => {
    const storedCompanyId = sessionStorage.getItem("selectedCompany");
    if (storedCompanyId) {
      setForm((prevForm) => ({ ...prevForm, company_id: storedCompanyId }));
    }
  }, []);

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
          Create Iteration
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              name="startDate"
              InputLabelProps={{ shrink: true }}
              value={form.startDate}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              name="endDate"
              InputLabelProps={{ shrink: true }}
              value={form.endDate}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}></Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
              >
                Create
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/iteration/${taskModuleId}`)}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
    </Paper>
  );
};

export default CreateIteration;
