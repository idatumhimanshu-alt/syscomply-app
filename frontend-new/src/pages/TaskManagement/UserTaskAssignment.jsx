import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../services/axiosinstance";
import {
  Autocomplete,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Grid,
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const UserTaskAssignment = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const navigate = useNavigate();

  const moduleId = "4a060652-4c92-47d8-9515-e500da5e94ef";
  let company_id = sessionStorage.getItem("selectedCompany");

  useEffect(() => {
    // Fetch users and tasks data on component mount
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          toast.error("Session expired. Please log in again.");
          navigate("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const [usersResponse, tasksResponse] = await Promise.all([
          axiosInstance.get(`/users/971a88b8-461e-4cd2-9a06-fce42ad6b806`, {
            headers,
            params: { company_id },
          }),
          axiosInstance.get(`/tasks/${moduleId}`, {
            headers,
            params: { company_id },
          }),
        ]);

        setUsers(usersResponse.data || []);
        setTasks(tasksResponse.data || []);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignTask = useCallback(async () => {
    // Ensure a user and tasks are selected before assigning
    if (!selectedUser || selectedTasks.length === 0) {
      toast.error("Please select a user and at least one task.");
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const requestData = {
        user_id: selectedUser.id,
        task_ids: selectedTasks.map((task) => task.id),
        assign_by: "superadmin",
      };

      await axiosInstance.post(
        `/task-assignments/5d896834-fedd-4e0b-a882-8d05396fc346`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Tasks assigned successfully!");
      setSelectedUser(null);
      setSelectedTasks([]);
    } catch (error) {
      console.error("API Error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to assign task.");
    } finally {
      setAssigning(false);
    }
  }, [selectedUser, selectedTasks]);

  const handleApiError = (error) => {
    // Handle API errors and redirect if unauthorized
    console.error("API Error:", error.response?.data || error);
    const errorMessage =
      error.response?.data?.message || "An unexpected error occurred.";
    toast.error(errorMessage);
    if (error.response?.status === 403) {
      localStorage.removeItem("jwtToken");
      navigate("/login");
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
        mx: 4,
        marginRight: 2,
        backgroundColor: "#ffffff",
        boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Grid container direction="column" spacing={3}>
        {/* Title */}
        <Grid item>
          <Typography
            variant="h3"
            fontWeight={"'bold"}
            sx={{ textAlign: "center" }}
          >
            User Task Assignment
          </Typography>
        </Grid>

        {/* Loader or Form */}
        <Grid item>
          {loading ? (
            <Grid container justifyContent="center">
              <CircularProgress sx={{ color: "#1976d2" }} />
            </Grid>
          ) : (
            <Grid container direction="column" spacing={2}>
              {/* User selection */}
              <Grid item>
                <Autocomplete
                  options={users}
                  getOptionLabel={(user) =>
                    user?.name
                      ? `${user.name} ${
                          user.department?.name
                            ? `(${user.department.name})`
                            : ""
                        }`
                      : user?.email || ""
                  }
                  value={selectedUser}
                  onChange={(event, newValue) =>
                    setSelectedUser(newValue || null)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      variant="outlined"
                      sx={{ backgroundColor: "#f5f5f5", borderRadius: "6px" }}
                    />
                  )}
                />
              </Grid>

              {/* Task selection */}
              <Grid item>
                <Autocomplete
                  multiple
                  options={tasks}
                  getOptionLabel={(task) => task.title || task.Checklist_Item}
                  value={selectedTasks}
                  onChange={(event, newValue) =>
                    setSelectedTasks(newValue || [])
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Tasks"
                      variant="outlined"
                      sx={{ backgroundColor: "#f5f5f5", borderRadius: "6px" }}
                    />
                  )}
                />
              </Grid>

              {/* Buttons aligned right */}
              <Grid
                item
                sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAssignTask}
                  size="small"
                  disabled={
                    assigning || !selectedUser || selectedTasks.length === 0
                  }
                  sx={{
                    fontWeight: "bold",
                    borderRadius: "6px",
                    backgroundColor: assigning ? "#1565c0" : "#1976d2",
                    "&:hover": { backgroundColor: "#1565c0" },
                  }}
                >
                  {assigning ? "Assigning..." : "Assign"}
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate("/tasks")}
                  size="small"
                  sx={{ fontWeight: "bold", borderRadius: "6px" }}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default UserTaskAssignment;
