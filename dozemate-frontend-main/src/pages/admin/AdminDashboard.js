import React, { useEffect, useState, useRef } from "react";
import { apiUrl } from "../../config/api"
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Chip,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DevicesIcon from "@mui/icons-material/Devices";
import PeopleIcon from "@mui/icons-material/People";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./AdminDashboard.css";

Chart.register(...registerables, zoomPlugin, ChartDataLabels);

const UNIT_MAPPINGS = {
  temp: " °C",
  humidity: " %",
  iaq: "",
  eco2: " ppm",
  tvoc: " ppb",
  etoh: " ppb",
  hrv: " ms",
  stress: "",
  sdnn: " ms",
  rmssd: " ms",
  lf: "",
  hf: "",
  lfhf: "",
  motion: "",        // 👈 new
  presence: "",      // 👈 new
  activity: "",      // 👈 new
  battery: " %",     // 👈 new
  mic: ""            // 👈 new
};

const SENSOR_LABELS = {
  temp: "Temperature",
  humidity: "Humidity",
  iaq: "IAQ",
  eco2: "eCO₂",
  tvoc: "TVOC",
  etoh: "EtOH",
  hrv: "HRV",
  stress: "Stress",
  sdnn: "SDNN",
  rmssd: "RMSSD",
  lf: "LF",
  hf: "HF",
  lfhf: "LF/HF Ratio",
  motion: "",
  presence: "",
  battery: "%",
  activity: "",
  mic: "",
  motion: "Motion",
  presence: "Presence",
  battery: "Battery",
  activity: "Activity",
  mic: "Mic",
  motion: "Motion",       // 👈 new
  presence: "Presence",   // 👈 new
  activity: "Activity",   // 👈 new
  battery: "Battery",     // 👈 new
  mic: "Mic"              // 👈 new
};

