import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Chip, CircularProgress, Grid, InputAdornment, Snackbar,
  Tooltip, Switch, FormControlLabel, Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './Organizations.css';
import { apiUrl } from "../../config/api";

const Organizations = () => {
  // State for organizations
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [selectedOrgUsers, setSelectedOrgUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    organizationId: '',
    address: '',
    contactPerson: '',
    email: '',
    contactNumber: '', // Changed from 'phone' to 'contactNumber' to match backend
    pincode: '', // Added required field
    isActive: true,
    description: ''
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

  // Fetch organizations on component mount and when page/limit/search changes
  useEffect(() => {
    fetchOrganizations();
  }, [page, limit, searchQuery, filterActive]);

  // Function to fetch organizations
  // Update the data processing part in fetchOrganizations function:
  const fetchOrganizations = async () => {

    try {
      let queryParams = new URLSearchParams({
        page: page + 1, // API uses 1-based indexing
        limit
      });

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      if (filterActive !== null) {
        queryParams.append('isActive', filterActive);
      }

      const response = await fetch(apiUrl(`/api/organizations?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organizations');
      }

      const responseData = await response.json();
      console.log('Organizations response:', responseData); // Debugging

      // Handle the nested structure correctly
      const organizations = responseData.data?.organizations || // Handle nested under data.organizations
        responseData.organizations ||       // Or directly under organizations
        responseData.data ||               // Or directly under data
        [];                               // Default empty array if none found

      const total = responseData.total ||
        responseData.totalCount ||
        responseData.data?.total ||
        (organizations.length > 0 ? organizations.length : 0);

      console.log('Extracted organizations:', organizations);
      setOrganizations(organizations);
      setTotalCount(total);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch organization users
  const fetchOrganizationUsers = async (orgId) => {
    setLoadingUsers(true);

    try {
      const response = await fetch(apiUrl(`/api/organizations/${orgId}/users`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organization users');
      }

      const data = await response.json();
      setSelectedOrgUsers(data.data?.users || []);
    } catch (err) {
      console.error('Error fetching organization users:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Function to handle opening dialog for add/edit/view
  const openDialog = (mode, org = null) => {
    setDialogMode(mode);

    if (mode === 'add') {
      // Reset form data for new organization
      setFormData({
        name: '',
        organizationId: '',
        address: '',
        contactPerson: '',
        email: '',
        contactNumber: '', // Changed from 'phone' to 'contactNumber'
        pincode: '', // Added required field
        isActive: true,
        description: ''
      });
    } else if (org) {
      // Populate form with organization data
      setFormData({
        name: org.name || '',
        organizationId: org.organizationId || '',
        address: org.address || '',
        contactPerson: org.contactPerson || '',
        email: org.email || '',
        contactNumber: org.contactNumber || org.phone || '', // Handle both field names for compatibility
        pincode: org.pincode || '', // Added required field
        isActive: org.isActive !== undefined ? org.isActive : true,
        description: org.description || ''
      });

      setSelectedOrgId(org._id || org.id);
    }

    setFormError('');
    setDialogOpen(true);
  };

  // Function to open users dialog
  const openUsersDialog = (orgId, orgName) => {
    setSelectedOrgId(orgId);
    setUsersDialogOpen(true);
    fetchOrganizationUsers(orgId);
  };

  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!formData.name) {
      setFormError('Organization Name and ID are required');
      return;
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    setFormLoading(true);

    try {
      if (dialogMode === 'add') {
        console.log('Creating organization with data:', formData); // Debugging

        // Create new organization
        const response = await fetch('https://admin.dozemate.com/api/organizations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create organization');
        }

        const data = await response.json();
        console.log('Organization created:', data); // Debugging

        // Success - close dialog and refresh list
        setDialogOpen(false);
        showSnackbar('Organization created successfully');
        fetchOrganizations();
      } else if (dialogMode === 'edit') {
        console.log('Updating organization with data:', formData); // Debugging

        // Update organization
        const response = await fetch(apiUrl(`/api/organizations/${selectedOrgId}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update organization');
        }

        const data = await response.json();
        console.log('Organization updated:', data); // Debugging

        // Success - close dialog and refresh list
        setDialogOpen(false);
        showSnackbar('Organization updated successfully');
        fetchOrganizations();
      }
    } catch (err) {
      console.error('Error submitting form:', err);

      // Check if it's a validation error with multiple fields
      if (err.message && err.message.includes('validation failed')) {
        // Extract the specific field errors if possible
        const errorMessage = err.message.split(':').slice(1).join(':');
        setFormError(`Validation error: ${errorMessage}`);
      } else {
        setFormError(err.message || 'Failed to create organization');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Function to handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(apiUrl(`/api/organizations/${selectedOrgId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete organization');
      }

      // Close delete dialog and refresh list
      setDeleteDialogOpen(false);
      showSnackbar('Organization deleted successfully');
      fetchOrganizations();
    } catch (err) {
      console.error('Error deleting organization:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
      setDeleteDialogOpen(false);
    }
  };

  // Function to open delete confirmation dialog
  const openDeleteDialog = (orgId) => {
    setSelectedOrgId(orgId);
    setDeleteDialogOpen(true);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  return (
    <Box className="organizations-container">
      <Box className="organizations-header">
        <Typography variant="h4" className="page-title">
          Organization Management
        </Typography>

        <Box className="header-actions">
          <Box className="search-filter-container">
            <TextField
              placeholder="Search organizations..."
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

            <FormControlLabel
              control={
                <Switch
                  checked={filterActive === true}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilterActive(true);
                    } else {
                      setFilterActive(filterActive === null ? false : null);
                    }
                  }}
                  color="primary"
                />
              }
              label="Active Only"
              className="active-filter"
            />
          </Box>

          <Box className="button-container">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrganizations}
              disabled={loading}
              className="refresh-button"
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => openDialog("add")}
              className="add-button"
            >
              Add Organization
            </Button>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading organizations...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className="organizations-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Contact Number</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.length > 0 ? (
                  organizations.map((org) => (
                    <TableRow key={org._id || org.id}>
                      <TableCell>{org.organizationId}</TableCell>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>{org.contactPerson || "-"}</TableCell>
                      <TableCell>{org.email || "-"}</TableCell>
                      <TableCell>{org.contactNumber || "-"}</TableCell>
                      <TableCell>{org.address || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={org.isActive ? "Active" : "Inactive"}
                          color={org.isActive ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box className="action-buttons">
                          <Tooltip title="View Details">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog("view", org)}
                              size="small"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Users">
                            <IconButton
                              color="secondary"
                              onClick={() =>
                                openUsersDialog(org._id || org.id, org.name)
                              }
                              size="small"
                            >
                              <PeopleIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog("edit", org)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() =>
                                openDeleteDialog(org._id || org.id)
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
                      No organizations found
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

      {/* Add/Edit/View Organization Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add New Organization"
            : dialogMode === "edit"
              ? "Edit Organization"
              : "Organization Details"}
        </DialogTitle>

        <DialogContent>
          <form id="organization-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Organization Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                />
              </Grid>

              {/* <Grid item xs={12} md={6}>
                <TextField
                  name="organizationId"
                  label="Organization ID"
                  value={formData.organizationId}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view" || dialogMode === "edit"}
                  helperText={
                    dialogMode === "edit"
                      ? "Organization ID cannot be changed"
                      : ""
                  }
                />
              </Grid> */}

              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={dialogMode === "view"}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="pincode"
                  label="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="contactPerson"
                  label="Contact Person"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  fullWidth
                  disabled={dialogMode === "view"}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  disabled={dialogMode === "view"}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="contactNumber"
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  disabled={dialogMode === "view"}
                />
              </Grid>

              {dialogMode !== "view" && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={handleChange}
                        name="isActive"
                        color="primary"
                      />
                    }
                    label="Active Organization"
                  />
                </Grid>
              )}

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
              form="organization-form"
              variant="contained"
              color="primary"
              disabled={formLoading}
            >
              {formLoading ? (
                <CircularProgress size={24} />
              ) : dialogMode === "add" ? (
                "Add Organization"
              ) : (
                "Update Organization"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Organization Users Dialog */}
      <Dialog
        open={usersDialogOpen}
        onClose={() => setUsersDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Organization Users</DialogTitle>
        <DialogContent>
          {loadingUsers ? (
            <Box className="loading-container" sx={{ py: 4 }}>
              <CircularProgress />
              <Typography>Loading users...</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrgUsers.length > 0 ? (
                    selectedOrgUsers.map((user) => (
                      <TableRow key={user._id || user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.mobile || "-"}</TableCell>
                        <TableCell>{user.role || "User"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No users found for this organization
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsersDialogOpen(false)}>Close</Button>
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
            Are you sure you want to delete this organization? This action
            cannot be undone.
          </Typography>
          <Typography variant="subtitle2" color="error" sx={{ mt: 2 }}>
            Note: Organization cannot be deleted if it has associated users.
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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Organizations;