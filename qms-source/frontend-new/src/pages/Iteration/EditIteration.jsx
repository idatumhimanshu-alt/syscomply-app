import React, { useState, useEffect } from "react";
import {
  Paper,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosinstance";
import { parseISO, format } from "date-fns";
import { toast } from "react-toastify"; // <-- Import toast

const EditIteration = () => {
  const { taskModuleId, iterationId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const safeFormatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  useEffect(() => {
    axiosInstance
      .get(`/iteration/${taskModuleId}/${iterationId}`)
      .then((res) => {
        const data = res.data;
        setForm({
          name: data.name || "",
          description: data.description || "",
          startDate: safeFormatDate(data.start_date),
          endDate: safeFormatDate(data.end_date),
        });
      })
      .catch((err) => {
        console.error("Error fetching iteration:", err);
      });
  }, [taskModuleId, iterationId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description,
        start_date: form.startDate,
        end_date: form.endDate,
      };

      await axiosInstance.put(
        `/iteration/${taskModuleId}/${iterationId}`,
        payload
      );

      toast.success("Iteration updated successfully!");
      navigate(`/iteration/${taskModuleId}`);
    } catch (err) {
      console.error("Error updating iteration:", err);
      toast.error("Failed to update iteration.");
    }
  };

  const handleCancel = () => {
    navigate(`/iteration/${taskModuleId}`);
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
        Edit Iteration
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
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
             variant="contained"
             color="primary"
              onClick={handleSubmit}
              >
              Save Changes
            </Button>
            <Button
             variant="contained"
              color="primary"
               onClick={handleCancel}
               >
              Cancel
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EditIteration;
