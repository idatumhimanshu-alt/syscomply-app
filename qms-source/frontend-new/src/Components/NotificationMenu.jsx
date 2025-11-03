import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosinstance.js";
import {
  Menu,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Typography,
  Box,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { socket, connectSocket, disconnectSocket } from "../utils/socket.js"; // WebSocket functions

const API_URL = "/notifications";

const NotificationMenu = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("jwtToken"));
  const navigate = useNavigate();

  //  Fetch unseen notifications on mount
  useEffect(() => {
    loadUnseenNotifications();
  }, []);

  const handleNewNotification = (data) => {
    console.log("New Notification Received:", data);

    const formatted = {
      ...data,
      _id: data._id || data.id,
      seen: false,
      created_at: data.created_at || new Date().toISOString(),
    };

    setNotifications((prev) => {
      const exists = prev.some((n) => n._id === formatted._id);
      if (exists) return [...prev];
      return [formatted, ...prev];
    });
  };

  //  WebSocket Connection & Cleanup
  useEffect(() => {
    if (!userId) return;

    connectSocket(userId);

    socket
      .off("new_notification")
      .on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
      disconnectSocket();
    };
  }, [userId]); // include in deps

  //  Fetch Unseen Notifications
  const loadUnseenNotifications = async () => {
    if (!token) {
      console.error(" No token found. Cannot fetch notifications.");
      return;
    }
    try {
      const response = await axiosInstance.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setShowAll(false);
    } catch (error) {
      console.error(
        " Error fetching unseen notifications:",
        error.response?.data || error.message
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    }
  };

  //  Mark Notifications as Seen
  const markNotificationsAsSeen = async () => {
    if (!token) {
      console.error(" No token found. Cannot mark notifications.");
      return;
    }
    try {
      await axiosInstance.post(
        `${API_URL}/mark-seen`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local UI state to reflect seen status without clearing
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
    } catch (error) {
      console.error(
        " Error marking notifications as seen:",
        error.response?.data || error.message
      );
    }
  };

  //  Load All Notifications (Toggle Feature)
  const toggleNotifications = async () => {
    if (!token) {
      console.error("No token found. Cannot fetch notifications.");
      return;
    }

    if (showAll) {
      loadUnseenNotifications();
    } else {
      try {
        const response = await axiosInstance.get(`${API_URL}/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(Array.isArray(response.data) ? response.data : []);
        setShowAll(true);
      } catch (error) {
        console.error(
          " Error fetching all notifications:",
          error.response?.data || error.message
        );
        setNotifications([]);
      }
    }
  };

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = async () => {
    setAnchorEl(null);
    await markNotificationsAsSeen();
  };

  //  Handle Notification Click
  const handleNotificationClick = (notif) => {
    handleClose();
    navigate(notif.link || "/tasks");
  };

  console.log(" Notifications state:", notifications);
  console.log(" Unseen count:", notifications.filter((n) => !n.seen).length);

  return (
    <div>
      <IconButton onClick={handleOpen}>
        <Badge
          badgeContent={notifications.filter((n) => !n.seen).length}
          color="error"
        >
          <NotificationsIcon fontSize="large" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          "& .MuiPaper-root": {
            width: 300,
            borderRadius: 2,
            boxShadow: 3,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #ddd", textAlign: "center" }}>
          <Typography variant="h6" fontWeight="bold">
            Notifications
          </Typography>
        </Box>

        <List
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "5px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "5px",
            },
          }}
        >
          {notifications.length === 0 ? (
            <ListItem sx={{ justifyContent: "center", py: 2 }}>
              <Typography variant="body2" color="textSecondary">
                No new notifications
              </Typography>
            </ListItem>
          ) : (
            notifications.map((notif, index) => (
              <div key={notif._id}>
                <ListItem
                  sx={{
                    px: 2,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body1">{notif.message}</Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: "bold", 
                          fontSize: "0.875rem", 
                          color: "#007BFF", 
                          display: "block",
                          marginTop: "4px", 
                          textTransform: "uppercase", 
                        }}
                      >
                        {new Date(notif.created_at).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
                {index !== notifications.length - 1 && <Divider />}
              </div>
            ))
          )}
        </List>

        <Button
          fullWidth
          variant="contained"
          onClick={toggleNotifications}
          sx={{
            mt: 1,
            backgroundColor: showAll ? "#DC3545" : "#007BFF",
            color: "white",
            "&:hover": { backgroundColor: showAll ? "#B22222" : "#0056b3" },
          }}
        >
          {showAll ? "Show Unseen Only" : "View All Notifications"}
        </Button>
      </Menu>
    </div>
  );
};

export default NotificationMenu;
