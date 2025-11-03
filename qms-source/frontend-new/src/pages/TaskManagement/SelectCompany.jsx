import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Container,
  Paper,
} from "@mui/material";
import {
  useMaterialUIController,
  setSelectedCompanyName,
} from "../../context/index"; 
import axiosInstance from "../../services/axiosinstance";

const SelectCompany = ({ setSelectedCompany }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompanyState] = useState("");
  const [controller, dispatch] = useMaterialUIController();
  const navigate = useNavigate();
  const Module_id = "5d896834-fedd-4e0b-a882-8d05396fc346";

  useEffect(() => {
    console.log("Fetching companies...");

    const fetchCompanies = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("No token found! Please login.");
        return;
      }

      try {
        console.log("Making API request to fetch companies...");
        const response = await axiosInstance.get(
          `/companies/${Module_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = response.data;
        console.log("Fetched companies from backend:", data);

        if (Array.isArray(data) && data.length > 0) {
          setCompanies(data);

          // Retrieve stored company ID if available
          let storedCompanyId = sessionStorage.getItem("selectedCompany");

          // Only set if it's valid
          if (storedCompanyId && data.some((c) => c.id === storedCompanyId)) {
            setSelectedCompanyState(storedCompanyId);
            setSelectedCompany && setSelectedCompany(storedCompanyId);
            console.log(
              "Using stored company ID from sessionStorage:",
              storedCompanyId
            );
          } else {
            console.log("No stored company found. Keeping selection empty.");
          }
        } else {
          console.warn("No companies received from API.");
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelectChange = (e) => {
    const company_id = e.target.value;
    const selectedCompanyObj = companies.find((c) => c.id === company_id);

    if (!company_id) {
      console.error("Invalid company selection!");
      return;
    }
    const company_name = selectedCompanyObj.name; // Extract name

    sessionStorage.setItem("selectedCompany", company_id);
    sessionStorage.setItem("selectedCompanyName", company_name); // Store company name
    setSelectedCompanyName(dispatch, company_name);
    setSelectedCompanyState(company_id);
    setSelectedCompany && setSelectedCompany(company_id);

    console.log("Dropdown Selected Company ID:", company_id);
    console.log("Dropdown Selected Company Name:", company_name);
    console.log(
      "Stored Company ID:",
      sessionStorage.getItem("selectedCompany")
    );
    console.log(
      "Stored Company Name:",
      sessionStorage.getItem("selectedCompanyName")
    );
  };

  const handleNext = () => {
    const company_id = sessionStorage.getItem("selectedCompany");
    const company_name = sessionStorage.getItem("selectedCompanyName");

    if (!company_id || !company_name) {
      // Ensure both are set
      alert("Please select a company!");
      console.error("No company selected. Navigation aborted.");
      return;
    }

    console.log("Navigating with Company ID:", company_id);
    console.log("Navigating with Company Name:", company_name);

    sessionStorage.setItem("companyname", company_name);
    setSelectedCompanyName(dispatch, company_name); 

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 50);
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
          Select a Company
        </Typography>

        {companies.length > 0 ? (
          <>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select a Company</InputLabel>
              <Select
                value={selectedCompany}
                onChange={handleSelectChange}
                label="Select a Company"
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                sx={{
                  px: 3,
                  py: 1.2,
                  fontSize: "14px",
                  borderRadius: 2,
                  minWidth: "140px",
                  boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
                  fontWeight: "bold",
                }}
              >
                Next
              </Button>
            </Box>
          </>
        ) : (
          <Typography color="text.secondary" align="center">
            No companies available at the moment.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default SelectCompany;
