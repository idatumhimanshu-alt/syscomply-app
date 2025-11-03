import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../../services/axiosinstance";
import { toast } from "react-toastify";

const SelectIterationPage = () => {
  const [iterations, setIterations] = useState([]);
  const [iterationId, setIterationId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const refresh = queryParams.get("refresh");
  const moduleId = "1f0f190d-3a83-421c-af98-5d081100230e";
  const [roleName, setRoleName] = useState(null);
  const token = localStorage.getItem("jwtToken");
  const decodedToken = token ? jwtDecode(token) : null;
  const roleId = decodedToken?.role || "";
  const company_id = decodedToken?.company || "";
  const roleModuleId = "971a88b8-461e-4cd2-9a06-fce42ad6b806";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleName = async () => {
      try {
        const response = await axiosInstance.get(
          `/roles/${roleModuleId}/${roleId}`,
          { params: { company_id } }
        );
        console.log("Fetched Role Name:", response.data.name);
        setRoleName(response.data.name);
      } catch (error) {
        console.error("Failed to fetch role name:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roleId) fetchRoleName();
    else setLoading(false);
  }, [roleId, company_id]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        console.log("Decoded Token:", decodedToken);
        setRoleName(decodedToken.role || decodedToken.role_name);
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    } else {
      console.warn("No JWT token found");
    }
  }, []);

  // Define fetchIterations **inside** the component scope
  const fetchIterations = async () => {
    try {
      const company_id = sessionStorage.getItem("selectedCompany");
      const token = localStorage.getItem("jwtToken");

      const response = await axiosInstance.get(`/iteration/${moduleId}`, {
        params: { company_id },
        headers: { Authorization: `Bearer ${token}` },
      });

      setIterations(response.data || []);
    } catch (error) {
      toast.error("Failed to load iterations.");
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchIterations();
  }, []);

  useEffect(() => {
    if (refresh) {
      fetchIterations().then(() => {
        navigate(location.pathname, { replace: true });
      });
    } else {
      fetchIterations();
    }
  }, [refresh]);

  const handleNext = () => {
    if (!iterationId) {
      toast.error("Please select an iteration.");
      return;
    }
    navigate(
      `/select-standard?iterationId=${iterationId}&moduleId=${moduleId}`
    );
  };

  const handleBack = () => {
    navigate(-1);
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
      {/* Title and optional Add Iteration button in the same row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight="bold">
          Select Iteration
        </Typography>

        {(roleName === "System Super Admin" || roleName === "Super Admin") && (
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              navigate(`/iteration/create/${moduleId}`, {
                state: { fromSelectPage: true },
              })
            }
          >
            Add Iteration
          </Button>
        )}
      </Box>

      <TextField
        select
        fullWidth
        label="Choose Iteration"
        value={iterationId}
        onChange={(e) => setIterationId(e.target.value)}
        sx={{ mb: 3 }}
      >
        {iterations.map((iter) => (
          <MenuItem
            key={iter.id}
            value={iter.id}
            disabled={iter.is_excel_uploaded} // disable if already uploaded
          >
            {iter.name}
          </MenuItem>
        ))}
      </TextField>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="contained" onClick={handleBack}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </Paper>
  );
};

export default SelectIterationPage;
