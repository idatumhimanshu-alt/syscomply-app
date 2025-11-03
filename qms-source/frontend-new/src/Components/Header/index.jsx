import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

import { navbar, navbarContainer, navbarRow } from "./style";

import {
  useMaterialUIController,
  setTransparentNavbar,
  setSelectedCompanyName,
} from "../../context";
import {
  AppBar,
  Toolbar,
  Box,
  Breadcrumbs,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";

// Icons
import NotificationMenu from "../NotificationMenu";
import LockIcon from "@mui/icons-material/Lock";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PersonIcon from "@mui/icons-material/Person";

// api services
import axiosInstance from "../../services/axiosinstance";
import { AccountCircle } from "@mui/icons-material";

// Component definition
export default function Header() {
  const token = localStorage.getItem("jwtToken");
  const decodedToken = token ? jwtDecode(token) : null;
  const userId = decodedToken?.user_id || localStorage.getItem("userId"); // Get from token or localStorage
  const roleId = decodedToken?.role || "";
  const company_id = decodedToken?.company || "";
  const moduleId = "bd168912-e40c-48e3-b3d1-440a3e129d52";
  const company_moduleId = "5d896834-fedd-4e0b-a882-8d05396fc346";

  // state definitions
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState("User");
  const [roleName, setRoleName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // hooks
  const [controller, dispatch] = useMaterialUIController();
  const { transparentNavbar, fixedNavbar, darkMode, selectedCompanyName } =
    controller;
  const navigate = useNavigate();

  useEffect(() => {
    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(
        dispatch,
        (fixedNavbar && window.scrollY === 0) || !fixedNavbar
      );
    }

    /** 
         The event listener that's calling the handleTransparentNavbar function when 
         scrolling the window.
        */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  /** Handler functions -  starts */

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

  // 1️ Fetch role
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (roleId) fetchRoleName();
  }, [token, navigate, roleId]);

  // 2️ Once roleName is ready → then fetch company name and profile
  useEffect(() => {
    if (!roleName) return;

    if (roleName === "System Super Admin") {
      const storedCompanyName =
        typeof window !== "undefined"
          ? sessionStorage.getItem("selectedCompanyName")
          : null;

      if (storedCompanyName) {
        setCompanyName(storedCompanyName);
        setSelectedCompanyName(dispatch, storedCompanyName);
      }
    } else {
      fetchCompanyName();
    }

    if (roleName !== "System Super Admin" || company_id) {
      fetchUserProfile();
    }
  }, [roleName]);

  useEffect(() => {
    const storedCompanyName = sessionStorage.getItem("selectedCompanyName");

    if (!selectedCompanyName && storedCompanyName) {
      setCompanyName(storedCompanyName);
      setSelectedCompanyName(dispatch, storedCompanyName);
    }
  }, [selectedCompanyName, dispatch]);

  const fetchRoleName = async () => {
    try {
      const response = await axiosInstance.get(`/roles/${moduleId}/${roleId}`, {
        params: { company_id },
      });
      setRoleName(response.data.name || "Unknown Role");
    } catch (error) {
      console.error("Error fetching role name:", error);
    }
  };

  const fetchCompanyName = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const role = localStorage.getItem("userRole");
      const storedCompanyName = sessionStorage.getItem("selectedCompanyName");

      if (role === "System Super Admin") {
        // Get from sessionStorage
        if (storedCompanyName) {
          setCompanyName(storedCompanyName);
          setSelectedCompanyName(dispatch, storedCompanyName);
          return;
        }
      }

      // For all other roles: get from JWT token
      if (company_id && token) {
        const response = await axiosInstance.get(
          `/companies/${company_moduleId}/${company_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const name = response.data.name || "Unknown Company";
        setCompanyName(name);
        setSelectedCompanyName(dispatch, name);
      }
    } catch (error) {
      console.error("Error fetching company name:", error);

      if (error.response) {
        console.error("Backend error details:", error.response.data);
      } else if (error.request) {
        console.error("Request made but no response received:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
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

  /** Handler functions -  ends */

  // main renderer
  return (
    <AppBar
      position={"relative"}
      color="inherit"
      sx={(theme) =>
        navbar(theme, {
          transparentNavbar,
          absolute: false,
          light: !darkMode,
          darkMode,
        })
      }
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        {/* <Box color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini: false })}>
                    <Breadcrumbs icon="home" light={!darkMode} />
                </Box> */}

        <Box sx={{ color: "initial", display: "flex" }}>
          <NotificationMenu userId={userId} />

          {/* Profile Icon */}
          <>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <AccountCircle fontSize="large" />
            </IconButton>

            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                color: "#1976d2",
                alignSelf: "center",
                marginRight: 2,
              }}
            >
              {selectedCompanyName || "No Company Selected"}{" "}
            </Typography>

            {/* Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  Hi, {userName} ({roleName})
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => navigate("/changePassword")}>
                <ListItemIcon>
                  <LockIcon fontSize="medium" />
                </ListItemIcon>
                <Typography>Change Password</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="medium" />
                </ListItemIcon>
                <Typography>Logout</Typography>
              </MenuItem>
            </Menu>
          </>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
