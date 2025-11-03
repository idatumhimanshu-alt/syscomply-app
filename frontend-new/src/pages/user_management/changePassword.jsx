import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import { toast } from "react-toastify";
import axiosInstance from "../../services/axiosinstance";

const ChangePassword = () => {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  // Automatically fetch email from localStorage.
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // 🔹 Validations
    if (!email.trim()) return toast.warning("Email is required.");
    if (!oldPassword.trim()) return toast.warning("Old Password is required.");
    if (!newPassword.trim()) return toast.warning("New Password is required.");
    if (newPassword !== confirmNewPassword)
      return toast.error("Passwords do not match.");
    if (newPassword.length < 8)
      return toast.warning("New password must be at least 8 characters long.");

    setLoading(true);

    try {
      const token = localStorage.getItem("jwtToken"); // Get JWT token

      const response = await axiosInstance.post(
        "/auth/changePassword",
        { email, oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message || "Password changed successfully!");

      // 🔹 Clear form fields after success
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // 🔹 Redirect to the previous page after 2 seconds
      setTimeout(() => {
        navigate(-1); // Navigates back to the previous page
      }, 2000);
    } catch (error) {
      console.error("Error:", error.response?.data || error);
      toast.error(
        error.response?.data?.message || "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={4}
        sx={{
          mt: 4,
          p: 3,
          mx: 8,
          borderRadius: 3,
          backgroundColor: "#f9f9f9",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Grid container justifyContent="flex-start" mb={3}>
          <Grid item>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Change Password
            </Typography>
          </Grid>
        </Grid>

        <form onSubmit={handleChangePassword}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
            />
            <TextField
              label="Old Password"
              variant="outlined"
              fullWidth
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <TextField
              label="New Password"
              variant="outlined"
              fullWidth
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm New Password"
              variant="outlined"
              fullWidth
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 3,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "16px",
                fontWeight: 500,
                borderRadius: 2,
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
              }}
            >
              {loading ? "Updating..." : "Change Password"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ChangePassword;
