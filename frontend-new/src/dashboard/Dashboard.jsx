import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  ListItemIcon,
  Paper,
  Grid2,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../services/axiosinstance";
import LockIcon from "@mui/icons-material/Lock";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PersonIcon from "@mui/icons-material/Person";
import { useMaterialUIController, setSelectedCompanyName } from "../context";

const moduleId = "bd168912-e40c-48e3-b3d1-440a3e129d52";

const Dashboard = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState("User");
  const [roleName, setRoleName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [controller, dispatch] = useMaterialUIController();

  // Extracting user details from JWT Token
  const token = localStorage.getItem("jwtToken");
  const decodedToken = token ? jwtDecode(token) : null;
  const userId = decodedToken?.user_id || localStorage.getItem("userId"); // Get from token or localStorage
  const roleId = decodedToken?.role || "";
  const company_id = decodedToken?.company || "";
  console.log("Decoded Token:", decodedToken);

  const fetchRoleName = async () => {
    try {
      const response = await axiosInstance.get(
        `/roles/${moduleId}/${roleId}`, {
        params: { company_id },
      });
      setRoleName(response.data.name || "Unknown Role");
    } catch (error) {
      console.error("Error fetching role name:", error);
    }
  };

  const fetchCompanyName = async () => {
    try {
      const storedCompanyName = sessionStorage.getItem("selectedCompanyName");

      if (storedCompanyName) {
        setCompanyName(storedCompanyName);
        return;
      }

      if (company_id) {
        const token = localStorage.getItem("jwtToken");

        if (!token) {
          console.error("JWT Token is missing");
          return;
        }

        console.log("Using token:", token); // Debugging

        const response = await axiosInstance.get(
          `/companies/5d896834-fedd-4e0b-a882-8d05396fc346/${company_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const name = response.data.name || "Unknown Company";
        setCompanyName(name);
        sessionStorage.setItem("selectedCompanyName", name);
        setSelectedCompanyName(dispatch, name);
      }
    } catch (error) {
      console.error("Error fetching company name:", error);
      if (error.response) {
        console.error("Error details:", error.response.data);
      }
    }
  };

  const fetchUserProfile = async () => {
    if (userId) {
      console.log("User ID:", userId);
      console.log("Role Name:", roleName);
      console.log("Company ID:", company_id);

      try {
        const params =
          roleName === "System Super Admin" && company_id
            ? { company_id: company_id }
            : {};

        console.log("API request params:", params); // Debugging

        const response = await axiosInstance.get(
          `/users/${moduleId}/${userId}`,
          { params }
        );

        console.log("API Response:", response.data); // Debugging

        if (response.data) {
          setUserName(response.data.name || "User");
          localStorage.setItem("name", response.data.name);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        if (error.response) {
          console.error("Backend error details:", error.response.data);
        }
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Fetch role first, then fetch user profile
    const fetchData = async () => {
      if (roleId) await fetchRoleName();
      if (company_id) await fetchCompanyName();

      if (roleName && (roleName !== "System Super Admin" || company_id)) {
        fetchUserProfile();
      }
    };

    fetchData();
  }, [navigate, userId, roleId, company_id, roleName]);

  // Menu Handlers
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("name");

    sessionStorage.removeItem("selectedCompany");
    sessionStorage.removeItem("selectedCompanyName");
    sessionStorage.removeItem("companyname");
    sessionStorage.clear();
    setSelectedCompanyName(dispatch, "");

    navigate("/login");
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: 2,
        borderRadius: "0.5rem",
        marginLeft: 4,
        marginRight: 2,
      }}
    >
      <Grid2 container fullWidth>
        <Grid2
          size={{ xs: 12, md: 5 }}
          mb={4}
          sx={{
            display: "flex",
            justifyContent: { xs: "center", md: "start" },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              fontSize: "2.5rem",
              fontFamily: "Poppins, sans-serif",
              color: "#1976d2",
              textShadow: "1px 1px 3px rgba(0, 0, 0, 0.2)",
            }}
          >
            Dashboard
          </Typography>
        </Grid2>

        <Grid2
          size={{ xs: 12, md: 7 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "center", md: "flex-end" },
          }}
        >
          {/* User Info Box */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#1976d2",
                fontSize: "1.2rem",
                textAlign: "center",
                whiteSpace: "pre-line",
              }}
            >
              Hello, {userName} {"\n"} ({roleName})
            </Typography>

            {/* Profile Icon */}
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                variant="square"
                src={profileImage || ""}
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: 2,
                  backgroundColor: profileImage ? "#fff" : "#1976d2",
                  border: "2px solid #1976d2",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {!profileImage && (
                  <PersonIcon sx={{ color: "#fff", fontSize: 30 }} />
                )}
              </Avatar>
            </IconButton>

            {/* <IconButton
              onClick={handleSelectStandardClick}
              sx={{
                backgroundColor: "#1976d2",
                color: "white",
                fontSize: "0.8rem",
                fontWeight: "bold",
                borderRadius: "8px",
                mt: 1,
                px: 2,
                py: 0.5,
                "&:hover": { backgroundColor: "#125ea8" },
              }}
            >
              Select Standard
            </IconButton> */}

            {/* System Super Admin Features */}
            {roleName === "System Super Admin" && (
              <>
                <IconButton
                  onClick={() => navigate("/SelectCompany")}
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    borderRadius: "8px",
                    mt: 1,
                    px: 2,
                    py: 0.5,
                    "&:hover": { backgroundColor: "#125ea8" },
                  }}
                >
                  Select Company
                </IconButton>
                <Typography variant="body2" sx={{ color: "#555" }}>
                  {companyName || "No Company Selected"}
                </Typography>
              </>
            )}
          </Box>

          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate("/changePassword")}>
              <ListItemIcon>
                <LockIcon fontSize="small" sx={{ color: "#1976d2" }} />
              </ListItemIcon>
              Change Password
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: "red" }}>
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" sx={{ color: "red" }} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Grid2>
      </Grid2>

    </Paper>
  );
};
export default Dashboard;
