import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Chip, CircularProgress, Grid, InputAdornment, Snackbar,
  Tooltip, Switch, FormControlLabel, Alert, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  VisibilityOff,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './AdminManagement.css';

const AdminManagement = () => {
  // State for admins
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(null);
  const [filterOrganization, setFilterOrganization] = useState('');
  
  // Organizations list for dropdown
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false); // New state
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [selectedAdminName, setSelectedAdminName] = useState(''); // New state
  
  // Form data for adding/editing admin
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    pincode: '',
    mobile: '',
    organizationId: '',
    role: 'admin',
    isActive: true
  });

  // Password reset form data
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Password visibility state
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  
  // Form submission state
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false); // New state
  
  // Cache for organization names
  const [orgNameCache, setOrgNameCache] = useState({});
  
  // Snackbar notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Auth context
  const { token } = useAuth();
  
  // ... (keep all existing useEffect and fetch functions unchanged)
  
  // Fetch admins on component mount and when filters change
  useEffect(() => {
    fetchAdmins();
  }, [page, limit, searchQuery, filterActive, filterOrganization]);
  
  // Fetch organizations for dropdown
  useEffect(() => {
    fetchOrganizations();
  }, []);
  
  // Function to fetch admins (users with admin/superadmin role)
  const fetchAdmins = async () => {
    setLoading(true);
  
    try {
      // Build query parameters
      let queryParams = new URLSearchParams({
        page: page + 1, // API uses 1-based indexing
        limit,
      });
  
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
  
      if (filterActive !== null) {
        queryParams.append('isActive', filterActive);
      }
  
      if (filterOrganization) {
        queryParams.append('organizationId', filterOrganization);
      }
  
      // Fetch admins using the correct API endpoint
      const response = await fetch(`https://admin.dozemate.com/api/admins?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch admins');
      }
  
      const responseData = await response.json();
  
      // Extract the admins array from the response
      const admins = responseData.data?.admins || []; // Safely access the admins array
      const total = responseData.total || admins.length;
  
      setAdmins(admins); // Set the admins state
      setTotalCount(total); // Set the total count for pagination
    } catch (err) {
      console.error('Error fetching admins:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch organizations for dropdown
  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    
    try {
      const response = await fetch('https://admin.dozemate.com/api/organizations?limit=100', {
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
      const orgs = responseData.data?.organizations || 
                  responseData.organizations || 
                  responseData.data || 
                  [];
                  
      setOrganizations(orgs);
      
      // Pre-populate cache with organization names
      const cache = { ...orgNameCache };
      orgs.forEach(org => {
        cache[org._id] = org.name;
      });
      setOrgNameCache(cache);
      
    } catch (err) {
      console.error('Error fetching organizations:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
    } finally {
      setLoadingOrgs(false);
    }
  };
  
  // Function to handle opening dialog for add/edit/view
  const openDialog = (mode, admin = null) => {
    setDialogMode(mode);
    
    if (mode === 'add') {
      // Reset form data for new admin
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        pincode: '',
        mobile: '',
        organizationId: '',
        role: 'admin',
        isActive: true
      });
    } else if (admin) {
      // Populate form with admin data
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        password: '', // Don't populate password for security
        confirmPassword: '', // Don't populate confirm password for security
        address: admin.address || '',
        pincode: admin.pincode || '',
        mobile: admin.mobile || '',
        organizationId: admin.organizationId || '',
        role: admin.role || 'admin',
        isActive: admin.isActive !== undefined ? admin.isActive : true
      });
      
      setSelectedAdminId(admin._id || admin.id);
    }
    
    setFormError('');
    setDialogOpen(true);
  };

  // New function to handle opening reset password dialog
  const openResetPasswordDialog = (admin) => {
    setSelectedAdminId(admin._id || admin.id);
    setSelectedAdminName(admin.name);
    setPasswordResetData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      new: false,
      confirm: false
    });
    setFormError('');
    setResetPasswordDialogOpen(true);
  };

  // Function to handle password reset form changes
  const handlePasswordResetChange = (e) => {
    const { name, value } = e.target;
    setPasswordResetData({
      ...passwordResetData,
      [name]: value
    });
    
    // Clear error when user types
    if (formError) setFormError('');
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  // Function to handle password reset submission
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validation
    if (!passwordResetData.newPassword || !passwordResetData.confirmPassword) {
      setFormError('Both password fields are required');
      return;
    }

    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (passwordResetData.newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(passwordResetData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordResetData.newPassword);
    const hasNumbers = /\d/.test(passwordResetData.newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setFormError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setResetPasswordLoading(true);

    try {
      const response = await fetch(`https://admin.dozemate.com/api/admins/${selectedAdminId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: passwordResetData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      // Success - close dialog and show success message
      setResetPasswordDialogOpen(false);
      showSnackbar(`Password reset successfully for ${selectedAdminName}`);
      
      // Clear form data
      setPasswordResetData({
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (err) {
      console.error('Error resetting password:', err);
      setFormError(err.message || 'An error occurred while resetting password');
    } finally {
      setResetPasswordLoading(false);
    }
  };
  
  // ... (keep all other existing functions unchanged)
  
  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user types
    if (formError) setFormError('');
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
    
    // Validation
    if (!formData.name || !formData.email || !formData.address || !formData.pincode || !formData.mobile) {
      setFormError('Please fill all required fields');
      return;
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    // Password validation for new admin
    if (dialogMode === 'add') {
      if (!formData.password) {
        setFormError('Password is required');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Passwords do not match');
        return;
      }
    }
    
    // Organization validation
    if (!formData.organizationId) {
      setFormError('Organization ID is required');
      return;
    }
    
    setFormLoading(true);
    
    try {
      // Prepare the data to send
      const dataToSend = { ...formData };
      
      // Remove confirmPassword as it's not needed for API
      delete dataToSend.confirmPassword;
      
      // Remove password if it's empty for edit mode
      if (dialogMode === 'edit' && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      if (dialogMode === 'add') {
        // Create new admin using the admin-specific endpoint
        const response = await fetch('https://admin.dozemate.com/api/admins', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create admin');
        }
        
        // Success - close dialog and refresh list
        setDialogOpen(false);
        showSnackbar('Admin created successfully');
        fetchAdmins();
      } else if (dialogMode === 'edit') {
        // Update admin using admin-specific endpoint
        const response = await fetch(`https://admin.dozemate.com/api/admins/${selectedAdminId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update admin');
        }
        
        // Success - close dialog and refresh list
        setDialogOpen(false);
        showSnackbar('Admin updated successfully');
        fetchAdmins();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError(err.message || 'An error occurred while saving');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Function to handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      // Updated to use admin-specific endpoint
      const response = await fetch(`https://admin.dozemate.com/api/admins/${selectedAdminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete admin');
      }
      
      // Close delete dialog and refresh list
      setDeleteDialogOpen(false);
      showSnackbar('Admin deleted successfully');
      fetchAdmins();
    } catch (err) {
      console.error('Error deleting admin:', err);
      showSnackbar(`Error: ${err.message}`, 'error');
      setDeleteDialogOpen(false);
    }
  };
  
  // Function to open delete confirmation dialog
  const openDeleteDialog = (adminId) => {
    setSelectedAdminId(adminId);
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

  // Get password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    if (strength <= 2) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { strength, label: 'Fair', color: '#f59e0b' };
    if (strength <= 4) return { strength, label: 'Good', color: '#10b981' };
    return { strength, label: 'Strong', color: '#059669' };
  };

  const passwordStrength = getPasswordStrength(passwordResetData.newPassword);

  return (
    <Box className="admin-management-container">
      <Box className="admin-management-header">
        <Typography variant="h4" className="page-title">
          <AdminIcon sx={{ mr: 1.5, verticalAlign: 'bottom' }} />
          Admin Management
        </Typography>

        <Box className="header-actions">
          <Box className="search-filter-container">
            <TextField
              placeholder="Search admins..."
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

            <FormControl 
              variant="outlined" 
              size="small" 
              sx={{ minWidth: 200 }}
              className="org-filter"
            >
              <InputLabel>Filter by Organization</InputLabel>
              <Select
                value={filterOrganization}
                onChange={(e) => setFilterOrganization(e.target.value)}
                label="Filter by Organization"
                disabled={loadingOrgs}
              >
                <MenuItem value="">All Organizations</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org._id || org.id} value={org._id || org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
              onClick={fetchAdmins}
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
              Add Admin
            </Button>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading admins...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className="admins-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.length > 0 ? (
                  admins.map((admin) => (
                    <TableRow key={admin._id || admin.id}>
                      <TableCell>{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.mobile || '-'}</TableCell>
                      <TableCell>{admin.organizationName || '-'}</TableCell>
                      <TableCell>{admin.address || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            admin.role
                              ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1)
                              : 'Admin'
                          }
                          color={admin.role === 'superadmin' ? 'error' : 'primary'}
                          size="small"
                          icon={
                            admin.role === 'superadmin' ? (
                              <AdminIcon fontSize="small" />
                            ) : (
                              <PersonIcon fontSize="small" />
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={admin.isActive ? 'Active' : 'Active'}
                          color={admin.isActive ? 'success' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box className="action-buttons">
                          <Tooltip title="View Details">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog('view', admin)}
                              size="small"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit">
                            <IconButton
                              color="primary"
                              onClick={() => openDialog('edit', admin)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Reset Password">
                            <IconButton
                              color="warning"
                              onClick={() => openResetPasswordDialog(admin)}
                              size="small"
                            >
                              <VpnKeyIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(admin._id || admin.id)}
                              size="small"
                              disabled={admin.role === 'superadmin'}
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
                      No admins found
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

      {/* Add/Edit/View Admin Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Add New Admin"
            : dialogMode === "edit"
            ? "Edit Admin"
            : "Admin Details"}
        </DialogTitle>

        <DialogContent>
          <form id="admin-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1, p: 1 }}>
              {/* Personal Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Personal Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
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
                  required
                  disabled={dialogMode === "view"}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="mobile"
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Address Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  name="address"
                  label="Address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={dialogMode === "view"}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={4}>
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

              {/* Security */}
              {dialogMode !== "view" && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Account Security
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="password"
                      label={dialogMode === "add" ? "Password" : "New Password (leave blank to keep current)"}
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      fullWidth
                      required={dialogMode === "add"}
                      disabled={dialogMode === "view"}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      fullWidth
                      required={dialogMode === "add"}
                      disabled={dialogMode === "view"}
                    />
                  </Grid>
                </>
              )}

              {/* Organization and Role */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Organization & Role
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === "view"} required>
                  <InputLabel>Organization</InputLabel>
                  <Select
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleChange}
                    label="Organization"
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org._id || org.id} value={org._id || org.id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={dialogMode === "view"} required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    label="Role"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
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
                    label="Active Account"
                  />
                </Grid>
              )}

              {formError && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {formError}
                  </Alert>
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
              form="admin-form"
              variant="contained"
              color="primary"
              disabled={formLoading}
            >
              {formLoading ? (
                <CircularProgress size={24} />
              ) : dialogMode === "add" ? (
                "Add Admin"
              ) : (
                "Update Admin"
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VpnKeyIcon color="warning" />
            Reset Password for {selectedAdminName}
          </Box>
        </DialogTitle>

        <DialogContent>
          <form id="password-reset-form" onSubmit={handlePasswordResetSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter a new password for this admin. The admin will need to use this new password to log in.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="newPassword"
                  label="New Password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordResetData.newPassword}
                  onChange={handlePasswordResetChange}
                  fullWidth
                  required
                  disabled={resetPasswordLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                          disabled={resetPasswordLoading}
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {/* Password Strength Indicator */}
              {passwordResetData.newPassword && (
                <Grid item xs={12}>
                  <Box sx={{ mb: 1 }}>
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: 4, 
                        backgroundColor: '#e5e7eb', 
                        borderRadius: 2,
                        overflow: 'hidden',
                        mb: 1
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          height: '100%',
                          backgroundColor: passwordStrength.color,
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ color: passwordStrength.color, fontWeight: 500 }}
                    >
                      Password Strength: {passwordStrength.label}
                    </Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordResetData.confirmPassword}
                  onChange={handlePasswordResetChange}
                  fullWidth
                  required
                  disabled={resetPasswordLoading}
                  error={passwordResetData.confirmPassword && passwordResetData.newPassword !== passwordResetData.confirmPassword}
                  helperText={
                    passwordResetData.confirmPassword && passwordResetData.newPassword !== passwordResetData.confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                          disabled={resetPasswordLoading}
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {/* Password Requirements */}
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(243, 244, 246, 0.8)', 
                  borderRadius: 1,
                  border: '1px solid rgba(209, 213, 219, 0.5)'
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Password Requirements:
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    • At least 6 characters long
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    • Contains uppercase and lowercase letters
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    • Contains at least one number
                  </Typography>
                </Box>
              </Grid>

              {formError && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    {formError}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setResetPasswordDialogOpen(false)}
            disabled={resetPasswordLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="password-reset-form"
            variant="contained"
            color="warning"
            disabled={resetPasswordLoading || !passwordResetData.newPassword || !passwordResetData.confirmPassword}
            startIcon={resetPasswordLoading ? <CircularProgress size={20} /> : <LockIcon />}
          >
            {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
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
            Are you sure you want to delete this admin? This action cannot be undone.
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

export default AdminManagement;