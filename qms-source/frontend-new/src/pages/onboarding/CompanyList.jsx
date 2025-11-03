import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Box,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import { DataGrid } from "@mui/x-data-grid";
import axiosInstance from "../../services/axiosinstance";

const companyModuleId = "5d896834-fedd-4e0b-a882-8d05396fc346";

const OrganizationList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`/companies/${companyModuleId}`);
      setCompanies(response.data);
    } catch (error) {
      toast.error("Failed to fetch companies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (companyId, companyName) => {
    sessionStorage.setItem("companyId", companyId);
    sessionStorage.setItem("companyName", companyName);
    navigate("/company-details", {
      state: { companyId, from: "company-list" },
    });
  };

  const handleDelete = (companyId) => {
    const ConfirmToast = ({ closeToast }) => (
      <div>
        <p>Are you sure you want to delete this organization?</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            onClick={async () => {
              try {
                await axiosInstance.delete(
                  `/companies/${companyModuleId}/${companyId}`,
                  { data: { confirmed: true } }
                );
                setCompanies((prev) =>
                  prev.filter((company) => company.id !== companyId)
                );
                toast.success(
                  "organization and its users deactivated successfully."
                );
                closeToast();
              } catch (error) {
                toast.error("Unable to delete the organization.");
              }
            }}
            style={{
              background: "#d33",
              color: "#fff",
              padding: "5px 10px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.info("organization deletion cancelled.");
              closeToast();
            }}
            style={{
              background: "#aaa",
              color: "#fff",
              padding: "5px 10px",
              border: "none",
              borderRadius: "4px",
            }}
          >
            No
          </button>
        </div>
      </div>
    );

    toast(<ConfirmToast />, {
      closeOnClick: false,
      closeButton: false,
      autoClose: false,
      draggable: false,
    });
  };

  const columns = [
    { field: "name", headerName: "Name", flex: 1 ,width: 180,},
    { field: "domain", headerName: "Domain", flex: 1,width: 180, },
    { field: "industry", headerName: "Industry", flex: 1,width: 180, },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => handleEdit(params.row.id, params.row.name)}
          >
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 3, mx: { xs: 2, sm: 4 }, my: 4 }}>
      <ToastContainer />
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Organization List
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : companies.length > 0 ? (
        <DataGrid
          rows={companies}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          pagination
          pageSizeOptions={[5, 10, 25]}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          disableRowSelectionOnClick
          sx={{
            fontSize: "1rem",
            "& .MuiDataGrid-cell": {
              whiteSpace: "normal",
              wordWrap: "break-word",
              alignItems: "center",
              display: "flex",
            },
          }}
        />
      ) : (
        <Typography sx={{ textAlign: "center", mt: 3 }} color="text.secondary">
          No organizations found.
        </Typography>
      )}
    </Paper>
  );
};

export default OrganizationList;
