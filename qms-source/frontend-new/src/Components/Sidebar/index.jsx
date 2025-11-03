import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  useMediaQuery,
  IconButton,
  CircularProgress,
  Box,
} from "@mui/material";
import SidebarRoot from "./SidebarRoot";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LockIcon from "@mui/icons-material/Lock";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import MenuIcon from "@mui/icons-material/Menu";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DescriptionIcon from "@mui/icons-material/Description";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser"; // for Roles
import ApartmentIcon from "@mui/icons-material/Apartment"; // for Departments
import axiosInstance from "../../services/axiosinstance";

import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
  setSidebarOpen,
} from "../../context";

// Component definition
const Sidebar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleName, setRoleName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  // Extract role ID from token
  const token = localStorage.getItem("jwtToken");
  const decodedToken = token ? jwtDecode(token) : null;
  const roleId = decodedToken?.role || "";
  const company_id = decodedToken?.company || "";
  const roleModuleId = "971a88b8-461e-4cd2-9a06-fce42ad6b806";

  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    transparentSidenav,
    whiteSidenav,
    darkMode,
    sidenavColor,
    brandDark,
    brandWhite,
    sidebarOpen,
  } = controller;

  const location = useLocation();
  const collapseName = location.pathname.replace("/", "");

  let textColor = "white";

  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setSidebarOpen(dispatch, false);

  useEffect(() => {
    // A function that sets the mini state of the sidenav.
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
      setTransparentSidenav(
        dispatch,
        window.innerWidth < 1200 ? false : transparentSidenav
      );
      setWhiteSidenav(
        dispatch,
        window.innerWidth < 1200 ? false : whiteSidenav
      );
    }

    /** 
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
    window.addEventListener("resize", handleMiniSidenav);

    // Call the handleMiniSidenav function to set the state with the initial value.
    handleMiniSidenav();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, location]);

  useEffect(() => {
    const fetchRoleName = async () => {
      try {
        console.log(
          "response of roleModuleId  " + roleModuleId + " roleId  " + roleId
        );
        const response = await axiosInstance.get(
          `/roles/${roleModuleId}/${roleId}`,
          {
            params: { company_id: company_id }, // Pass company_id as a query parameter
          }
        );
        console.log("response of role from sidebar is " + response.data.name);
        setRoleName(response.data.name); // Assuming API returns { roleName: "Super Admin" }
      } catch (error) {
        console.error("Error fetching role name:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchRoleName();
    } else {
      setLoading(false);
    }
  }, [roleId, roleModuleId]);

  useEffect(() => {
    if (isMobile) {
      closeSidenav();
    }
  }, [isMobile]);

  if (loading) {
    return (
      <CircularProgress
        sx={{ color: "white", position: "absolute", top: "50%", left: "50%" }}
      />
    );
  }

  const toggleSidebar = () => setSidebarOpen(dispatch, !sidebarOpen);

  // Main menu items
  const menuItems = [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { name: "Analytics", icon: <BarChartIcon />, path: "/analytics" },
  ];

  // Task Management items
  const taskItems = [
    // Conditionally include Iteration only for Super Admin or System Super Admin
    ...(roleName === "Super Admin" || roleName === "System Super Admin"
      ? [
          {
            name: "Iteration ",
            icon: <AccessTimeIcon />,
            path: "/iteration/1f0f190d-3a83-421c-af98-5d081100230e",
          },
        ]
      : []),
    { name: "Task List", icon: <ListAltIcon />, path: "/tasks" },
    {
      name: "Bulk Task Assignment",
      icon: <AssignmentTurnedInIcon />,
      path: "/BulkTaskAssignment",
    },
    {
      name: "User Task Assignment",
      icon: <AssignmentTurnedInIcon />,
      path: "/UserTaskAssignment",
    },
  ];

  // Settings items (only for Super Admin)
  const settingsItems = [
    { name: "Modules", icon: <ListAltIcon />, path: "/modules" },
    { name: "Roles", icon: <VerifiedUserIcon />, path: "/roles" },
    {
      name: "Assign Permissions",
      icon: <AdminPanelSettingsIcon />,
      path: "/assign-permissions",
    },
  ];

  // User Management items (only for Super Admin)
  const userItems = [
    { name: "User List", icon: <ListAltIcon />, path: "/users" }, // Added User List item
    { name: "Create User", icon: <PersonAddIcon />, path: "/users/create" },
    { name: "Departments", icon: <ApartmentIcon />, path: "/departments" },
  ];

  //Document Management items
  const documentItems = [
    {
      name: "Document Management",
      icon: <DescriptionIcon />,
      path: "/document-management",
    },
  ];

  return (
    <>
      <IconButton
        onClick={toggleSidebar}
        sx={{
          position: "fixed",
          top: 15,
          left: sidebarOpen ? 270 : 15,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          },
          zIndex: 1500,
        }}
      >
        {sidebarOpen ? <MenuIcon /> : <MenuIcon />}
      </IconButton>

      {/* Sidebar Drawer */}
      <SidebarRoot
        variant={isMobile ? "temporary" : "persistent"}
        open={sidebarOpen}
        onClose={toggleSidebar}
        color={sidenavColor}
        brand={
          (transparentSidenav && !darkMode) || whiteSidenav
            ? brandDark
            : brandWhite
        }
        sx={{
          width: sidebarOpen ? 250 : 0,
          flexShrink: 0,
          transition: "width 0.3s ease",
        }}
        ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
      >
        <Box
          pt={3}
          pb={1}
          sx={{
            color: `${textColor} !important`,
            "& .MuiListItemIcon-root": {
              color: `${textColor} !important`,
            },
            "& .MuiTypography-root": {
              fontSize: "1.2rem",
              paddingY: 0.8,
              paddingX: 0.5,
            },
          }}
        >
          <List>
            {/* Main menu items */}
            {menuItems.map((item) => (
              <ListItem disablePadding key={item.name}>
                <Tooltip title={item.name} placement="right">
                  <ListItemButton component={Link} to={item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      slotProps={{
                        primary: {
                          style: {
                            wordWrap: "break-word", // Forces wrapping of long words
                            whiteSpace: "normal", // Ensures text can wrap to multiple lines
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}

            {/* Organization Management System - Only for System Super Admin */}
            {roleName === "System Super Admin" && (
              <>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setCompanyOpen(!companyOpen)}>
                    <ListItemIcon sx={{ color: "white" }}>
                      <BusinessIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Organization Management System"
                      slotProps={{
                        primary: {
                          style: {
                            wordWrap: "break-word", // Forces wrapping of long words
                            whiteSpace: "normal", // Ensures text can wrap to multiple lines
                          },
                        },
                      }}
                    />
                    {companyOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>

                <Collapse in={companyOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItem disablePadding>
                      <Tooltip title="Organization List" placement="right">
                        <ListItemButton
                          component={Link}
                          to="/company-list"
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon sx={{ color: "white" }}>
                            <BusinessIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Organization List"
                            slotProps={{
                              primary: {
                                style: {
                                  wordWrap: "break-word", // Forces wrapping of long words
                                  whiteSpace: "normal", // Ensures text can wrap to multiple lines
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>

                    <ListItem disablePadding>
                      <Tooltip
                        title="Organization Onboarding"
                        placement="right"
                      >
                        <ListItemButton
                          component={Link}
                          to="/company-name"
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon sx={{ color: "white" }}>
                            <BusinessIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Organization Onboarding"
                            slotProps={{
                              primary: {
                                style: {
                                  wordWrap: "break-word", // Forces wrapping of long words
                                  whiteSpace: "normal", // Ensures text can wrap to multiple lines
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  </List>
                </Collapse>
              </>
            )}

            {/* Compliance Management Section */}
            <ListItem disablePadding>
              <ListItemButton onClick={() => setTaskOpen(!taskOpen)}>
                <ListItemIcon sx={{ color: "white" }}>
                  <ListAltIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Compliance Management"
                  slotProps={{
                    primary: {
                      style: {
                        wordWrap: "break-word", // Forces wrapping of long words
                        whiteSpace: "normal", // Ensures text can wrap to multiple lines
                      },
                    },
                  }}
                />
                {taskOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>

            <Collapse in={taskOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {taskItems.map((item) => (
                  <ListItem disablePadding key={item.name}>
                    <Tooltip title={item.name} placement="right">
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon sx={{ color: "white" }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          slotProps={{
                            primary: {
                              style: {
                                wordWrap: "break-word", // Forces wrapping of long words
                                whiteSpace: "normal", // Ensures text can wrap to multiple lines
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* User Management Section  Super Admin and System Super Admin */}
            {(roleName === "Super Admin" ||
              roleName === "System Super Admin") && (
              <>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setUsersOpen(!usersOpen)}>
                    <ListItemIcon sx={{ color: "white" }}>
                      <PersonAddIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="User Management"
                      slotProps={{
                        primary: {
                          style: {
                            wordWrap: "break-word", // Forces wrapping of long words
                            whiteSpace: "normal", // Ensures text can wrap to multiple lines
                          },
                        },
                      }}
                    />
                    {usersOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>

                <Collapse in={usersOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {userItems.map((item) => (
                      <ListItem disablePadding key={item.name}>
                        <Tooltip title={item.name} placement="right">
                          <ListItemButton
                            component={Link}
                            to={item.path}
                            sx={{ pl: 4 }}
                          >
                            <ListItemIcon sx={{ color: "white" }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              slotProps={{
                                primary: {
                                  style: {
                                    wordWrap: "break-word", // Forces wrapping of long words
                                    whiteSpace: "normal", // Ensures text can wrap to multiple lines
                                  },
                                },
                              }}
                            />
                          </ListItemButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}

            {/* Document Management Section */}
            {documentItems.map((item) => (
              <ListItem disablePadding key={item.name}>
                <Tooltip title={item.name} placement="right">
                  <ListItemButton component={Link} to={item.path}>
                    <ListItemIcon sx={{ color: "white" }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      slotProps={{
                        primary: {
                          style: {
                            wordWrap: "break-word",
                            whiteSpace: "normal",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}

            {/* Settings Section - For Super Admin & System Super Admin */}
            {(roleName === "Super Admin" ||
              roleName === "System Super Admin") && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    <ListItemIcon sx={{ color: "white" }}>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Settings"
                      slotProps={{
                        primary: {
                          style: {
                            wordWrap: "break-word", // Forces wrapping of long words
                            whiteSpace: "normal", // Ensures text can wrap to multiple lines
                          },
                        },
                      }}
                    />
                    {settingsOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>

                <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {settingsItems.map((item) => (
                      <ListItem disablePadding key={item.name}>
                        <Tooltip title={item.name} placement="right">
                          <ListItemButton
                            component={Link}
                            to={item.path}
                            sx={{ pl: 4 }}
                          >
                            <ListItemIcon sx={{ color: "white" }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              slotProps={{
                                primary: {
                                  style: {
                                    wordWrap: "break-word", // Forces wrapping of long words
                                    whiteSpace: "normal", // Ensures text can wrap to multiple lines
                                  },
                                },
                              }}
                            />
                          </ListItemButton>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
          </List>
        </Box>
      </SidebarRoot>
    </>
  );
};

export default Sidebar;
