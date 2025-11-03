import React, { useState, useEffect } from "react";
import { Container, TextField, Button, Paper, Typography,Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosinstance";
const companyModuleId = "5d896834-fedd-4e0b-a882-8d05396fc346";

const CompanyDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Get companyId from location state OR sessionStorage
  const companyId = state?.companyId || sessionStorage.getItem("companyId");
  const storedCompanyName = sessionStorage.getItem("companyName");

  useEffect(() => {
    // Redirect if companyId is missing
    if (!companyId) {
      toast.warning("Organization not found. Redirecting...");
      setTimeout(() => navigate("/company-name"), 2000);
    } else {
      fetchCompanyDetails();
    }
  }, [companyId, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    companyName: storedCompanyName || "",
    industry: "",
    domain: "",
  });

  const [loading, setLoading] = useState(false);

  // Fetch existing company details
  const fetchCompanyDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `/companies/${companyModuleId}/${encodeURIComponent(companyId)}`
      );
      if (response.data) {
        setFormData((prev) => ({
          ...prev,
          industry: response.data.industry || "",
          domain: response.data.domain || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
      toast.error("Failed to fetch company details. Please try again.");
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyId) {
      toast.error("Invalid company ID.");
      return;
    }

    if (!formData.industry.trim() || !formData.domain.trim()) {
      toast.warning("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.put(
        `/companies/${companyModuleId}/${encodeURIComponent(companyId)}`,
        {
          companyName: formData.companyName, // Include all fields
          industry: formData.industry,
          domain: formData.domain,
        }
      );

      toast.success(
        response.data.message || "Organization details updated successfully!"
      );

      // Redirect based on where the user came from
      if (state?.from === "company-list") {
        navigate("/company-list"); // Redirect to Company List
      } else {
        navigate("/dashboard"); // Default redirect to Dashboard
      }
    } catch (error) {
      console.error("Error updating organization details:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to update organization details.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600} mb={3}>
          Update organization Details
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="organization Name"
            variant="outlined"
            fullWidth
            disabled
            value={formData.companyName}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Industry"
            name="industry"
            variant="outlined"
            fullWidth
            required
            value={formData.industry}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Domain"
            name="domain"
            variant="outlined"
            fullWidth
            required
            value={formData.domain}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{
                px: 3,
                py: 1.2,
                fontSize: "14px",
                borderRadius: 2,
                minWidth: "120px",
                boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
              }}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
              sx={{
                px: 3,
                py: 1.2,
                fontSize: "14px",
                borderRadius: 2,
                minWidth: "120px",
              }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CompanyDetails;
