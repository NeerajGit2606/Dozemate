import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Chip, CircularProgress, Grid, InputAdornment, Snackbar,
  Tooltip, FormControl, InputLabel,
  Select, MenuItem, Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Devices as DevicesIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDeviceManagement.css';

const AdminDeviceManagement = () => {
  // State for devices
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [organizationId, setOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('view');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Form data for Edit
  const [formData, setFormData] = useState({
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

  // Snackbar notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Auth context
  const { token } = useAuth();

  // Get admin's organization on component mount
  useEffect(() => {
    fetchAdminOrganization();
  }, []);

  // Fetch devices when organization is fetched or page/limit/search changes
  useEffect(() => {
    if (organizationId) {
      fetchDevices();
    }
    // eslint-disable-next-line
  }, [organizationId, page, limit, searchQuery, filterStatus]);

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
      
      // Fetch organization name
      if (responseData.organizationId) {
        fetchOrganizationName(responseData.organizationId);
      }
    } catch (err) {
      console.error('Error fetching admin organization:', err);
      showSnackbar('Failed to fetch organization information', 'error');
    }
  };

  // Function to fetch organization name
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

  // Function to fetch devices for admin's organization using the new API endpoint
  const fetchDevices = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      // Use the new admin-specific API endpoint
      let url = `https://admin.dozemate.com/api/devices/devices/organization/${organizationId}`;
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: (page + 1).toString(), // API uses 1-based indexing
        limit: limit.toString()
      });

      // Add search query if present
      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      // Add status filter if present
      if (filterStatus) {
        queryParams.append('status', filterStatus);
      }

      // Append query parameters to URL
      url += `?${queryParams.toString()}`;

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

      // Handle different response structures
      let devices = [];
      let total = 0;

      if (responseData.success) {
        // If response has success field
        devices = responseData.data?.devices || responseData.data || [];
        total = responseData.data?.total || responseData.total || devices.length;
      } else {
        // Direct data response
        devices = responseData.devices || responseData.data || responseData || [];
        total = responseData.total || responseData.totalCount || devices.length;
      }

      setDevices(devices);
      setTotalCount(total);
    } catch (err) {
      console.error('Error fetching devices:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
      setDevices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
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
      const response = await fetch(`https://admin.dozemate.com/api/manage/devices/${selectedDeviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          organizationId: organizationId // Ensure organization doesn't change
        })
      });

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
      const response = await fetch(`https://admin.dozemate.com/api/manage/devices/${selectedDeviceId}`, {
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
    <Box className="admin-devices-container">
      <Box className="admin-devices-header">
        <Box className="admin-devices-title-section">
          <Typography variant="h4" className="admin-devices-title">
            <DevicesIcon className="admin-devices-icon" />
            Device Management
          </Typography>
          <Typography variant="subtitle1" className="admin-organization-subtitle">
            Managing devices for: <span className="admin-org-name">{organizationName}</span>
          </Typography>
        </Box>

        <Box className="admin-header-actions">
          <Box className="admin-search-filter-container">
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
              className="admin-search-field"
            />

            <FormControl size="small" className="admin-status-filter">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box className="admin-button-container">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchDevices}
              disabled={loading}
              className="admin-refresh-button"
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box className="admin-loading-container">
          <CircularProgress />
          <Typography>Loading devices...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className="admin-devices-table">
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
                    <TableRow key={device._id || device.id} className="admin-device-row">
                      <TableCell className="admin-device-id">{device.deviceId}</TableCell>
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
                        <Box className="admin-action-buttons">
                          <Tooltip title="View Details">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog("view", device)}
                              size="small"
                              className="admin-view-btn"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog("edit", device)}
                              size="small"
                              className="admin-edit-btn"
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
                              className="admin-delete-btn"
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
                    <TableCell colSpan={8} align="center" className="admin-no-devices">
                      No devices found in your organization
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
            className="admin-pagination"
          />
        </>
      )}

      {/* Edit/View Device Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="admin-device-dialog"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle className="admin-dialog-title">
          <Box display="flex" alignItems="center">
            {dialogMode === "edit" ? <EditIcon sx={{ mr: 1.5, color: '#1976d2' }} /> : <ViewIcon sx={{ mr: 1.5, color: '#1976d2' }} />}
            <Typography variant="h5" fontWeight={500}>
              {dialogMode === "edit" ? "Edit Device" : "Device Details"}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent className="admin-dialog-content">
          <form id="admin-device-form" onSubmit={handleEditSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="deviceId"
                  label="Device ID"
                  value={formData.deviceId}
                  onChange={handleFormChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                  placeholder="e.g. DZM12345"
                  className="admin-form-field"
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
                  className="admin-form-field"
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
                  className="admin-form-field"
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
                  className="admin-form-field"
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
                  className="admin-form-field"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === "view"} className="admin-form-field">
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
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="validity"
                  label="Validity"
                  type="date"
                  value={formData.validity}
                  onChange={handleFormChange}
                  fullWidth
                  disabled={dialogMode === "view"}
                  InputLabelProps={{ shrink: true }}
                  className="admin-form-field"
                />
              </Grid>

              {formError && (
                <Grid item xs={12}>
                  <Alert severity="error" className="admin-form-error">
                    {formError}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>

        <DialogActions className="admin-dialog-actions">
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            className="admin-cancel-btn"
          >
            {dialogMode === "view" ? "Close" : "Cancel"}
          </Button>

          {dialogMode !== "view" && (
            <Button
              type="submit"
              form="admin-device-form"
              variant="contained"
              color="primary"
              disabled={formLoading}
              className="admin-submit-btn"
            >
              {formLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Updating...
                </>
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
        className="admin-delete-dialog"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle className="admin-delete-dialog-title">
          <Box display="flex" alignItems="center">
            <DeleteIcon sx={{ mr: 1.5, color: '#f44336', fontSize: '1.8rem' }} />
            <Typography variant="h5" fontWeight={500}>
              Confirm Delete
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this device?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All device data and associated information will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions className="admin-delete-dialog-actions">
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            className="admin-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            className="admin-delete-btn"
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
        className="admin-feedback-snackbar"
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          className="admin-feedback-alert"
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

export default AdminDeviceManagement;