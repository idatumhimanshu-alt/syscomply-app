import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosinstance";
const companyModuleId = "5d896834-fedd-4e0b-a882-8d05396fc346";

const CompanyName = () => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [superAdminName, setSuperAdminName] = useState("");
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate input fields
    if (!companyName.trim()) return toast.warning("organization Name is required.");
    if (!superAdminName.trim())
      return toast.warning("Super Admin Name is required.");
    if (!superAdminEmail.trim())
      return toast.warning("Super Admin Email is required.");
  
    setLoading(true);
  
    const requestData = {
      name: companyName,
      email: superAdminEmail,
      adminName: superAdminName,
    };
  
    console.log("Sending Data:", requestData);
  
    try {
      const response = await axiosInstance.post(
        `/companies/${companyModuleId}`,
        requestData
      );
      console.log("Response:", response.data);
  
      const { companyId } = response.data;
      toast.success(`Organization "${companyName}" created successfully!`);
  
      sessionStorage.setItem("companyId", companyId); // Store company details in sessionStorage
      sessionStorage.setItem("companyName", companyName);
  
      navigate("/company-details", { state: { companyId } });
    } catch (error) {
      console.log("❌ Entered catch block");
      console.error("Error:", error.response?.data || error);
  
      if (!error.response) {
        toast.error("Network issue detected. Please check your internet connection.");
        return;
      }
  
      const errorData = error.response.data;
  
      // Handle multiple validation errors from backend
      if (typeof errorData === "object" && errorData.errors) {
        const errorMessages = Object.values(errorData.errors).flat();
        // Use a Set to avoid duplicate error messages
        const uniqueErrorMessages = new Set(errorMessages);
        uniqueErrorMessages.forEach((msg) => toast.error(msg));
        return;
      }
  
      const backendMessage =
        errorData?.error || errorData?.message || "An unexpected error occurred. Please try again.";
      
      // Show the error message only once
      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };
  

  // Handle navigation to company details page
  const handleNext = (companyId, companyName) => {
    sessionStorage.setItem("companyId", companyId); // Store company details
    sessionStorage.setItem("companyName", companyName);
    navigate("/company-details", { state: { companyId } });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          mx: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, mb: 3, textAlign: "left" }}
        >
          Organization Onboarding
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="organization Name"
            variant="outlined"
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="System Admin Name"
            variant="outlined"
            fullWidth
            value={superAdminName}
            onChange={(e) => setSuperAdminName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            label="System Admin Email"
            variant="outlined"
            fullWidth
            type="email"
            value={superAdminEmail}
            onChange={(e) => setSuperAdminEmail(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                px: 3,
                py: 1.2,
                fontSize: "14px",
                borderRadius: 2,
                minWidth: "140px",
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
              }}
            >
              {loading ? "Processing..." : "Create organization"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CompanyName;
