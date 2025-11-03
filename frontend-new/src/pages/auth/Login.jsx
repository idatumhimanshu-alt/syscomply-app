// top level imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// MUI
import {
  Box,
  Grid2,
  Card,
  Typography,
  Button,
  Switch,
  TextField,
} from "@mui/material";
import { Facebook, GitHub, Google } from "@mui/icons-material";

import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../../services/axiosinstance";
import "../../styles/LoginPage.css";

// Component definition
export default function LoginPage({ background = "default" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return toast.warning("Email is required.");
    if (!password.trim()) return toast.warning("Password is required.");

    setLoading(true);

    try {
      // Authenticate user and get token
      const response = await axiosInstance.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const token = response.data.token;
      if (!token) throw new Error("No token received");

      // Decode token to extract user details
      const decodedToken = jwtDecode(token);
      const userId = decodedToken?.id || null;
      const roleId = decodedToken?.role || null;
      const name = decodedToken?.name || "User"; // Extract name
      const company_id = decodedToken?.company;

      if (!userId) {
        console.error("Error: userId is missing in token");
        toast.error("Login failed: User ID not found");
        return;
      }

      sessionStorage.clear();

      // Store token and user details
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("name", name);
      sessionStorage.setItem("selectedCompany", company_id);

      if (userId) localStorage.setItem("userId", userId);
      console.log("Stored userId:", userId);
      let roleName = "";

      if (roleId) {
        try {
          // Fetch user role using token and roleModuleId
          const roleModuleId = "971a88b8-461e-4cd2-9a06-fce42ad6b806"; // Role module ID
          const roleResponse = await axiosInstance.get(`/roles/${roleModuleId}/${roleId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { company_id: company_id }
          });

          roleName = roleResponse.data.name; // Using name instead of roleName to match API response
          localStorage.setItem("userRole", roleName);
          sessionStorage.setItem("selectedCompany", company_id);
          // Store role name and redirect to dashboard (sidebar will handle menu visibility)
          localStorage.setItem("userRole", roleName);
          navigate("/dashboard");
        } catch (error) {
          console.error("Error fetching role:", error.response?.data || error);
          toast.error("Failed to fetch user role.");
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }

      toast.success(`Welcome, ${name}!`);
    } catch (error) {
      console.error("Login Error:", error.response?.data || error);
      const backendError =
        error.response?.data?.error || error.response?.data?.message;
      switch (backendError) {
        case "User not found. Please check your email.":
        case "User is deactivated. Please contact admin.":
        case "Company is deactivated. Please contact admin.":
        case "Incorrect password. Please try again.":
          toast.error(backendError);
          break;
        default:
          toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return toast.warning("Please enter your email.");

    setForgotLoading(true);
    try {
      const res = await axiosInstance.post("http://localhost:5000/api/auth/forgotPassword", {
        email: forgotEmail,
      });

      toast.success(res.data.message || "Check your inbox.");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Something went wrong.");
    } finally {
      setForgotLoading(false);
    }
  };

  // main renderer
  return (
    <Box
      width="100vw"
      height="100%"
      minHeight="100vh"
      bgColor={background}
      sx={{ overflowX: "hidden" }}
    >
      {/* <Box
        position="absolute"
        width="100%"
        minHeight="100vh"
        sx={{
          backgroundImage: ({
            functions: { linearGradient, rgba },
            palette: { gradients },
          }) =>
            `${linearGradient(
              rgba(gradients.dark.main, 0.6),
              rgba(gradients.dark.state, 0.6)
            )}, url('/bg-sign-in-basic.jpeg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      /> */}

      <Box
        position="absolute"
        width="100%"
        minHeight="100vh"
        sx={{
          backgroundColor: "#191970", // solid midnight blue
        }}
      />

      <Box px={1} width="100%" height="100vh" mx="auto">
        <Grid2
          container
          spacing={1}
          justifyContent="center"
          alignItems="center"
          height="100%"
        >
          <Grid2
            size={{
              xs: 11,
              sm: 9,
              md: 5,
              lg: 4,
              xl: 3,
            }}
          >
            <Card>
              <Box
                mx={2}
                mt={-3}
                p={2}
                mb={1}
                textAlign="center"
                sx={{
                  background: "linear-gradient(195deg, #49a3f1, #1A73E8)",
                  borderRadius: "0.5rem",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight="medium"
                  color="white"
                  mt={1}
                >
                  Sign in
                </Typography>
                {/* <Grid2
                  container
                  spacing={3}
                  justifyContent="center"
                  sx={{ mt: 1, mb: 2 }}
                >
                  <Grid2 sx={{ xs: 2 }}>
                    <Typography href="#" variant="body1" color="white">
                      <Facebook color="inherit" />
                    </Typography>
                  </Grid2>
                  <Grid2 sx={{ xs: 2 }}>
                    <Typography href="#" variant="body1" color="white">
                      <GitHub color="inherit" />
                    </Typography>
                  </Grid2>
                  <Grid2 sx={{ xs: 2 }}>
                    <Typography href="#" variant="body1" color="white">
                      <Google color="inherit" />
                    </Typography>
                  </Grid2>
                </Grid2> */}
              </Box>
              <Box pt={4} pb={3} px={3}>
                <Box component="form" role="form" onSubmit={handleSubmit}>
                  <Box mb={2}>
                    <TextField
                      label="Email"
                      variant="outlined"
                      fullWidth
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input"
                      autoComplete="email"
                    />
                  </Box>
                  <Box mb={2}>
                    <TextField
                      label="Password"
                      variant="outlined"
                      fullWidth
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input"
                      autoComplete="current-password"
                    />
                  </Box>

                  <Box mb={1} textAlign="right">
                    <Typography
                      variant="body2"
                      sx={{ cursor: "pointer", color: "#1A73E8" }}
                      onClick={() => setShowForgotModal(true)}
                    >
                      Forgot Password?
                    </Typography>
                  </Box>

                  {/* <Box display="flex" alignItems="center" ml={-1}>
                    <Switch />
                    <Typography
                      variant="button"
                      fontWeight="regular"
                      color="text"
                      sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
                    >
                      &nbsp;&nbsp;Remember me
                    </Typography>
                  </Box> */}

                  <Box mt={4} mb={1}>
                    <Button
                      type="submit"
                      className="login-button"
                      disabled={loading || !email || !password}
                      fullWidth
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid2>
        </Grid2>
      </Box>

      {showForgotModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          bgcolor="rgba(0, 0, 0, 0.5)"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={1300}
          sx={{ backdropFilter: "blur(4px)" }}
        >
          <Card sx={{ width: { xs: "90%", sm: 400 }, p: 3, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="medium" mb={2}>
              Forgot Password
            </Typography>
            <Typography variant="body2" mb={2}>
              Enter your email to receive your new password.
            </Typography>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button
                onClick={() => setShowForgotModal(false)}
                color="secondary"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleForgotPassword}
                disabled={forgotLoading || !forgotEmail}
              >
                {forgotLoading ? "Sending..." : "Send New Password"}
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}