const MAX_STORAGE_MINUTES = 1440;
const DISPLAY_WINDOW_MINUTES = 30;
const RIGHT_MARGIN_MINUTES = 2;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [userDevices, setUserDevices] = useState({});
  const [userLiveData, setUserLiveData] = useState({});
  const [userChartData, setUserChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [error, setError] = useState(null);

  const chartRefs = useRef({});

  // Fetch all users in the admin's organization
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");

        // ✅ Step 1: fetch admin profile once
        const profileRes = await fetch("https://admin.dozemate.com/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok) {
          setError("Failed to fetch profile.");
          setLoading(false);
          return;
        }

        let usersRes;
        // ✅ Case 1: SuperAdmin (no orgId) → fetch all users
        if (!profileData.data?.organizationId?._id) {
          usersRes = await fetch("https://admin.dozemate.com/api/manage/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          // ✅ Case 2: OrgAdmin → fetch users of this org
          const orgId = profileData.data.organizationId._id;
          usersRes = await fetch(
            `https://admin.dozemate.com/api/manage/users/organization/${orgId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        const usersData = await usersRes.json();
        if (usersRes.ok && Array.isArray(usersData.data)) {
          setUsers(usersData.data);
        } else {
          setUsers([]);
        }
        setLoading(false);

      } catch (err) {
        setError("Network error while fetching users.");
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch devices for all users
  useEffect(() => {
    if (!users.length) return;
    const fetchAllDevices = async () => {
      const token = localStorage.getItem("token");
      const devicesMap = {};
      for (const user of users) {
        try {
          const res = await fetch(
            `https://admin.dozemate.com/api/manage/users/${user._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          if (res.ok && Array.isArray(data.data?.devices)) {
            devicesMap[user._id] = data.data.devices;
          } else {
            devicesMap[user._id] = [];
          }
        } catch {
          devicesMap[user._id] = [];
        }
      }
      setUserDevices(devicesMap);
    };
    fetchAllDevices();
  }, [users]);

  // Fetch live data and chart data for all users' devices (polling)
  useEffect(() => {
    let intervalId;
    const fetchAllLiveData = async () => {
      const token = localStorage.getItem("token");
      const liveDataMap = {};
      const chartDataMap = {};
      for (const user of users) {
        const devices = userDevices[user._id] || [];
        if (!devices.length) continue;
        const device = devices[0];
        if (!device || !device.deviceId) continue;
        try {
          const endDate = new Date();
          const startDate = new Date(endDate - 5 * 60 * 1000);
          const healthRes = await fetch(
            `https://admin.dozemate.com/api/data/health/${device.deviceId}?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const healthData = await healthRes.json();
          if (Array.isArray(healthData) && healthData.length > 0) {
            const latest = healthData[0];
            liveDataMap[user._id] = {
              temp: latest.temperature ?? null,
              humidity: latest.humidity ?? null,
              iaq: latest.iaq ?? null,
              eco2: latest.eco2 ?? null,
              tvoc: latest.tvoc ?? null,
              etoh: latest.etoh ?? null,
              hrv: latest.hrv ?? null,
              stress: latest.stress ?? null,
              resp: latest.respiration ?? null,
              hr: latest.heartRate ?? null,

              // Metrics
              sdnn: latest.sdnn ?? null,
              rmssd: latest.rmssd ?? null,
              lf: latest.lf ?? null,
              hf: latest.hf ?? null,
              lfhf: latest.lfhf ?? null,

              // Signals
              motion: latest.signals?.motion ?? null,
              presence: latest.signals?.presence ?? null,
              battery: latest.signals?.battery ?? null,
              activity: latest.signals?.activity ?? null,
              mic: latest.signals?.mic ?? null,

              timestamp: latest.timestamp,
            };
            const chartLabels = [];
            const respData = [];
            const hrData = [];
            healthData
              .slice()
              .reverse()
              .forEach((point) => {
                chartLabels.push(new Date(point.timestamp));
                respData.push(point.respiration ?? null);
                hrData.push(point.heartRate ?? null);
              });
            chartDataMap[user._id] = {
              labels: chartLabels,
              datasets: [
                {
                  label: "Respiration",
                  data: respData,
                  borderColor: "rgba(54, 162, 235, 1)",
                  backgroundColor: "rgba(54, 162, 235, 0.1)",
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 0,
                  borderWidth: 2,
                },
                {
                  label: "Heart Rate",
                  data: hrData,
                  borderColor: "rgba(255, 99, 132, 1)",
                  backgroundColor: "rgba(255, 99, 132, 0.1)",
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 0,
                  borderWidth: 2,
                },
              ],
            };
          } else {
            liveDataMap[user._id] = null;
            chartDataMap[user._id] = {
              labels: [],
              datasets: [
                {
                  label: "Respiration",
                  data: [],
                  borderColor: "rgba(54, 162, 235, 1)",
                  backgroundColor: "rgba(54, 162, 235, 0.1)",
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 0,
                  borderWidth: 2,
                },
                {
                  label: "Heart Rate",
                  data: [],
                  borderColor: "rgba(255, 99, 132, 1)",
                  backgroundColor: "rgba(255, 99, 132, 0.1)",
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 0,
                  borderWidth: 2,
                },
              ],
            };
          }
        } catch {
          liveDataMap[user._id] = null;
          chartDataMap[user._id] = {
            labels: [],
            datasets: [
              {
                label: "Respiration",
                data: [],
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.1)",
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 2,
              },
              {
                label: "Heart Rate",
                data: [],
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.1)",
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 2,
              },
            ],
          };
        }
      }
      setUserLiveData(liveDataMap);
      setUserChartData(chartDataMap);
    };

    fetchAllLiveData();
    intervalId = setInterval(fetchAllLiveData, 6000);
    return () => clearInterval(intervalId);
  }, [users, userDevices]);

  const getDeviceName = (userId) => {
    const devices = userDevices[userId] || [];
    if (!devices.length) return "No Device";
    return devices[0].name || devices[0].deviceType || devices[0].deviceId;
  };

  // Mini chart: only show lines, very small legend, no axes
  const getChartOptionsMini = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { size: 8, weight: "bold" },
          color: "#666",
          usePointStyle: true,
          pointStyle: "line",
          boxWidth: 6,
          boxHeight: 2,
          padding: 4,
        },
      },
      tooltip: { enabled: false },
      datalabels: { display: false },
      zoom: { pan: { enabled: false }, zoom: { enabled: false } },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 0, hoverRadius: 0 },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    layout: { padding: { left: 4, right: 4, top: 4, bottom: 4 } },
    interaction: { intersect: false, mode: 'index' },
  });

  const getChartOptions = (userId, isExpanded = false) => ({
    responsive: true,
    maintainAspectRatio: !isExpanded,
    animation: {
      duration: 1200,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        align: "center",
        labels: {
          font: { size: isExpanded ? 16 : 12, weight: "bold" },
          color: "#333",
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.7)",
        titleColor: "#fff",
        bodyColor: "#ddd",
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14 },
        padding: 12,
      },
      datalabels: {
        display: (context) =>
          context.dataIndex === context.dataset.data.length - 1,
        align: "top",
        offset: 15,
        color: (context) => context.dataset.borderColor,
        font: { weight: "bold", size: isExpanded ? 28 : 18 },
        formatter: (value) => (value !== null ? value : ""),
        backgroundColor: "rgba(255,255,255,0.9)",
        borderWidth: 2,
        borderColor: (context) => context.dataset.borderColor,
        borderRadius: 6,
        padding: 8,
      },
      zoom: {
        pan: {
          enabled: isExpanded,
          mode: "x",
          speed: 10,
          threshold: 10,
        },
        zoom: {
          enabled: isExpanded,
          mode: "x",
          sensitivity: 0.1,
        },
      },
    },
    elements: {
      line: { tension: 0.4 },
      point: {
        radius: (context) => {
          const datasetIndex = context.datasetIndex;
          const dataIndex = context.dataIndex;
          const dataset = context.chart.data.datasets[datasetIndex];
          return dataIndex === dataset.data.length - 1 ? (isExpanded ? 8 : 5) : 2;
        },
        hoverRadius: isExpanded ? 8 : 5,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 160,
        ticks: {
          stepSize: 20,
          color: "#333",
          font: { size: isExpanded ? 14 : 12, weight: "bold" },
        },
        grid: { display: false },
      },
      x: {
        type: "time",
        time: {
          unit: "minute",
          displayFormats: { minute: "HH:mm", hour: "HH:mm" },
          tooltipFormat: "HH:mm:ss",
        },
        min: new Date(new Date().getTime() - DISPLAY_WINDOW_MINUTES * 60000),
        max: new Date(new Date().getTime() + RIGHT_MARGIN_MINUTES * 60000),
        ticks: {
          autoSkip: true,
          maxRotation: 90,
          minRotation: 30,
          color: "#333",
          font: { size: isExpanded ? 14 : 12, weight: "bold" },
        },
        grid: { display: false },
      },
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <Box className="admin-dashboard-loading">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" className="admin-dashboard-error">
          {error}
        </Alert>
      );
    }

    if (!users.length) {
      return (
        <Box className="admin-dashboard-empty-state">
          <PeopleIcon className="admin-dashboard-empty-icon" />
          <Typography variant="h6" color="textSecondary">
            No users found in your organization
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Users will appear here once they join your organization
          </Typography>
        </Box>
      );
    }

    return (
      <div
        className="admin-dashboard-cards-container"
        data-count={users.length}
      >
        {users.map((user, idx) => (
          <Card
            key={user._id}
            className={`dashboard-card card-${idx % 4} admin-dashboard-user-card`}
            onClick={() => setExpandedUserId(user._id)}
            elevation={3}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.15)"
              }
            }}
          >
            <CardContent>
              <Box className="admin-dashboard-user-header">
                <Typography variant="subtitle1" className="admin-dashboard-user-name">
                  {user.name}
                </Typography>
                <Chip
                  label={user.role}
                  color={user.role === "admin" ? "primary" : "default"}
                  size="small"
                  sx={{ ml: 1, textTransform: "capitalize", fontSize: "0.7rem" }}
                />
              </Box>
              <Typography
                variant="body2"
                className="admin-dashboard-user-email"
                title={user.email}
              >
                {user.email}
              </Typography>
              <Typography
                variant="body2"
                className="admin-dashboard-user-device"
                title={`Device: ${getDeviceName(user._id)}`}
              >
                Device: {getDeviceName(user._id)}
              </Typography>

              <Box className="admin-dashboard-mini-chart">
                <Line
                  ref={(el) => (chartRefs.current[user._id] = el)}
                  data={userChartData[user._id] || {
                    labels: [],
                    datasets: [
                      {
                        label: "Respiration",
                        data: [],
                        borderColor: "rgba(54, 162, 235, 1)",
                        backgroundColor: "rgba(54, 162, 235, 0.1)",
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderWidth: 2,
                      },
                      {
                        label: "Heart Rate",
                        data: [],
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.1)",
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={getChartOptionsMini()}
                />
              </Box>

              <Box className="admin-dashboard-user-live">
                <Typography variant="body2" color="textSecondary">
                  HR:{" "}
                  <span className="admin-dashboard-live-value">
                    {userLiveData[user._id]?.hr ?? "-"}
                  </span>
                  <span className="card-unit">bpm</span>
                  {" | "}
                  Resp:{" "}
                  <span className="admin-dashboard-live-value">
                    {userLiveData[user._id]?.resp ?? "-"}
                  </span>
                  <span className="card-unit">rpm</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Expanded Dialog */}
        {users.map((user) => (
          <Dialog
            key={`dialog-${user._id}`}
            open={expandedUserId === user._id}
            onClose={() => setExpandedUserId(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: { borderRadius: "16px", boxShadow: 8 },
            }}
          >
            <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
              <DevicesIcon sx={{ mr: 1, color: "#2563eb" }} />
              {user.name} - {getDeviceName(user._id)}
              <Box flex={1} />
              <Tooltip title="Close">
                <IconButton onClick={() => setExpandedUserId(null)}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </DialogTitle>
            <DialogContent>
              <Box className="admin-dashboard-expanded-content">
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                  Email: {user.email}
                </Typography>
                <Box className="admin-dashboard-expanded-chart">
                  <Line
                    data={userChartData[user._id] || {
                      labels: [],
                      datasets: [
                        {
                          label: "Respiration",
                          data: [],
                          borderColor: "rgba(54, 162, 235, 1)",
                          backgroundColor: "rgba(54, 162, 235, 0.2)",
                          fill: true,
                          tension: 0.4,
                          pointRadius: 0,
                          pointHoverRadius: 6,
                          borderWidth: 3,
                        },
                        {
                          label: "Heart Rate",
                          data: [],
                          borderColor: "rgba(255, 99, 132, 1)",
                          backgroundColor: "rgba(255, 99, 132, 0.2)",
                          fill: true,
                          tension: 0.4,
                          pointRadius: 0,
                          pointHoverRadius: 6,
                          borderWidth: 3,
                        },
                      ],
                    }}
                    options={getChartOptions(user._id, true)}
                    height={350}
                  />
                </Box>
                <Divider sx={{ my: 3 }} />
                <Grid container spacing={2}>
                  {Object.keys(SENSOR_LABELS).map((key, i) => (
                    <Grid item xs={6} sm={4} md={3} key={key}>
                      <Card className={`dashboard-card card-${i % 4} admin-dashboard-live-card`}>
                        <CardContent>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            className="card-title admin-dashboard-live-label"
                          >
                            {SENSOR_LABELS[key]}
                          </Typography>
                          <Typography
                            variant="h6"
                            className="card-value admin-dashboard-live-value"
                          >
                            {userLiveData[user._id]?.[key] ?? "-"}
                            <span className="card-unit">
                              {UNIT_MAPPINGS[key]}
                            </span>
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  <Grid item xs={6} sm={4} md={3}>
                    <Card className="dashboard-card card-0 admin-dashboard-live-card">
                      <CardContent>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          className="card-title admin-dashboard-live-label"
                        >
                          Heart Rate
                        </Typography>
                        <Typography
                          variant="h6"
                          className="card-value admin-dashboard-live-value"
                        >
                          {userLiveData[user._id]?.hr ?? "-"}
                          <span className="card-unit">bpm</span>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Card className="dashboard-card card-1 admin-dashboard-live-card">
                      <CardContent>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          className="card-title admin-dashboard-live-label"
                        >
                          Respiration
                        </Typography>
                        <Typography
                          variant="h6"
                          className="card-value admin-dashboard-live-value"
                        >
                          {userLiveData[user._id]?.resp ?? "-"}
                          <span className="card-unit">rpm</span>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Box className="admin-dashboard-header">
        <DevicesIcon className="admin-dashboard-icon" />
        <Typography variant="h4" className="admin-dashboard-title">
          Live Dashboard
        </Typography>
      </Box>
      <Divider className="admin-dashboard-divider" />
      <div className="admin-dashboard-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;