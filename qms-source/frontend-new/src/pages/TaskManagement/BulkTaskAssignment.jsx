import React, { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosinstance";
import {
  Autocomplete,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  Grid,
  TablePagination,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";

const BulkTaskAssignment = () => {
  const [getAllUsers, setGetAllUsers] = useState([]); // For display purposes
  const [getAssignableUsers, setGetAssignableUsers] = useState([]); // For selection
  const [tasks, setTasks] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(5); // Pagination rows per page
  const navigate = useNavigate();
  const taskModuleId = "1f0f190d-3a83-421c-af98-5d081100230e";
  const taskAssignmentModuleId = "8530da98-7369-4ab7-9400-37cf4019e148";
  const [iterations, setIterations] = useState([]);
  const [iterationId, setIterationId] = useState("");

  useEffect(() => {
    const fetchUsersAndTasks = async () => {
      setLoading(true);
      try {
        let token = localStorage.getItem("jwtToken");
        let company_id = sessionStorage.getItem("selectedCompany");

        if (!token) {
          toast.error("Session expired. Please log in again.");
          navigate("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Step 1 & 2: Fetch All Users & Assignable Users in parallel
        const [allUsersResponse, assignableUsersResponse, iterationsResponse] =
          await Promise.all([
            axiosInstance.get("/users/bd168912-e40c-48e3-b3d1-440a3e129d52", {
              headers,
              params: { company_id },
            }),
            axiosInstance.get(
              "/users/bd168912-e40c-48e3-b3d1-440a3e129d52//getAssignableUser",
              {
                headers,
                params: { company_id },
              }
            ),
            axiosInstance.get(`/iteration/${taskModuleId}`, {
              headers,
              params: { company_id }, // Add this to fetch iterations
            }),
          ]);

        // const allUsers = allUsersResponse.data || [];
        // const assignableUsers = assignableUsersResponse.data || [];
        // setIterations(iterationsResponse.data || []);
        // setGetAllUsers(allUsers);
        // setGetAssignableUsers(assignableUsers);
        setGetAllUsers(allUsersResponse.data || []);
        setGetAssignableUsers(assignableUsersResponse.data || []);
        setIterations(iterationsResponse.data || []);

        // Step 3: Fetch Tasks
        const tasksResponse = await axiosInstance.get(
          `/tasks/${taskModuleId}`,
          {
            headers,
            params: { company_id, iteration_id: iterationId || undefined },
          }
        );

        const tasksData = tasksResponse.data || [];
        setTasks(tasksData);

        console.log("Tasks Fetched: ", tasksData);

        // Step 4: Fetch Task Assignments
        const assignmentsResponse = await axiosInstance.get(
          `/task-assignments/${taskAssignmentModuleId}`,
          { headers, params: { company_id } }
        );

        const assignments = assignmentsResponse.data.reduce(
          (acc, assignment) => {
            const users = assignment.user_ids
              .map((id) => {
                const user = allUsersResponse.data.find((u) => u.id === id);

                if (!user) {
                  console.warn(
                    `User with ID ${id} not found in allUsersResponse`
                  );
                }
                return user;
              })
              .filter(Boolean);

            acc[assignment.task_id] = users;
            return acc;
          },
          {}
        );

        setTaskAssignments(assignments);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error);
        if (error.response?.status === 403) {
          toast.error("Access denied. Please log in again.");
          localStorage.removeItem("jwtToken");
          navigate("/login");
        } else {
          toast.error("Failed to fetch data.");
        }
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchUsersAndTasks();
  }, [navigate, iterationId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page
  };

  const handleAssignAllTasks = async () => {
    const assignments = Object.keys(taskAssignments)
      .map((taskId) => ({
        task_id: taskId,
        user_ids: (taskAssignments[taskId] || [])
          .map((user) => user?.id)
          .filter(Boolean),
      }))
      .filter((assignment) => assignment.user_ids.length > 0);

    if (assignments.length === 0) {
      toast.error("Please assign at least one user to a task.");
      return;
    }

    try {
      let token = localStorage.getItem("jwtToken");

      const requestData = { assignments };

      console.log(
        " Sending requestData:",
        JSON.stringify(requestData, null, 2)
      );

      const response = await axiosInstance.post(
        `/task-assignments/${taskAssignmentModuleId}`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(" API Response:", response.data);

      toast.success("Tasks assigned successfully!");
      navigate("/tasks");
    } catch (error) {
      console.error("Error assigning tasks:", error.response?.data || error);
      toast.error(error.response?.data?.error || "Failed to assign tasks.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "200px" }}>
        <CircularProgress size={50} thickness={2} />
      </div>
    );
  }

  // Slice tasks for pagination
  const paginatedTasks = tasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mx: 8 }}>
      <Grid container spacing={3} direction="column">
        {/* Title */}
        <Grid item>
          <Typography variant="h3" fontWeight="bold" sx={{ ml: 2 }}>
            Bulk Task Assignment
          </Typography>
        </Grid>

        {/* Iteration Filter */}
        <Grid item sx={{ mb: 0.5, mt: 0 }}>
          <TextField
            select
            label="Filter by Iteration"
            value={iterationId}
            onChange={(e) => setIterationId(e.target.value)}
            fullWidth={false}
            size="small"
            variant="outlined"
            margin="dense"
            InputLabelProps={{
              shrink: true,
            }}
            SelectProps={{
              displayEmpty: true,
              MenuProps: {
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left",
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left",
                },
                PaperProps: {
                  style: {
                    maxHeight: 250,
                    width: "auto",
                  },
                },
              },
            }}
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
              },
              "& .MuiInputLabel-root": {
                color: "rgba(0, 0, 0, 0.6)",
              },
            }}
          >
            <MenuItem value="">All Iterations</MenuItem>
            {iterations.map((iter) => (
              <MenuItem key={iter.id} value={iter.id}>
                {iter.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Assign All Button */}
        <Grid item>
          <Grid container justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleAssignAllTasks}
              sx={{
                mb: 2,
                textTransform: "none",
                fontWeight: "medium",
                boxShadow: 2,
                px: 3,
              }}
            >
              Assign All
            </Button>
          </Grid>
        </Grid>

        {/* Column Headers */}
        <Grid item>
          <Grid
            container
            sx={{
              backgroundColor: "#f5f5f5",
              borderRadius: 1,
              px: 2,
              py: 1,
              fontWeight: "bold",
            }}
          >
            <Grid item xs={6}>
              <Typography sx={{ fontWeight: 600 }}>Checklist_Item</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontWeight: 600 }}>Assigned Users</Typography>
            </Grid>
          </Grid>
        </Grid>

        {/* Task Rows */}
        {paginatedTasks.map((task) => (
          <Grid item key={task.id} xs={12} sm={6} md={4}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fff",
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "1rem" }}>
                    {task.title || task.Checklist_Item}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={getAssignableUsers || []}
                    getOptionLabel={(user) =>
                      user
                        ? `${user.name || user.email || "Unknown User"}${
                            user.department?.name
                              ? ` (${user.department.name})`
                              : ""
                          }`
                        : "Unknown User"
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    value={taskAssignments[task.id] || []}
                    onChange={(event, newValue) => {
                      const nonRemovableUsers = (
                        taskAssignments[task.id] || []
                      ).filter(
                        (user) =>
                          !getAssignableUsers.some(
                            (assignable) => assignable.id === user.id
                          )
                      );

                      const uniqueUsersMap = new Map();
                      nonRemovableUsers.forEach((user) =>
                        uniqueUsersMap.set(user.id, user)
                      );
                      newValue.forEach((user) =>
                        uniqueUsersMap.set(user.id, user)
                      );

                      setTaskAssignments({
                        ...taskAssignments,
                        [task.id]: Array.from(uniqueUsersMap.values()),
                      });
                    }}
                    renderTags={(value, getTagProps) =>
                      value
                        .filter((option) => option)
                        .map((option, index) => {
                          const tagProps = getTagProps({ index });
                          const { key, ...restTagProps } = tagProps;

                          return (
                            <Chip
                              key={option.id || key}
                              label={`${
                                option.name || option.email || "Unknown User"
                              }${
                                option.department?.name
                                  ? ` (${option.department.name})`
                                  : ""
                              }`}
                              onDelete={
                                getAssignableUsers.some(
                                  (assignable) => assignable.id === option.id
                                )
                                  ? tagProps.onDelete
                                  : undefined
                              }
                              sx={{ mr: 0.5, mb: 0.5 }}
                              {...restTagProps}
                            />
                          );
                        })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Users"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    sx={{ minWidth: "100%" }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        />
      </Grid>
    </Paper>
  );
};

export default BulkTaskAssignment;
