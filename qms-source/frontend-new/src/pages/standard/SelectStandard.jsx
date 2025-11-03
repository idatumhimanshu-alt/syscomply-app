import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from "@mui/material";

const VALID_STANDARDS = ["ISO_9001", "ISO_27001"];
const query = new URLSearchParams(location.search);
const iterationId = query.get("iterationId");

const SelectStandard = () => {
  const [selectedStandard, setSelectedStandard] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const iterationId = query.get("iterationId");
  const moduleId = query.get("moduleId");

  const handleSelectChange = (e) => {
    setSelectedStandard(e.target.value);
  };

  const handleNext = () => {
    if (!selectedStandard) {
      toast.error("Please select a standard!");
      return;
    }

    toast.success(`Standard selected: ${selectedStandard}`);

    // Optional delay for toast visibility
    setTimeout(() => {
      navigate(
        `/upload-tasks/${moduleId}?iterationId=${iterationId}&standard=${selectedStandard}`
      );
    }, 800);
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
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, mb: 3, textAlign: "left" }}
      >
        Select a Standard
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select a Standard</InputLabel>
        <Select
          value={selectedStandard}
          onChange={handleSelectChange}
          label="Select a Standard"
        >
          {VALID_STANDARDS.map((standard) => (
            <MenuItem key={standard} value={standard}>
              {standard}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          onClick={handleBack}
          sx={{
            px: 3,
            py: 1.2,
            fontSize: "14px",
            borderRadius: 2,
            minWidth: "140px",
            boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.2)",
            fontWeight: "bold",
          }
        }
        >
          Back
        </Button>
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
    </Paper>
  );
};

export default SelectStandard;
