import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { MyContext } from '../../App';
import html2pdf from 'html2pdf.js';

import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import {
  Container,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  CircularProgress,
  Box,
  Alert,
  Card,
  CardContent,
  Divider,
  Button,
  Fade,
  TextField,
  RadioGroup,
  Radio
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import './DownloadReport.css';

// Define colors and labels for each metric
const metricConfig = {
  temp: { 
    color: 'rgba(255, 99, 132, 1)', 
    bgColor: 'rgba(255, 99, 132, 0.2)', 
    label: 'Temperature',
    unit: '°C',
    csvHeader: 'Temperature (°C)'
  },
  humidity: { 
    color: 'rgba(54, 162, 235, 1)', 
    bgColor: 'rgba(54, 162, 235, 0.2)', 
    label: 'Humidity',
    unit: '%',
    csvHeader: 'Humidity (%)'
  },
  iaq: { 
    color: 'rgba(255, 206, 86, 1)', 
    bgColor: 'rgba(255, 206, 86, 0.2)', 
    label: 'IAQ',
    unit: '',
    csvHeader: 'IAQ'
  },
  eco2: { 
    color: 'rgba(75, 192, 192, 1)', 
    bgColor: 'rgba(75, 192, 192, 0.2)', 
    label: 'ECO2',
    unit: 'ppm',
    csvHeader: 'ECO2 (ppm)'
  },
  tvoc: { 
    color: 'rgba(153, 102, 255, 1)', 
    bgColor: 'rgba(153, 102, 255, 0.2)', 
    label: 'TVOC',
    unit: 'ppb',
    csvHeader: 'TVOC (ppb)'
  },
  etoh: { 
    color: 'rgba(255, 159, 64, 1)', 
    bgColor: 'rgba(255, 159, 64, 0.2)', 
    label: 'ETOH',
    unit: 'ppb',
    csvHeader: 'ETOH (ppb)'
  },
  hrv: { 
    color: 'rgba(199, 0, 57, 1)', 
    bgColor: 'rgba(199, 0, 57, 0.2)', 
    label: 'HRV',
    unit: 'ms',
    csvHeader: 'HRV (ms)'
  },
  stress: { 
    color: 'rgba(144, 12, 63, 1)', 
    bgColor: 'rgba(144, 12, 63, 0.2)', 
    label: 'Stress',
    unit: '',
    csvHeader: 'Stress Level'
  },
  hr: { 
    color: 'rgba(88, 24, 69, 1)', 
    bgColor: 'rgba(88, 24, 69, 0.2)', 
    label: 'Heart Rate',
    unit: 'bpm',
    csvHeader: 'Heart Rate (bpm)'
  },
  resp: { 
    color: 'rgba(0, 128, 128, 1)', 
    bgColor: 'rgba(0, 128, 128, 0.2)', 
    label: 'Respiration',
    unit: 'bpm',
    csvHeader: 'Respiration Rate (bpm)'
  }
};

const DownloadReport = () => {
  // Get theme mode from context
  const context = useContext(MyContext);
  const isDarkMode = context?.themeMode === 'dark';
  
  // Auth context
  const { token } = useAuth();
  
  // State variables
  const [activeMetrics, setActiveMetrics] = useState({
    temp: true,
    humidity: true,
    iaq: true,
    eco2: false,
    tvoc: false,
    etoh: false,
    hrv: true,
    stress: true,
    hr: true,
    resp: true
  });
  
  const [timePeriod, setTimePeriod] = useState('24h');
  const [dateRangeType, setDateRangeType] = useState('quick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [deviceId, setDeviceId] = useState(null);
  
  // Organization and users state
  const [organizationId, setOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Download states
  const [downloading, setDownloading] = useState(false);

  // ... (keep all the existing useEffect and fetch functions unchanged)
  
  // Get admin's organization on component mount
  useEffect(() => {
    fetchAdminOrganization();
  }, []);

  // Fetch users when organization is fetched
  useEffect(() => {
    if (organizationId) {
      fetchOrganizationUsers();
    }
  }, [organizationId]);

  // Fetch history data when user, time period, or date range changes
  useEffect(() => {
    if (selectedUserId && deviceId) {
      if (dateRangeType === 'quick') {
        fetchHistoryData(deviceId, timePeriod);
      } else if (dateRangeType === 'custom' && startDate && endDate) {
        fetchCustomRangeData(deviceId, startDate, endDate);
      }
    }
  }, [timePeriod, selectedUserId, deviceId, dateRangeType, startDate, endDate]);

  // Function to fetch admin's organization
  const fetchAdminOrganization = async () => {
    try {
      const response = await fetch('https://admin.dozemate.com/api/user/user/organization-id', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organization');
      }
      const responseData = await response.json();
      setOrganizationId(responseData.organizationId);
      
      if (responseData.organizationId) {
        fetchOrganizationName(responseData.organizationId);
      }
    } catch (err) {
      console.error('Error fetching admin organization:', err);
      setError('Failed to fetch organization information');
    }
  };

  const fetchOrganizationName = async (orgId) => {
    try {
      const response = await fetch('https://admin.dozemate.com/api/organizations', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const responseData = await response.json();
        const orgs = responseData.data?.organizations || [];
        const org = orgs.find(o => o._id === orgId);
        setOrganizationName(org ? org.name : 'Unknown Organization');
      }
    } catch (err) {
      console.error('Error fetching organization name:', err);
      setOrganizationName('Organization');
    }
  };

  const fetchOrganizationUsers = async () => {
    if (!organizationId) return;
    setUsersLoading(true);
    try {
      const response = await fetch(`https://admin.dozemate.com/api/manage/users/organization/${organizationId}?page=1&limit=1000`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const responseData = await response.json();
      
      let usersArr = [];
      if (Array.isArray(responseData.data)) {
        usersArr = responseData.data;
      } else if (responseData.data?.users) {
        usersArr = responseData.data.users;
      }
      
      const regularUsers = usersArr.filter(user => user.role === 'user');
      setUsers(regularUsers);
      
      if (regularUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(regularUsers[0]._id);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch organization users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchUserDevice = async (userEmail) => {
    try {
      const response = await fetch(`https://admin.dozemate.com/api/devices/active-device/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user devices");
      }
      
      const data = await response.json();
      let id = null;
      
      if (data.data && data.data.activeDeviceId) {
        id = data.data.activeDeviceId;
      }
      
      if (id) {
        setDeviceId(id);
        return id;
      } else {
        setError("No active device found for selected user");
        setDeviceId(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching user device:", err);
      setError(err.message);
      setDeviceId(null);
      return null;
    }
  };

  const handleUserChange = async (event) => {
    const userId = event.target.value;
    setSelectedUserId(userId);
    setHistoryData([]);
    setError(null);
    
    if (userId) {
      const selectedUser = users.find(user => user._id === userId);
      if (selectedUser && selectedUser.email) {
        setLoading(true);
        const deviceId = await fetchUserDevice(selectedUser.email);
        if (deviceId) {
          if (dateRangeType === 'quick') {
            await fetchHistoryData(deviceId, timePeriod);
          } else if (dateRangeType === 'custom' && startDate && endDate) {
            await fetchCustomRangeData(deviceId, startDate, endDate);
          }
        }
        setLoading(false);
      } else {
        setError("User email not found");
      }
    }
  };
  
  const fetchHistoryData = async (deviceId, period) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://admin.dozemate.com/api/data/health/raw/${deviceId}?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }
      
      const result = await response.json();
      
      const sortedData = (result.data || []).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setHistoryData(sortedData);
    } catch (err) {
      console.error("Error fetching history data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRangeData = async (deviceId, startDate, endDate) => {
    setLoading(true);
    setError(null);
    
    try {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + 'T23:59:59').toISOString();
      
      const response = await fetch(`https://admin.dozemate.com/api/data/history/${deviceId}?startDate=${start}&endDate=${end}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }
      
      const result = await response.json();
      
      const sortedData = (result.data || []).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setHistoryData(sortedData);
    } catch (err) {
      console.error("Error fetching custom range data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMetricToggle = (metric) => {
    setActiveMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };
  
  const handleTimePeriodChange = (event) => {
    setTimePeriod(event.target.value);
  };

  const handleDateRangeTypeChange = (event) => {
    setDateRangeType(event.target.value);
    setHistoryData([]);
    setError(null);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  useEffect(() => {
    if (users.length > 0 && selectedUserId) {
      const selectedUser = users.find(user => user._id === selectedUserId);
      if (selectedUser && selectedUser.email) {
        fetchUserDevice(selectedUser.email);
      }
    }
  }, [users]);

  const getMetricValue = (item, metricKey) => {
    switch(metricKey) {
      case 'hr':
        return item.heartRate !== undefined ? item.heartRate : item.hr;
      case 'resp':
        return item.respiration !== undefined ? item.respiration : (item.respiratoryRate !== undefined ? item.respiratoryRate : item.resp);
      case 'hrv':
        return item.hrv;
      case 'stress':
        return item.stress;
      default:
        return item[metricKey];
    }
  };

  // CSV Download Function
  const downloadCSV = () => {
    if (!historyData || historyData.length === 0) {
      alert('No data available to download');
      return;
    }

    setDownloading(true);
    
    try {
      const selectedMetrics = Object.keys(activeMetrics).filter(metric => activeMetrics[metric]);
      const headers = ['Date', 'Time', ...selectedMetrics.map(metric => metricConfig[metric].csvHeader)];
      const csvRows = [headers.join(',')];
      
      historyData.forEach(item => {
        const timestamp = new Date(item.timestamp);
        
        const formattedDate = timestamp.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const formattedTime = timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
        const row = [
          `"${formattedDate}"`,
          `"${formattedTime}"`,
          ...selectedMetrics.map(metric => {
            const value = getMetricValue(item, metric);
            return value !== null && value !== undefined ? value : '';
          })
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const selectedUser = users.find(user => user._id === selectedUserId);
      const userName = selectedUser ? selectedUser.name.replace(/\s+/g, '_') : 'User';
      const dateRangeStr = dateRangeType === 'quick' ? timePeriod : `${startDate}_to_${endDate}`;
      const filename = `Health_Report_${userName}_${dateRangeStr}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV file');
    } finally {
      setDownloading(false);
    }
  };

  // Simple HTML-to-PDF Function
  const downloadPDF = () => {
    if (!historyData || historyData.length === 0) {
      alert('No data available to download');
      return;
    }

    setDownloading(true);
    
    try {
      const selectedMetrics = Object.keys(activeMetrics).filter(metric => activeMetrics[metric]);
      
      // Create HTML table
      let htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 10px; }
              th, td { border: 1px solid #ddd; padding: 4px; text-align: center; }
              th { background-color: #3490dc; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  ${selectedMetrics.map(metric => `<th>${metricConfig[metric].label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
      `;

      historyData.forEach(item => {
        const timestamp = new Date(item.timestamp);
        const formattedDate = `${timestamp.getDate().toString().padStart(2, '0')}/${(timestamp.getMonth() + 1).toString().padStart(2, '0')}/${timestamp.getFullYear()}`;
        const formattedTime = `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
        
        htmlContent += `
          <tr>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            ${selectedMetrics.map(metric => {
              const value = getMetricValue(item, metric);
              const displayValue = value !== null && value !== undefined ? 
                (metricConfig[metric].unit ? `${value}${metricConfig[metric].unit}` : value) : '-';
              return `<td>${displayValue}</td>`;
            }).join('')}
          </tr>
        `;
      });

      htmlContent += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Create temporary element
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      const selectedUser = users.find(user => user._id === selectedUserId);
      const userName = selectedUser ? selectedUser.name.replace(/[^a-zA-Z0-9]/g, '_') : 'User';
      const dateRangeStr = dateRangeType === 'quick' ? timePeriod : `${startDate}_to_${endDate}`;
      const filename = `Health_Report_${userName}_${dateRangeStr}_${new Date().toISOString().split('T')[0]}.pdf`;

      const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setDownloading(false);
      }).catch(err => {
        console.error('PDF generation error:', err);
        alert('Failed to generate PDF. Please try again.');
        setDownloading(false);
      });

    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Please try again.');
      setDownloading(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <Container className={isDarkMode ? "download-report-container dark" : "download-report-container"} maxWidth="xl">
      <Box className="download-page-header">
        <Typography variant="h4" component="h1" className="download-page-title">
          <DownloadIcon className="download-page-icon" /> 
          Download Health Reports
        </Typography>
        <Typography variant="subtitle1" className="download-subtitle">
          Export user health and environmental data in CSV or PDF format for: <span className="download-org-name">{organizationName}</span>
        </Typography>
      </Box>
      
      <Card elevation={3} className="download-filter-card">
        <CardContent>
          <Typography variant="h6" className="download-card-title">
            <FilterListIcon className="download-card-icon" />
            Report Configuration
          </Typography>
          <Divider className="download-card-divider" />
          
          <Grid container spacing={3} alignItems="center">
            {/* User selector */}
            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth 
                variant="outlined"
                className="download-user-select"
              >
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon fontSize="small" />
                    Select User
                  </Box>
                </InputLabel>
                <Select
                  value={selectedUserId}
                  onChange={handleUserChange}
                  label="👤 Select User"
                  className={isDarkMode ? 'dark-select' : ''}
                  disabled={usersLoading || users.length === 0}
                >
                  {usersLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading users...
                    </MenuItem>
                  ) : users.length === 0 ? (
                    <MenuItem disabled>No users found</MenuItem>
                  ) : (
                    users.map(user => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range Type Selection */}
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom className="download-date-range-header">
                <CalendarTodayIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Date Range Selection:
              </Typography>
              <RadioGroup
                row
                value={dateRangeType}
                onChange={handleDateRangeTypeChange}
                className="download-date-range-radio"
              >
                <FormControlLabel 
                  value="quick" 
                  control={<Radio />} 
                  label="Quick Selection" 
                  disabled={!selectedUserId}
                />
                <FormControlLabel 
                  value="custom" 
                  control={<Radio />} 
                  label="Custom Date Range" 
                  disabled={!selectedUserId}
                />
              </RadioGroup>
            </Grid>

            {/* Quick Time Period Selector */}
            {dateRangeType === 'quick' && (
              <Grid item xs={12} md={4}>
                <FormControl 
                  fullWidth 
                  variant="outlined"
                  className="download-time-select"
                >
                  <InputLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DateRangeIcon fontSize="small" />
                      Time Period
                    </Box>
                  </InputLabel>
                  <Select
                    value={timePeriod}
                    onChange={handleTimePeriodChange}
                    label="⏱ Time Period"
                    className={isDarkMode ? 'dark-select' : ''}
                    disabled={!selectedUserId}
                  >
                    <MenuItem value="24h">Last 24 Hours</MenuItem>
                    <MenuItem value="48h">Last 2 Days</MenuItem>
                    <MenuItem value="72h">Last 3 Days</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Custom Date Range Selectors */}
            {dateRangeType === 'custom' && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      max: getCurrentDate()
                    }}
                    disabled={!selectedUserId}
                    className="download-date-input"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: startDate,
                      max: getCurrentDate()
                    }}
                    disabled={!selectedUserId || !startDate}
                    className="download-date-input"
                  />
                </Grid>
              </>
            )}
            
            {/* Metric toggles */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom className="download-metrics-header">
                Select Metrics to Include:
              </Typography>
              <Paper elevation={0} className="download-metrics-container">
                <FormGroup row className="download-metrics-group">
                  {Object.keys(metricConfig).map(metric => (
                    <FormControlLabel
                      key={metric}
                      control={
                        <Checkbox
                          checked={activeMetrics[metric]}
                          onChange={() => handleMetricToggle(metric)}
                          style={{ color: metricConfig[metric].color }}
                          className="download-metric-checkbox"
                          disabled={!selectedUserId}
                        />
                      }
                      label={metricConfig[metric].label}
                      className="download-metric-label"
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Data Preview and Download Section */}
      {!selectedUserId ? (
        <Alert severity="info" className="download-info-alert" sx={{ my: 3 }}>
          Please select a user to configure the report
        </Alert>
      ) : dateRangeType === 'custom' && (!startDate || !endDate) ? (
        <Alert severity="info" className="download-info-alert" sx={{ my: 3 }}>
          Please select both start and end dates for custom range
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }} className="download-loading-container">
          <CircularProgress className="download-loading-spinner" />
          <Typography variant="body1" sx={{ mt: 2 }}>Loading user health data...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" className="download-error-alert" sx={{ my: 3 }}>{error}</Alert>
      ) : historyData.length === 0 ? (
        <Alert severity="info" className="download-info-alert" sx={{ my: 3 }}>
          No data available for the selected user and time period
        </Alert>
      ) : (
        <Fade in={!loading}>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* Data Summary Card */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} className="download-summary-card">
                <CardContent>
                  <Typography variant="h6" className="download-summary-title">
                    <TableViewIcon className="download-summary-icon" />
                    Data Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box className="download-summary-stats">
                    <Typography variant="body1">
                      <strong>Total Records:</strong> {historyData.length}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Selected Metrics:</strong> {Object.values(activeMetrics).filter(Boolean).length}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Date Range:</strong> {historyData.length > 0 ? 
                        `${new Date(historyData[0].timestamp).toLocaleDateString()} - ${new Date(historyData[historyData.length - 1].timestamp).toLocaleDateString()}` : 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>User:</strong> {users.find(user => user._id === selectedUserId)?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Period Type:</strong> {dateRangeType === 'quick' ? 'Quick Selection' : 'Custom Range'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Download Actions Card */}
            <Grid item xs={12} md={6}>
              <Card elevation={3} className="download-actions-card">
                <CardContent>
                  <Typography variant="h6" className="download-actions-title">
                    <GetAppIcon className="download-actions-icon" />
                    Export Options
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Box className="download-buttons-container">
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<TableViewIcon />}
                      onClick={downloadCSV}
                      disabled={downloading || historyData.length === 0}
                      className="download-csv-button"
                      sx={{ mb: 2, width: '100%' }}
                    >
                      {downloading ? 'Generating CSV...' : 'Download as CSV'}
                    </Button>
                    
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={downloadPDF}
                      disabled={downloading || historyData.length === 0}
                      className="download-pdf-button"
                      sx={{ width: '100%' }}
                      color="error"
                    >
                      {downloading ? 'Generating PDF...' : 'Download as PDF'}
                    </Button>
                  </Box>
                  
                  {downloading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>
      )}
    </Container>
  );
};

export default DownloadReport;