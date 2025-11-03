import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  MenuItem,
  Button,
  Container,
  Typography,
  Paper,
  Grid2,
} from "@mui/material";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";

const CreateTask = () => {
  const navigate = useNavigate();
  const [iterations, setIterations] = useState([]);
  const [iterationId, setIterationId] = useState("");
  const [task, setTask] = useState({
    auditee: "",
    area: "",
    Checklist_Item: "",
    notes: "",
    Type_of_Finding: "",
    status: "",
    description: "",
    standard: "",
    //task_type: "Process",
    // expected_artifact: "",
    // actual: " ",
    // compliance: "",
    priority: "",
    responsibility: "",
    RCA_Details: "",
    Planned_Completion_Date:"",
    Actual_Completion_Date: null,
    clause_number: "",
    document_reference: "",
    document: "",
  });
  const [loading, setLoading] = useState(false);

  const taskModuleId = "1f0f190d-3a83-421c-af98-5d081100230e";

  useEffect(() => {
    const fetchIterations = async () => {
      try {
        const company_id = sessionStorage.getItem("selectedCompany");

        if (!company_id) {
          toast.error("Company ID is required.");
          return;
        }

        const response = await axiosInstance.get(`/iteration/${taskModuleId}`, {
          params: { company_id },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        });

        setIterations(response.data || []);
      } catch (error) {
        const errorMsg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Unknown error";

        console.error("Error fetching iterations:", errorMsg, error.response);
        toast.error(`Failed to fetch iterations: ${errorMsg}`);
      }
    };

    fetchIterations();
  }, []);

  const validateFields = () => {
    if (!task.Checklist_Item) {
      toast.error("Checklist Item is required.");
      return false;
    }

    if (!iterationId) {
      toast.error("Iteration is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;
    setLoading(true);

    const moduleId = "4a060652-4c92-47d8-9515-e500da5e94ef";
    let company_id = sessionStorage.getItem("selectedCompany");

    try {
      console.log("Company ID:", company_id);

      const response = await axiosInstance.post(
        `/tasks/${moduleId}`,
        { ...task, company_id, iteration_id: iterationId },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 201) {
        toast.success("Task created successfully");
        navigate("/tasks");
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (error) {
      console.error(
        "Error creating task:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.error || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "0.5rem",
        padding: 2,
        marginLeft: 4,
        mb: 2,
        marginRight: 2,
      }}
    >
      <Typography
        variant="h3"
        fontWeight={"'bold"}
        sx={{ textAlign: "center" }}
      >
        Create Task
      </Typography>

      <Grid2
        container
        spacing={4}
        mt={2}
        component="form"
        onSubmit={handleSubmit}
      >
        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            select
            fullWidth
            label="Select Iteration"
            value={iterationId}
            onChange={(e) => setIterationId(e.target.value)}
            required
          >
            <MenuItem value="" disabled>
              Select Iteration
            </MenuItem>
            {iterations.map((iter) => (
              <MenuItem key={iter.id} value={iter.id}>
                {iter.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            select
            label="Auditee"
            name="auditee"
            value={task.auditee}
            onChange={(e) => setTask({ ...task, auditee: e.target.value })}
            required
          >
            {[
              "CISO",
              "HOD-HR",
              "HOD-Facility Admin",
              "HOD-IT",
              "HOD-Purchase",
              "IT Administration",
              "Project Manager - SDLC",
            ].map((auditee) => (
              <MenuItem key={auditee} value={auditee}>
                {auditee}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            label="Area"
            name="area"
            value={task.area}
            onChange={(e) => setTask({ ...task, area: e.target.value })}
            required
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            label="Checklist Item"
            name="Checklist Item"
            value={task.Checklist_Item}
            onChange={(e) =>
              setTask({ ...task, Checklist_Item: e.target.value })
            }
            required
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={task.notes}
            onChange={(e) => setTask({ ...task, notes: e.target.value })}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 ,lg: 6 }}>
          <TextField
            fullWidth
            select
            label="Type of Finding"
            name="Type_of_Finding"
            value={task.Type_of_Finding}
            onChange={(e) =>
              setTask({ ...task, Type_of_Finding: e.target.value })
            }
           // margin="normal"
            required
          >
            {[
              "Compliance",
              "Observation",
              "Non-Compliance",
              "Opportunity For Improvement",
            ].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 ,lg: 6 }}>
          <TextField
            fullWidth
            select
            label="Status"
            name="status"
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value })}
            //margin="normal"
          >
            {[
              // "FI",
              // "PI",
              // "NI",
              // "NA",
              // "TBD",
              // "OFI",
              // "Obs",
              // "NC- Minor",
              // "NC- Major",
              "Not Done",
              "Partially Done",
              "In-Progress",
              "Largely Done",
              "Done",
              "NA",
            ].map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            multiline
            rows={1}
            required
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            select
            label="Standard"
            name="standard"
            value={task.standard}
            onChange={(e) => setTask({ ...task, standard: e.target.value })}
            required
          >
            {["ISO_9001", "ISO_27001"].map((standard) => (
              <MenuItem key={standard} value={standard}>
                {standard}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        {/* <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            select
            label="Task Type"
            name="task_type"
            value={task.task_type}
            onChange={(e) => setTask({ ...task, task_type: e.target.value })}
            required
          >
            {["Control", "Process", "Procedure", "Monitoring", "Material"].map(
              (taskType) => (
                <MenuItem key={taskType} value={taskType}>
                  {taskType}
                </MenuItem>
              )
            )}
          </TextField>
        </Grid2> */}

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            select
            label="Priority"
            name="priority"
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
          >
            {["High", "Medium", "Low"].map((priority) => (
              <MenuItem key={priority} value={priority}>
                {priority}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}>
          <TextField
            fullWidth
            label="Responsibility"
            name="responsibility"
            value={task.responsibility}
            onChange={(e) =>
              setTask({ ...task, responsibility: e.target.value })
            }
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, }}>
          <TextField
            fullWidth
            label="RCA Details"
            name="RCA_Details"
            value={task.RCA_Details}
            onChange={(e) => setTask({ ...task, RCA_Details: e.target.value })}
          //  margin="normal"
            multiline
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 , lg: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="Planned Completion Date"
            name="Planned_Completion_Date"
            value={task.Planned_Completion_Date}
            onChange={(e) =>
              setTask({ ...task, Planned_Completion_Date: e.target.value })
            }
           // margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 , lg: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="Actual Completion Date"
            name="Actual_Completion_Date"
            value={task.Actual_Completion_Date}
            onChange={(e) =>
              setTask({ ...task, Actual_Completion_Date: e.target.value })
            }
           // margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 , lg: 6 }}>
          <TextField
            fullWidth
            label="Reference - Clause"
            name="clause_number"
            value={task.clause_number}
            onChange={(e) =>
              setTask({ ...task, clause_number: e.target.value })
            }
           // margin="normal"
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, lg: 6 }}></Grid2>
        <Grid2
          size={{ xs: 12, md: 12 }}
          sx={{ display: "flex", justifyContent: "flex-end", mt: 0, gap: 1 }}
        >
          <Button variant="contained" color="primary" type="submit">
            Create Task
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/tasks")}
          >
            Cancel
          </Button>
        </Grid2>
      </Grid2>
    </Paper>
  );
};

export default CreateTask;
