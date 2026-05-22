import React, { useEffect, useState, useRef } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DevicesIcon from "@mui/icons-material/Devices";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./SuperAdminDashboard.css";

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
  mic: "",          // 👈 new
  mean_rr: "Mean RR",
  pnn50: "PNN50",
  hr_median: "HR Median",
  rr_tri_index: "RR Tri Index",
  tin_rmssd: "TIN-RMSSD",
  sd1: "SD1",
  sd2: "SD2",
  sample_entropy: "Sample Entropy",
  sd1sd2: "SD1/SD2",
  sns_index: "SNS Index",
  pns_index: "PNS Index",
  rrIntervals: "RR Intervals",
  rawWaveform: "Raw Waveform",

};

const SENSOR_LABELS = {
  temp: "Temperature1",
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

const SuperAdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("all");
  const [usersByOrg, setUsersByOrg] = useState({});
  const [userDevices, setUserDevices] = useState({});
  const [userLiveData, setUserLiveData] = useState({});
  const [userChartData, setUserChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [expandedOrgs, setExpandedOrgs] = useState({});

  const [visibleMetrics, setVisibleMetrics] = useState({
    respiration: true,
    heartRate: true,
    sdnn: false,
    rmssd: false,
    lfhf: false,
    lf: false,  // 👈 add LF
    hf: false   // 👈 add HF
  });

  const chartRefs = useRef({});

  // Fetch all organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");

        // Fetch all organizations
        const orgRes = await fetch("https://admin.dozemate.com/api/organizations?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orgData = await orgRes.json();

        if (!orgRes.ok) {
          setError("Failed to fetch organizations.");
          setLoading(false);
          return;
        }

        const orgs = orgData.data?.organizations || orgData.organizations || orgData.data || [];
        setOrganizations(orgs);

        // Set all organizations as expanded by default
        const expandedState = {};
        orgs.forEach(org => {
          expandedState[org._id] = true;
        });
        setExpandedOrgs(expandedState);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Network error while fetching organizations.");
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, []);

  // Fetch users for all organizations or selected organization
  useEffect(() => {
    if (!organizations.length) return;

    const fetchUsersForOrganizations = async () => {
      try {
        const token = localStorage.getItem("token");
        const orgUsersMap = {};

        const orgsToFetch = selectedOrgId === "all"
          ? organizations
          : organizations.filter(org => org._id === selectedOrgId);

        for (const org of orgsToFetch) {
          try {
            const usersRes = await fetch(
              `https://admin.dozemate.com/api/manage/users/organization/${org._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const usersData = await usersRes.json();

            if (usersRes.ok && Array.isArray(usersData.data)) {
              orgUsersMap[org._id] = usersData.data;
            } else {
              orgUsersMap[org._id] = [];
            }
          } catch (err) {
            console.error(`Error fetching users for org ${org.name}:`, err);
            orgUsersMap[org._id] = [];
          }
        }

        setUsersByOrg(orgUsersMap);
      } catch (err) {
        console.error("Error in fetchUsersForOrganizations:", err);
        setError("Network error while fetching users.");
      }
    };

    fetchUsersForOrganizations();
  }, [organizations, selectedOrgId]);

  // Fetch devices for all users
  useEffect(() => {
    const allUsers = Object.values(usersByOrg).flat();
    if (!allUsers.length) return;

    const fetchAllDevices = async () => {
      const token = localStorage.getItem("token");
      const devicesMap = {};

      for (const user of allUsers) {
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
        } catch (err) {
          console.error(`Error fetching devices for user ${user.name}:`, err);
          devicesMap[user._id] = [];
        }
      }
      setUserDevices(devicesMap);
    };

    fetchAllDevices();
  }, [usersByOrg]);

  // Fetch live data and chart data for all users' devices (polling)
  useEffect(() => {
    if (!isAutoRefresh) return;

    let intervalId;
    const fetchAllLiveData = async () => {
      const token = localStorage.getItem("token");
      const liveDataMap = {};
      const chartDataMap = {};

      const allUsers = Object.values(usersByOrg).flat();

      for (const user of allUsers) {
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

              // ✅ Pull from metrics
              sdnn: latest.metrics?.sdnn ?? null,
              rmssd: latest.metrics?.rmssd ?? null,
              lf: latest.metrics?.lf ?? null,
              hf: latest.metrics?.hf ?? null,
              lfhf: latest.metrics?.lfhf ?? null,

              // ✅ (optional) keep extra HRV details
              mean_rr: latest.metrics?.mean_rr ?? null,
              pnn50: latest.metrics?.pnn50 ?? null,
              hr_median: latest.metrics?.hr_median ?? null,

              // ✅ Signals
              motion: latest.signals?.motion ?? null,
              presence: latest.signals?.presence ?? null,
              battery: latest.signals?.battery ?? null,
              activity: latest.signals?.activity ?? null,
              mic: latest.signals?.mic ?? null,
              rrIntervals: latest.signals?.rrIntervals ?? [],
              rawWaveform: latest.signals?.rawWaveform ?? [],

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
                // 🫁 Respiration
                visibleMetrics.respiration && {
                  label: "Respiration",
                  data: healthData.map(p => p.respiration ?? null),
                  borderColor: "rgba(54, 162, 235, 1)",
                  backgroundColor: "rgba(54, 162, 235, 0.1)",
                  fill: false,
                },

                // ❤️ Heart Rate
                visibleMetrics.heartRate && {
                  label: "Heart Rate",
                  data: healthData.map(p => p.heartRate ?? null),
                  borderColor: "rgba(255, 99, 132, 1)",
                  backgroundColor: "rgba(255, 99, 132, 0.1)",
                  fill: false,
                },

                // 🌡️ Temperature
                {
                  label: "Temperature1",
                  data: healthData.map(p => p.temperature ?? null),
                  borderColor: "orange",
                  backgroundColor: "rgba(255,165,0,0.1)",
                  fill: false,
                },

                // 💧 Humidity
                {
                  label: "Humidity",
                  data: healthData.map(p => p.humidity ?? null),
                  borderColor: "blue",
                  backgroundColor: "rgba(0,0,255,0.1)",
                  fill: false,
                },

                // 🧪 IAQ
                {
                  label: "IAQ",
                  data: healthData.map(p => p.iaq ?? null),
                  borderColor: "green",
                  backgroundColor: "rgba(0,255,0,0.1)",
                  fill: false,
                },

                // 🧪 CO₂
                {
                  label: "eCO₂",
                  data: healthData.map(p => p.eco2 ?? null),
                  borderColor: "purple",
                  backgroundColor: "rgba(128,0,128,0.1)",
                  fill: false,
                },

                // 📊 HRV metrics
                {
                  label: "SDNN",
                  data: healthData.map(p => p.metrics?.sdnn ?? null),
                  borderColor: "brown",
                  fill: false,
                },
                {
                  label: "RMSSD",
                  data: healthData.map(p => p.metrics?.rmssd ?? null),
                  borderColor: "darkcyan",
                  fill: false,
                },
                {
                  label: "LF/HF",
                  data: healthData.map(p => p.metrics?.lfhf ?? null),
                  borderColor: "pink",
                  fill: false,
                },

                // 📡 UART signals
                {
                  label: "RR Intervals",
                  data: (healthData[0]?.signals?.rrIntervals) || [],
                  borderColor: "red",
                  fill: false,
                },
                {
                  label: "Raw Waveform",
                  data: (healthData[0]?.signals?.rawWaveform) || [],
                  borderColor: "black",
                  fill: false,
                },

              ].filter(Boolean),
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
        } catch (err) {
          console.error(`Error fetching live data for user ${user.name}:`, err);
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
  }, [usersByOrg, userDevices, isAutoRefresh]);

  const getDeviceName = (userId) => {
    const devices = userDevices[userId] || [];
    if (!devices.length) return "No Device";
    return devices[0].name || devices[0].deviceType || devices[0].deviceId;
  };

  const handleOrgToggle = (orgId) => {
    setExpandedOrgs(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };

  const handleRefresh = () => {
    window.location.reload();
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

  const renderOrganizationSection = (org) => {
    const orgUsers = usersByOrg[org._id] || [];
    const isExpanded = expandedOrgs[org._id];

    if (!orgUsers.length) {
      return (
        <Accordion
          key={org._id}
          expanded={isExpanded}
          onChange={() => handleOrgToggle(org._id)}
          className="superadmin-org-accordion"
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box className="superadmin-org-header">
              <BusinessIcon sx={{ mr: 1, color: "#2563eb" }} />
              <Typography variant="h6" className="superadmin-org-name">
                {org.name}
              </Typography>
              <Chip
                label="0 users"
                size="small"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="superadmin-empty-org">
              <PeopleIcon sx={{ fontSize: "3rem", color: "#d1d5db", mb: 1 }} />
              <Typography variant="body1" color="textSecondary">
                No users found in this organization
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      );
    }

    return (
      <Accordion
        key={org._id}
        expanded={isExpanded}
        onChange={() => handleOrgToggle(org._id)}
        className="superadmin-org-accordion"
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box className="superadmin-org-header">
            <BusinessIcon sx={{ mr: 1, color: "#2563eb" }} />
            <Typography variant="h6" className="superadmin-org-name">
              {org.name}
            </Typography>
            <Chip
              label={`${orgUsers.length} user${orgUsers.length !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <div className="superadmin-users-grid">
            {orgUsers.map((user, idx) => (
              <Card
                key={user._id}
                className={`superadmin-user-card superadmin-card-${idx % 4}`}
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
                  <Box className="superadmin-user-header">
                    <Typography variant="subtitle1" className="superadmin-user-name">
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
                    className="superadmin-user-email"
                    title={user.email}
                  >
                    {user.email}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="superadmin-user-device"
                    title={`Device: ${getDeviceName(user._id)}`}
                  >
                    Device: {getDeviceName(user._id)}
                  </Typography>

                  <Box className="superadmin-mini-chart">
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

                  <Box className="superadmin-user-live">
                    <Typography variant="body2" color="textSecondary">
                      HR:{" "}
                      <span className="superadmin-live-value">
                        {userLiveData[user._id]?.hr ?? "-"}
                      </span>
                      <span className="superadmin-card-unit">bpm</span>
                      {" | "}
                      Resp:{" "}
                      <span className="superadmin-live-value">
                        {userLiveData[user._id]?.resp ?? "-"}
                      </span>
                      <span className="superadmin-card-unit">rpm</span>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box className="superadmin-dashboard-loading">
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading organizations and users...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" className="superadmin-dashboard-error">
          {error}
        </Alert>
      );
    }

    if (!organizations.length) {
      return (
        <Box className="superadmin-dashboard-empty-state">
          <BusinessIcon className="superadmin-dashboard-empty-icon" />
          <Typography variant="h6" color="textSecondary">
            No organizations found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Organizations will appear here once they are created
          </Typography>
        </Box>
      );
    }

    const orgsToShow = selectedOrgId === "all"
      ? organizations
      : organizations.filter(org => org._id === selectedOrgId);

    return (
      <Box className="superadmin-dashboard-content">
        {orgsToShow.map(org => renderOrganizationSection(org))}
      </Box>
    );
  };

  const getAllUsers = () => {
    return Object.values(usersByOrg).flat();
  };

  return (
    <div className="superadmin-dashboard-container">
      <Box className="superadmin-dashboard-header">
        <BusinessIcon className="superadmin-dashboard-icon" />
        <Typography variant="h4" className="superadmin-dashboard-title">
          Organizations Live Dashboard
        </Typography>
      </Box>

      {/* Controls */}
      <Box className="superadmin-dashboard-controls">
        <FormControl variant="outlined" size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Select Organization</InputLabel>
          <Select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            label="Select Organization"
          >
            <MenuItem value="all">
              <BusinessIcon sx={{ mr: 1, fontSize: "1rem" }} />
              All Organizations
            </MenuItem>
            {organizations.map((org) => (
              <MenuItem key={org._id} value={org._id}>
                {org.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              color="primary"
            />
          }
          label={isAutoRefresh ? "Live Updates: ON" : "Live Updates: OFF"}
        />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh All
        </Button>
      </Box>

      <Divider className="superadmin-dashboard-divider" />

      <div className="superadmin-dashboard-content-wrapper">
        {renderContent()}

        {/* Expanded User Dialog */}
        {getAllUsers().map((user) => (
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
              <Box className="superadmin-expanded-content">
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                  Email: {user.email}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={visibleMetrics.respiration}
                        onChange={(e) =>
                          setVisibleMetrics({ ...visibleMetrics, respiration: e.target.checked })
                        }
                      />
                    }
                    label="Respiration"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={visibleMetrics.heartRate}
                        onChange={(e) =>
                          setVisibleMetrics({ ...visibleMetrics, heartRate: e.target.checked })
                        }
                      />
                    }
                    label="Heart Rate"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={visibleMetrics.sdnn}
                        onChange={(e) =>
                          setVisibleMetrics({ ...visibleMetrics, sdnn: e.target.checked })
                        }
                      />
                    }
                    label="SDNN"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={visibleMetrics.rmssd}
                        onChange={(e) =>
                          setVisibleMetrics({ ...visibleMetrics, rmssd: e.target.checked })
                        }
                      />
                    }
                    label="RMSSD"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={visibleMetrics.lfhf}
                        onChange={(e) =>
                          setVisibleMetrics({ ...visibleMetrics, lfhf: e.target.checked })
                        }
                      />
                    }
                    label="LF/HF"
                  />
                </Box>
                {/* ⬆️ End toggle controls */}

                <Box className="superadmin-expanded-chart">
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

                <Box className="superadmin-expanded-chart">
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

                {/* Extra charts for Signals */}
                <Box className="superadmin-expanded-chart">
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    RR Intervals
                  </Typography>
                  <Line
                    data={{
                      labels: (userLiveData[user._id]?.rrIntervals || []).map((_, i) => i + 1),
                      datasets: [
                        {
                          label: "RR Intervals (ms)",
                          data: userLiveData[user._id]?.rrIntervals || [],
                          borderColor: "rgba(0, 200, 83, 1)",
                          backgroundColor: "rgba(0, 200, 83, 0.1)",
                          fill: false,
                          tension: 0.4,
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: true, position: "bottom" } },
                      scales: {
                        x: {
                          title: { display: true, text: "Sample Index" },
                        },
                        y: {
                          title: { display: true, text: "Interval (ms)" },
                        },
                      },
                    }}
                    height={200}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box className="superadmin-expanded-chart">
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Raw Waveform
                  </Typography>
                  <Line
                    data={{
                      labels: (userLiveData[user._id]?.rawWaveform || []).map((_, i) => i + 1),
                      datasets: [
                        {
                          label: "Raw Waveform",
                          data: userLiveData[user._id]?.rawWaveform || [],
                          borderColor: "rgba(33, 150, 243, 1)",
                          backgroundColor: "rgba(33, 150, 243, 0.1)",
                          fill: true,
                          tension: 0.3,
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: true, position: "bottom" } },
                      scales: {
                        x: {
                          title: { display: true, text: "Sample Index" },
                        },
                        y: {
                          title: { display: true, text: "Amplitude" },
                        },
                      },
                    }}
                    height={200}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />
                <Grid container spacing={2}>
                  {Object.keys(SENSOR_LABELS).map((key, i) => (
                    <Grid item xs={6} sm={4} md={3} key={key}>
                      <Card className={`superadmin-live-card superadmin-card-${i % 4}`}>
                        <CardContent>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            className="superadmin-live-label"
                          >
                            {SENSOR_LABELS[key]}
                          </Typography>
                          <Typography
                            variant="h6"
                            className="superadmin-live-value"
                          >
                            {Array.isArray(userLiveData[user._id]?.[key])
                              ? userLiveData[user._id][key].join(", ")
                              : (userLiveData[user._id]?.[key] ?? "-")}
                            <span className="superadmin-card-unit">
                              {UNIT_MAPPINGS[key]}
                            </span>
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  <Grid item xs={6} sm={4} md={3}>
                    <Card className="superadmin-live-card superadmin-card-0">
                      <CardContent>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          className="superadmin-live-label"
                        >
                          Heart Rate
                        </Typography>
                        <Typography
                          variant="h6"
                          className="superadmin-live-value"
                        >
                          {userLiveData[user._id]?.hr ?? "-"}
                          <span className="superadmin-card-unit">bpm</span>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Card className="superadmin-live-card superadmin-card-1">
                      <CardContent>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          className="superadmin-live-label"
                        >
                          Respiration
                        </Typography>
                        <Typography
                          variant="h6"
                          className="superadmin-live-value"
                        >
                          {userLiveData[user._id]?.resp ?? "-"}
                          <span className="superadmin-card-unit">rpm</span>
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
    </div>
  );
};

export default SuperAdminDashboard;