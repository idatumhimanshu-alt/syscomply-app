import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Paper, Typography, CircularProgress, Box } from "@mui/material";
import { toast } from "react-toastify";
import axiosInstance from "../services/axiosinstance";

const Analytics = () => {
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusSummary, setStatusSummary] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [iterationId, setIterationId] = useState("");
  const [iterationsData, setIterationsData] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [standard, setStandard] = useState("");
  const [typeOfFindingSummary, setTypeOfFindingSummary] = useState(null);

  const taskModuleId = "1f0f190d-3a83-421c-af98-5d081100230e";

  // Load iterations for dropdown
  useEffect(() => {
    const fetchIterations = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const company_id = sessionStorage.getItem("selectedCompany");

        const response = await axiosInstance.get(`/iteration/${taskModuleId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { company_id },
        });
        setIterations(response.data || []);
      } catch (err) {
        console.error("Failed to load iterations", err);
      }
    };

    fetchIterations();
  }, []);

  // Fetch task summary on iteration change
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const company_id = sessionStorage.getItem("selectedCompany");
        if (!company_id) {
          toast.error("Company ID is required.");
          return;
        }

        const payload = { company_id };
        if (iterationId) {
          payload.iteration_id = iterationId;
        }

        const response = await axiosInstance.post(
          `/tasks/task-summary/${taskModuleId}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            },
          }
        );

        if (iterationId && response.data.status_summary) {
          // Convert summary to array for chart
          const pieData = Object.entries(response.data.status_summary)
            // .filter(([_, count]) => count > 0)
            .map(([name, value]) => ({ name, value }));

          setStatusSummary(pieData);
          setCompletion(response.data.percentage_completed);
          setDepartmentSummary(response.data.department_summary || []);
          setStandard(response.data.standard || "");
          setTypeOfFindingSummary(
            response.data.Type_of_Finding_Summary || null
          );
        } else {
          // Show all iterations data
          setIterationsData(response.data.iterations || []);
          setStatusSummary([]);
          setCompletion(null);
          setDepartmentSummary(response.data.department_summary || []);
          setStandard("");
          setTypeOfFindingSummary(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading analytics:", error);
        toast.error("Failed to load analytics");
      }
    };

    fetchSummary();
  }, [iterationId]);

  // Loading spinner
  if (loading) {
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />;
  }

  const renderCustomizedLabel = ({ name, percent, x, y }) => {
    return percent > 0 ? (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  const COLORS = [
    "#e3f2fd",
    "#90caf9",
    "#42a5f5",
    "#1e88e5",
    "#1565c0",
    "#003c8f",
  ];

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: "0.5rem",
        m: { xs: 1, sm: 2, md: 4 },
        p: { xs: 2, sm: 3 },
      }}
    >
      <Typography variant="h5" gutterBottom>
        Task Analytics
      </Typography>

      {/* Show completion % if filtered */}
      {completion !== null && iterationId && (
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Overall Completion: {completion}%
        </Typography>
      )}

      {/* Iteration filter */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 300,
          mb: 3,
          ml: { xs: 0, md: "auto" },
        }}
      >
        <Typography
          id="iteration-filter-label"
          variant="subtitle2"
          sx={{ mb: 1, textAlign: "left" }}
        >
          Filter by Iteration
        </Typography>
        <select
          aria-labelledby="iteration-filter-label"
          value={iterationId}
          onChange={(e) => setIterationId(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            display: "block",
          }}
        >
          <option value="">All Iterations</option>
          {iterations.map((iter) => (
            <option key={iter.id} value={iter.id}>
              {iter.name}
            </option>
          ))}
        </select>
      </Box>

      {standard && (
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
          Standard: {standard}
        </Typography>
      )}

      {typeOfFindingSummary &&
        typeOfFindingSummary.total_with_type_of_finding > 0 && (
          <Paper
            elevation={2}
            sx={{
              mb: 4,
              p: 3,
              borderRadius: "0.5rem",
              backgroundColor: "#fafafa",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                mb: 2,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Type of Finding Summary
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(
                      typeOfFindingSummary.type_of_finding_summary
                    ).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="60%"
                    label={renderCustomizedLabel}
                    minAngle={4}
                  >
                    {Object.entries(
                      typeOfFindingSummary.type_of_finding_summary
                    ).map((_, index) => (
                      <Cell
                        key={`cell-type-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      paddingTop: 10,
                      fontSize: "0.85rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        )}

      {/* pie chart for selected iteration */}
      {iterationId ? (
        statusSummary.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No data available for selected iteration.
          </Typography>
        ) : (
          <>
            {/* Status Summary Pie Chart */}
            <Paper
              elevation={2}
              sx={{
                width: "100%",
                backgroundColor: "#fafafa",
                borderRadius: "0.5rem",
                p: 3,
                mb: 4,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}
              >
                Status Summary
              </Typography>
              <Box sx={{ height: { xs: 280, sm: 320, md: 360 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusSummary}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="60%"
                      label={renderCustomizedLabel}
                      minAngle={4}
                    >
                      {statusSummary.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        paddingTop: 10,
                        fontSize: "0.85rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* Department-wise Summary for Single Iteration */}

            {departmentSummary.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Department-wise Summary:
                </Typography>

                {/* WRAPPING CONTAINER FOR RESPONSIVE LAYOUT */}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  {departmentSummary.map((dept, i) => {
                    const deptData = Object.entries(dept.status_summary).map(
                      ([name, value]) => ({ name, value })
                    );
                    return (
                      <Paper
                        key={i}
                        sx={{
                          p: 2,
                          flex: "1 1 280px",
                          minWidth: "260px",
                          maxWidth: "100%",
                          borderRadius: "0.5rem",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: "bold",
                            mb: 1,
                            textAlign: "center",
                          }}
                        >
                          {dept.department.name}
                        </Typography>
                        <Box sx={{ height: 220, padding: 1 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={deptData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                paddingAngle={2}
                                label={renderCustomizedLabel}
                                minAngle={4}
                              >
                                {deptData.map((entry, index) => (
                                  <Cell
                                    key={`cell-dept-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                wrapperStyle={{
                                  paddingTop: 10,
                                  fontSize: "0.85rem",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        )
      ) : iterationsData.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No data available.
        </Typography>
      ) : (
        // pie charts for all iterations
        iterationsData.map((item, idx) => {
          const barData = Object.entries(item.status_summary).map(
            ([name, value]) => ({ name, value })
          );

          if (barData.length === 0) return null;

          return (
            <Paper
              key={idx}
              elevation={2}
              sx={{
                mb: 4,
                p: 3,
                borderRadius: "0.5rem",
                backgroundColor: "#fafafa",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ borderBottom: "2px solid #1976d2", pb: 1, mb: 3 }}
              >
                {item.iteration.name || "Unassigned"}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 3 }}>
                Completion: {item.percentage_completed}%
              </Typography>

              {item.standard && (
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Standard: {item.standard}
                </Typography>
              )}

              {item.Type_of_Finding_Summary &&
                item.Type_of_Finding_Summary.total_with_type_of_finding > 0 && (
                  <Paper
                    elevation={2}
                    sx={{
                      mb: 4,
                      p: 3,
                      borderRadius: "0.5rem",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 2,
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      Type of Finding Summary
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(
                              item.Type_of_Finding_Summary
                                .type_of_finding_summary
                            ).map(([name, value]) => ({ name, value }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="60%"
                            label={renderCustomizedLabel}
                            minAngle={4}
                          >
                            {Object.entries(
                              item.Type_of_Finding_Summary
                                .type_of_finding_summary
                            ).map((_, index) => (
                              <Cell
                                key={`cell-type-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{
                              paddingTop: 10,
                              fontSize: "0.85rem",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                )}

              {/*  Status Summary */}
              <Paper
                elevation={2}
                sx={{
                  width: "100%",
                  backgroundColor: "#fafafa",
                  borderRadius: "0.5rem",
                  p: 3,
                  mb: 4,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}
                >
                  Status Summary
                </Typography>
                <Box sx={{ height: { xs: 280, sm: 320, md: 360 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={barData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="60%"
                        label={renderCustomizedLabel}
                        minAngle={4}
                      >
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{
                          paddingTop: 10,
                          fontSize: "0.85rem",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Department-wise Summary */}
              {item.department_summary &&
                item.department_summary.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Department-wise Summary:
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        justifyContent: { xs: "center", md: "flex-start" },
                      }}
                    >
                      {item.department_summary.map((dept, i) => {
                        const deptData = Object.entries(
                          dept.status_summary
                        ).map(([name, value]) => ({ name, value }));

                        return (
                          <Paper
                            key={i}
                            sx={{
                              p: 2,
                              flex: "1 1 280px",
                              minWidth: "260px",
                              maxWidth: "100%",
                              borderRadius: "0.5rem",
                              backgroundColor: "#f9f9f9",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: "bold",
                                mb: 1,
                                textAlign: "center",
                              }}
                            >
                              {dept.department.name}
                            </Typography>
                            <Box sx={{ height: 220, padding: 1 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={deptData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60}
                                    paddingAngle={2}
                                    label={renderCustomizedLabel}
                                    minAngle={4}
                                  >
                                    {deptData.map((entry, index) => (
                                      <Cell
                                        key={`cell-dept-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    wrapperStyle={{
                                      paddingTop: 10,
                                      fontSize: "0.85rem",
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                )}
            </Paper>
          );
        })
      )}
    </Paper>
  );
};

export default Analytics;
