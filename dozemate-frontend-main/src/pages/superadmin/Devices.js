import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Chip, CircularProgress, Grid, InputAdornment, Snackbar,
  Tooltip, FormControl, InputLabel,
  Select, MenuItem, Card, CardContent, Divider, Container, Tabs, Tab, Alert
} from '@mui/material';
import {
  AddBox as AddBoxIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Devices as DevicesIcon,
  List as ListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './Devices.css';
import { apiUrl } from "../../config/api"

// ============== SOLUTION: Step 1 - Define Components Outside ==============

// Add Device Component is now a standalone component that receives props
// ============== REPLACEMENT: Add Device Component (uses Prefix Select) ==============
const AddDeviceComponent = ({
  newDevice,
  handleNewDeviceChange,
  handleAddDeviceSubmit,
  addFormLoading,
  addMode,
  addDeviceFetching,
  addDeviceDetails,
  codes,   // ✅ added
}) => (
  <Container className="add-device-container">
    <Box className="page-header">
      <Typography variant="h4" component="h1" className="page-title">
        <AddBoxIcon className="page-icon" />
        Add Device
      </Typography>
      <Typography variant="subtitle1" className="subtitle">
        Register a new device in the system
      </Typography>
    </Box>

    <Card className="device-form-card">
      <CardContent>
        <Typography variant="h6" className="card-title">
          <DevicesIcon className="card-icon" />
          Device Information
        </Typography>
        <Divider className="card-divider" />

        <form onSubmit={handleAddDeviceSubmit} className="device-form" autoComplete="off">
          <Grid container spacing={3}>

            {/* NEW: Prefix selector (replaces manual Device ID) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Device ID *"
                name="deviceId"
                variant="outlined"
                value={newDevice.deviceId || ""}
                onChange={handleNewDeviceChange}
                placeholder="e.g. 0102-ACDE48112233"
                required
              />

            </Grid>

            {/* Read-only auto-filled from prefix */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Device Type *</InputLabel>
                <Select
                  name="deviceType"
                  value={newDevice.deviceType || ""}
                  onChange={handleNewDeviceChange}
                  label="Device Type *"
                >
                  {codes?.models?.map(m => (
                    <MenuItem key={m.code} value={m.code}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Manufacturer *</InputLabel>
                <Select
                  name="manufacturer"
                  value={newDevice.manufacturer || ""}
                  onChange={handleNewDeviceChange}
                  label="Manufacturer *"
                >
                  {codes?.manufacturers?.map(m => (
                    <MenuItem key={m.code} value={m.code}>{m.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firmware Version"
                name="firmwareVersion"
                variant="outlined"
                value={newDevice.firmwareVersion || ''}
                onChange={handleNewDeviceChange}
                className="form-field"
                placeholder="e.g. 1.2.3"
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                variant="outlined"
                value={newDevice.location || ''}
                onChange={handleNewDeviceChange}
                className="form-field"
                placeholder="e.g. Home Office"
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" className="form-field">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newDevice.status || ''}
                  onChange={handleNewDeviceChange}
                  label="Status"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="under maintenance">Under Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Validity"
                name="validity"
                type="date"
                variant="outlined"
                value={newDevice.validity || ''}
                onChange={handleNewDeviceChange}
                InputLabelProps={{ shrink: true }}
                className="form-field"
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                className="action-button submit-button"
                disabled={addFormLoading || addDeviceFetching}
              >
                {addFormLoading ? <CircularProgress size={24} /> : "Add Device"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  </Container>
);

// All Devices Component is now a standalone component that receives props
const AllDevicesComponent = ({
  devices,
  loading,
  totalCount,
  page,
  limit,
  searchQuery,
  filterStatus,
  setSearchQuery,
  setFilterStatus,
  fetchDevices,
  openDialog,
  openDeleteDialog,
  handleChangePage,
  handleChangeRowsPerPage,
  getStatusColor,
}) => (
  <Box className="devices-container">
    <Box className="devices-header">
      <Typography variant="h4" className="page-title">
        <ListIcon className="page-icon" />
        All Devices
      </Typography>

      <Box className="header-actions">
        <Box className="search-filter-container">
          <TextField
            placeholder="Search devices..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            className="search-field"
          />

          <FormControl size="small" className="status-filter">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="under maintenance">Under Maintenance</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box className="button-container">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDevices}
            disabled={loading}
            className="refresh-button"
          >
            Refresh
          </Button>
        </Box>
      </Box>
    </Box>

    {loading ? (
      <Box className="loading-container">
        <CircularProgress />
        <Typography>Loading devices...</Typography>
      </Box>
    ) : (
      <>
        <TableContainer component={Paper} className="devices-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device ID</TableCell>
                <TableCell>Device Type</TableCell>
                <TableCell>Manufacturer</TableCell>
                <TableCell>Firmware Version</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Validity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.length > 0 ? (
                devices.map((device) => (
                  <TableRow key={device._id || device.id}>
                    <TableCell>{device.deviceId}</TableCell>
                    <TableCell>{device.deviceType}</TableCell>
                    <TableCell>{device.manufacturer || "-"}</TableCell>
                    <TableCell>{device.firmwareVersion || "-"}</TableCell>
                    <TableCell>{device.location || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={device.status || "Unknown"}
                        color={getStatusColor(device.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {device.validity
                        ? new Date(device.validity).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Box className="action-buttons">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => openDialog("view", device)}
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => openDialog("edit", device)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() =>
                              openDeleteDialog(device._id || device.id)
                            }
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No devices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="pagination"
        />
      </>
    )}
  </Box>
);


const Devices = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // State for devices
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Form data for Add/Edit
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceType: '',
    manufacturer: '',
    prefixId: '',            // NEW
    firmwareVersion: '',
    location: '',
    status: '',
    validity: '',
    prefixPreview: ''
  });

  // New device form data (for Add Device tab)
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    deviceType: '',
    manufacturer: '',
    firmwareVersion: '',
    location: '',
    status: '',
    validity: ''
  });

  // Form submission state
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [addFormLoading, setAddFormLoading] = useState(false);

  // Snackbar notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [addMode, setAddMode] = useState('create'); // 'create' | 'edit'
  const [addDeviceFetching, setAddDeviceFetching] = useState(false);
  const [addDeviceDetails, setAddDeviceDetails] = useState(null);
  const lastCheckedRef = useRef('');

  // Auth context
  const { token } = useAuth();



  // lookup codes (models/manufacturers)
  const [codes, setCodes] = useState(null);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        console.log("[Devices] Fetching /api/public/codes ...");
        const res = await fetch(apiUrl("/api/public/codes"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) {
          setCodes(json);
          console.log("[Devices] Codes loaded:", Object.keys(json));
        } else {
          console.error("[Devices:ERR] Failed codes", json.message);
        }
      } catch (err) {
        console.error("[Devices:ERR] Network codes", err.message);
      }
    };
    fetchCodes();
  }, [token]);

  // Fetch devices on component mount and when page/limit/search changes
  useEffect(() => {
    if (tabValue === 1) { // Only fetch when on "All Devices" tab
      fetchDevices();
    }
    // eslint-disable-next-line
  }, [page, limit, searchQuery, filterStatus, tabValue]);

  useEffect(() => {
    if (!newDevice.deviceId?.trim()) {
      setAddMode('create');
      setAddDeviceDetails(null);
      lastCheckedRef.current = '';
    }
  }, [newDevice.deviceId]);


  const fetchDeviceDetailsForAdd = async (idOverride) => {
    const id = ((idOverride ?? newDevice.deviceId) || '').trim().toUpperCase();
    if (!id) return;
    if (lastCheckedRef.current === id) return;
    lastCheckedRef.current = id;

    setAddDeviceFetching(true);
    try {
      const res = await fetch(apiUrl(`/api/devices/details/${encodeURIComponent(id)}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();

      if (res.ok && json?.data) {
        const d = json.data;
        setAddDeviceDetails(d);
        setAddMode('edit');
        // prefill fields for edit
        setNewDevice(prev => ({
          ...prev,
          deviceId: d.deviceId || id,
          deviceType: d.deviceType || '',
          manufacturer: d.manufacturer || '',
          firmwareVersion: d.firmwareVersion || '',
          location: d.location || '',
          status: d.status || '',
          validity: d.validity ? d.validity.split('T')[0] : ''
        }));
        showSnackbar('Existing device loaded. You can edit and save.', 'info');
      } else {
        setAddDeviceDetails(null);
        setAddMode('create');
        showSnackbar('New device — fill details and click Add.', 'success');
      }
    } catch {
      showSnackbar('Could not verify device ID.', 'error');
    } finally {
      setAddDeviceFetching(false);
    }
  };

  const handleAddDeviceIdBlur = () => {
    if (addDeviceFetching) return;
    fetchDeviceDetailsForAdd(newDevice.deviceId);
  };


  // Function to fetch devices using deviceManagement API
  const fetchDevices = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams({
        page: page + 1, // API uses 1-based indexing
        limit
      });

      // Use search endpoint if searching, otherwise get all
      let url = `https://admin.dozemate.com/api/manage/devices`;
      if (searchQuery) {
        url += `/search?q=${encodeURIComponent(searchQuery)}`;
      } else {
        url += `?${queryParams}`;
      }

      // Add status filter if present
      if (filterStatus) {
        url += searchQuery ? `&status=${encodeURIComponent(filterStatus)}` : `&status=${encodeURIComponent(filterStatus)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch devices');
      }

      const responseData = await response.json();

      // deviceManagement API returns { data: [devices], total, ... }
      const devices = responseData.data || [];
      const total = responseData.total || responseData.totalCount || devices.length;

      setDevices(devices);
      setTotalCount(total);
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Function to handle opening dialog for edit/view
  const openDialog = (mode, device = null) => {
    setDialogMode(mode);

    if (device) {
      setFormData({
        deviceId: device.deviceId || '',
        deviceType: device.deviceType || '',
        manufacturer: device.manufacturer || '',
        firmwareVersion: device.firmwareVersion || '',
        location: device.location || '',
        status: device.status || '',
        validity: device.validity ? device.validity.split('T')[0] : ''
      });

      setSelectedDeviceId(device._id || device.id);
    }

    setFormError('');
    setDialogOpen(true);
  };

  // Function to handle form input changes for Add Device (improved)
  const handleNewDeviceChange = (e) => {
    const { name, value } = e.target;
    setNewDevice(prev => {
      let cleaned = value.trim().toUpperCase();

      // Always store deviceId in uppercase, no spaces
      if (name === "deviceId") {
        cleaned = cleaned.replace(/\s/g, "");
      }

      const updated = { ...prev, [name]: cleaned };

      // ✅ Auto-select if full string includes a 4-digit prefix
      if (name === "deviceId") {
        const match = cleaned.match(/^(\d{4})/);  // first 4 digits before dash or not
        if (match) {
          const prefix = match[1];
          const modelCode = prefix.slice(0, 2);
          const mfrCode = prefix.slice(2, 4);
          console.log("[Devices] Prefix detected:", prefix, "→", modelCode, mfrCode);

          if (codes) {
            const model = codes.modelsByCode?.[modelCode];
            const mfr = codes.manufacturersByCode?.[mfrCode];
            if (model) updated.deviceType = model.code;
            if (mfr) updated.manufacturer = mfr.code;
            console.log("[Devices] Auto-filled:", model?.name, mfr?.name);
          }
        }
      }

      return updated;
    });
  };

  // Function to handle form input changes for Edit Dialog
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Function to show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Function to handle Add Device form submission (now uses /api/manage/devices/add)
  const handleAddDeviceSubmit = async (e) => {
    e.preventDefault();

    setAddFormLoading(true);
    try {

      // Create new DEVICE by issuing ID from prefix on server
      const payload = {
        deviceId: newDevice.deviceId,           // ✅ use typed ID
        deviceType: newDevice.deviceType,
        manufacturer: newDevice.manufacturer,
        firmwareVersion: newDevice.firmwareVersion || "v1.0.0",
        location: newDevice.location || "",
        status: newDevice.status || "inactive",
        validity: newDevice.validity || "",
        profileId: newDevice.profileId || null
      };
      
      console.log('payload',payload);

      const url = apiUrl('/api/manage/devices/add');
      const method = 'POST';
      const body = JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || json.message || 'Request failed');

      showSnackbar('Device added successfully!', 'success');

      // reset form

      setNewDevice({
        prefixId: '',
        deviceType: '',
        manufacturer: '',
        firmwareVersion: '',
        location: '',
        status: '',
        validity: '',
        prefixPreview: ''
      });

      setAddMode('create');
      setAddDeviceDetails(null);
      lastCheckedRef.current = '';

      if (tabValue === 1) fetchDevices();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setAddFormLoading(false);
    }
  };


  // Function to handle Edit form submission (PUT /api/manage/devices/:id)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.deviceId || !formData.deviceType) {
      setFormError('Device ID and Device Type are required');
      return;
    }

    setFormLoading(true);

    try {
      const response = await fetch(apiUrl(`/api/manage/devices/${selectedDeviceId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update device');
      }

      setDialogOpen(false);
      showSnackbar('Device updated successfully');
      fetchDevices();
    } catch (err) {
      setFormError(err.message || 'Failed to save device');
    } finally {
      setFormLoading(false);
    }
  };

  // Function to handle confirm delete (DELETE /api/manage/devices/:id)
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(apiUrl(`/api/manage/devices/${selectedDeviceId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete device');
      }

      setDeleteDialogOpen(false);
      showSnackbar('Device deleted successfully');
      fetchDevices();
    } catch (err) {
      showSnackbar(`Error: ${err.message}`, 'error');
      setDeleteDialogOpen(false);
    }
  };

  // Function to open delete confirmation dialog
  const openDeleteDialog = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setDeleteDialogOpen(true);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'under maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box className="devices-main-container">
      <Box className="devices-tabs-header">
        <Typography variant="h4" className="main-page-title">
          <DevicesIcon className="main-page-icon" />
          Device Management
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className="devices-tabs"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Add Device" icon={<AddBoxIcon />} />
          <Tab label="All Devices" icon={<ListIcon />} />
        </Tabs>
      </Box>

      {/* ============== SOLUTION: Step 2 - Render components and pass props ============== */}
      {tabValue === 0 && (
        <AddDeviceComponent
          newDevice={newDevice}
          handleNewDeviceChange={handleNewDeviceChange}
          handleAddDeviceSubmit={handleAddDeviceSubmit}
          addFormLoading={addFormLoading}
          addMode={addMode}
          addDeviceFetching={addDeviceFetching}
          addDeviceDetails={addDeviceDetails}
          codes={codes}
        />
      )}
      {tabValue === 1 && (
        <AllDevicesComponent
          devices={devices}
          loading={loading}
          totalCount={totalCount}
          page={page}
          limit={limit}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          setSearchQuery={setSearchQuery}
          setFilterStatus={setFilterStatus}
          fetchDevices={fetchDevices}
          openDialog={openDialog}
          openDeleteDialog={openDeleteDialog}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Edit/View Device Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "edit" ? "Edit Device" : "Device Details"}
        </DialogTitle>

        <DialogContent>
          <form id="device-form" onSubmit={handleEditSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Device ID *"
                  name="deviceId"
                  variant="outlined"
                  value={formData.deviceId || ""}      // ✅ Use formData
                  onChange={handleFormChange}          // ✅ Use edit handler
                  placeholder="e.g. 0102-ACDE48112233"
                  required
                  disabled={dialogMode === "view"}     // ✅ Consistent with other fields
                />

              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="deviceType"
                  label="Device Type"
                  value={formData.deviceType}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                  placeholder="e.g. Dozemate"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="manufacturer"
                  label="Manufacturer"
                  value={formData.manufacturer}
                  onChange={handleFormChange}
                  fullWidth
                  disabled={dialogMode === "view"}
                  placeholder="e.g. SlimIO Health"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="firmwareVersion"
                  label="Firmware Version"
                  value={formData.firmwareVersion}
                  onChange={handleFormChange}
                  fullWidth
                  disabled={dialogMode === "view"}
                  placeholder="e.g. 1.2.3"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="location"
                  label="Location"
                  value={formData.location}
                  onChange={handleFormChange}
                  fullWidth
                  disabled={dialogMode === "view"}
                  placeholder="e.g. Home Office"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === "view"}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    label="Status"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="under maintenance">Under Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="validity"
                  label="Validity"
                  type="date"
                  value={formData.validity}
                  fullWidth
                  disabled={dialogMode === "view"}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {formError && (
                <Grid item xs={12}>
                  <Box className="form-error">{formError}</Box>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            {dialogMode === "view" ? "Close" : "Cancel"}
          </Button>

          {dialogMode !== "view" && (
            <Button
              type="submit"
              form="device-form"
              variant="contained"
              color="primary"
              disabled={formLoading}
            >
              {formLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Update Device"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this device? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        className="feedback-snackbar"
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          className="feedback-alert"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Devices;