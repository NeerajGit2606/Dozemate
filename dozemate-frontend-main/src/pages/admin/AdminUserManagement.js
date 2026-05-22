import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  CircularProgress,
  Grid,
  Tooltip,
  Alert,
  FormHelperText,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Visibility as ViewIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './AdminUserManagement.css';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [organizationId, setOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    pincode: '',
    mobile: '',
    dateOfBirth: null,
    gender: '',
    weight: '',
    height: '',
    waist: '',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [formError, setFormError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Menu states for actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowUser, setSelectedRowUser] = useState(null);

  // Auth context
  const { token } = useAuth();

  // Get admin's organization on component mount
  useEffect(() => {
    fetchAdminOrganization();
  }, []);

  // Fetch users when organization is fetched or page/limit changes
  useEffect(() => {
    if (organizationId) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [organizationId, page, limit]);

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

  // Function to fetch users for admin's organization
  const fetchUsers = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const url = `https://admin.dozemate.com/api/manage/users/organization/${organizationId}?page=${page + 1}&limit=${limit}`;
      const response = await fetch(url, {
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
      
      // Accept both array and object for data
      let usersArr = [];
      let total = 0;
      if (Array.isArray(responseData.data)) {
        usersArr = responseData.data;
        total = responseData.total || usersArr.length;
      } else if (responseData.data?.users) {
        usersArr = responseData.data.users;
        total = responseData.total || usersArr.length;
      }
      setUsers(usersArr);
      setTotalCount(total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Function to open the view dialog
  const openViewDialog = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  // Function to close the dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Function to open add user dialog
  const openAddDialog = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      address: '',
      pincode: '',
      mobile: '',
      dateOfBirth: null,
      gender: '',
      weight: '',
      height: '',
      waist: '',
    });
    setFormError('');
    setAddDialogOpen(true);
  };

  // Function to open edit user dialog
  const openEditDialog = (user) => {
    setUserToEdit(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      address: user.address || '',
      pincode: user.pincode || '',
      mobile: user.mobile || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
      gender: user.gender || '',
      weight: user.weight || '',
      height: user.height || '',
      waist: user.waist || '',
    });
    setFormError('');
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // Function to open change password dialog
  const openPasswordDialog = (user) => {
    setUserToChangePassword(user);
    setPasswordData({
      password: '',
      confirmPassword: '',
    });
    setPasswordError('');
    setPasswordDialogOpen(true);
    handleMenuClose();
  };

  // Function to open delete confirmation dialog
  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Function to handle menu click
  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowUser(user);
  };

  // Function to close menu
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowUser(null);
  };

  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: date
    }));
  };

  // Function to validate form data
  const validateForm = (isEdit = false) => {
    if (!formData.name || !formData.email || !formData.address || !formData.pincode || !formData.mobile) {
      setFormError('Please fill all required fields');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    if (!isEdit && !formData.password) {
      setFormError('Password is required');
      return false;
    }
    
    if (!isEdit && formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    if (!/^\d+$/.test(formData.mobile) || formData.mobile.length < 10) {
      setFormError('Please enter a valid mobile number');
      return false;
    }
    
    if (!/^\d+$/.test(formData.pincode)) {
      setFormError('Pincode must be numeric');
      return false;
    }
    
    if (formData.weight && !/^\d+(\.\d+)?$/.test(formData.weight)) {
      setFormError('Weight must be a valid number');
      return false;
    }
    
    if (formData.height && !/^\d+(\.\d+)?$/.test(formData.height)) {
      setFormError('Height must be a valid number');
      return false;
    }
    
    if (formData.waist && !/^\d+(\.\d+)?$/.test(formData.waist)) {
      setFormError('Waist must be a valid number');
      return false;
    }
    
    return true;
  };

  // Function to validate password data
  const validatePassword = () => {
    if (!passwordData.password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (passwordData.password !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    if (passwordData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  // Function to handle form submission for adding user
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setFormLoading(true);
    try {
      const dataToSend = {
        ...formData,
        role: 'user',
        organizationId: organizationId, // Always use admin's organization
      };
      delete dataToSend.confirmPassword;
      
      const response = await fetch('https://admin.dozemate.com/api/manage/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      setAddDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError(err.message || 'An error occurred while creating the user');
    } finally {
      setFormLoading(false);
    }
  };

  // Function to handle form submission for editing user
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) {
      return;
    }
    setFormLoading(true);
    try {
      const dataToSend = {
        ...formData,
        organizationId: organizationId, // Ensure organization doesn't change
      };
      
      const response = await fetch(`https://admin.dozemate.com/api/manage/users/${userToEdit._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      setEditDialogOpen(false);
      setUserToEdit(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setFormError(err.message || 'An error occurred while updating the user');
    } finally {
      setFormLoading(false);
    }
  };

  // Function to handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) {
      return;
    }
    setFormLoading(true);
    try {
      const dataToSend = {
        password: passwordData.password,
      };
      
      const response = await fetch(`https://admin.dozemate.com/api/manage/users/${userToChangePassword._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      setPasswordDialogOpen(false);
      setUserToChangePassword(null);
      // No need to refresh users list for password change
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err.message || 'An error occurred while updating the password');
    } finally {
      setFormLoading(false);
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setFormLoading(true);
    try {
      const response = await fetch(`https://admin.dozemate.com/api/manage/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setFormError(err.message || 'An error occurred while deleting the user');
    } finally {
      setFormLoading(false);
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box className="admin-user-management-container">
      <Box className="admin-user-management-header">
        <Box className="admin-user-management-title-section">
          <Typography variant="h4" className="admin-page-title">
            <PersonIcon sx={{ mr: 1.5, verticalAlign: 'bottom' }} />
            User Management
          </Typography>
          <Typography variant="subtitle1" className="admin-organization-subtitle">
            Managing users for: <span className="admin-org-name">{organizationName}</span>
          </Typography>
        </Box>
        <Box className="admin-header-actions">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
            className="admin-refresh-btn"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            className="admin-add-btn"
          >
            Add User
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box className="admin-loading-container">
          <CircularProgress />
          <Typography>Loading users...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className="admin-users-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id || user.id} className="admin-user-row">
                      <TableCell className="admin-user-name">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile || '-'}</TableCell>
                      <TableCell>
                        {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => openViewDialog(user)}
                            size="small"
                            className="admin-view-btn"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            onClick={(e) => handleMenuClick(e, user)}
                            size="small"
                            className="admin-more-btn"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="admin-no-users">
                      No users found in your organization
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            className="admin-actions-menu"
          >
            <MenuItem onClick={() => openEditDialog(selectedRowUser)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit User</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => openPasswordDialog(selectedRowUser)}>
              <ListItemIcon>
                <LockIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Change Password</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => openDeleteDialog(selectedRowUser)} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete User</ListItemText>
            </MenuItem>
          </Menu>
          
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

      {/* View User Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth className="admin-view-dialog">
        <DialogTitle className="admin-dialog-title">User Details</DialogTitle>
        <DialogContent className="admin-dialog-content">
          {selectedUser ? (
            <Box>
              <Typography variant="h6" className="admin-section-title">Personal Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name"
                    value={selectedUser.name || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    value={selectedUser.email || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mobile"
                    value={selectedUser.mobile || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date of Birth"
                    value={
                      selectedUser.dateOfBirth
                        ? new Date(selectedUser.dateOfBirth).toLocaleDateString()
                        : '-'
                    }
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Gender"
                    value={selectedUser.gender ? selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1) : '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Role"
                    value={selectedUser.role ? selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1) : '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
              </Grid>
              <Typography variant="h6" className="admin-section-title" sx={{ mt: 3 }}>Address Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Address"
                    value={selectedUser.address || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    multiline
                    rows={2}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Pincode"
                    value={selectedUser.pincode || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
              </Grid>
              <Typography variant="h6" className="admin-section-title" sx={{ mt: 3 }}>Health Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Weight (kg)"
                    value={selectedUser.weight || '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Height (cm)"
                    value={selectedUser.height || '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Waist (cm)"
                    value={selectedUser.waist || '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    className="admin-readonly-field"
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions className="admin-dialog-actions">
          <Button onClick={closeDialog} className="admin-close-btn">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="admin-add-dialog"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle className="admin-add-dialog-title">
          <Box display="flex" alignItems="center">
            <AddIcon sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            <Box>
              <Typography variant="h5" fontWeight={500}>
                Add New User
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Adding user to: <strong>{organizationName}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent className="admin-add-dialog-content">
          <form id="admin-add-user-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1, p: 1 }}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
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
                  error={formError && !formData.name}
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={formError && !formData.email}
                  className="admin-form-field"
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
                  error={formError && !formData.mobile}
                  helperText="Enter a valid 10-digit mobile number"
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        className="admin-form-field"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <FormLabel component="legend" className="admin-form-label">
                  Gender
                </FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="admin-radio-group"
                >
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                  <FormControlLabel value="prefer-not-to-say" control={<Radio />} label="Prefer not to say" />
                </RadioGroup>
              </Grid>

              {/* Address Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
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
                  error={formError && !formData.address}
                  multiline
                  rows={3}
                  className="admin-form-field"
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
                  error={formError && !formData.pincode}
                  className="admin-form-field"
                />
              </Grid>

              {/* Health Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
                  Health Information (Optional)
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="weight"
                  label="Weight (kg)"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={formData.weight}
                  onChange={handleChange}
                  fullWidth
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="height"
                  label="Height (cm)"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  fullWidth
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="waist"
                  label="Waist (cm)"
                  type="number"
                  value={formData.waist}
                  onChange={handleChange}
                  fullWidth
                  className="admin-form-field"
                />
              </Grid>

              {/* Security Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
                  Security
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={formError && !formData.password}
                  className="admin-form-field"
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
                  required
                  error={formError && (formData.password !== formData.confirmPassword)}
                  helperText={
                    formData.password !== formData.confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                  className="admin-form-field"
                />
              </Grid>

              {/* Error Display */}
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
        <DialogActions className="admin-add-dialog-actions">
          <Button
            onClick={() => setAddDialogOpen(false)}
            variant="outlined"
            className="admin-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-add-user-form"
            variant="contained"
            color="primary"
            disabled={formLoading}
            className="admin-submit-btn"
          >
            {formLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="admin-edit-dialog"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle className="admin-edit-dialog-title">
          <Box display="flex" alignItems="center">
            <EditIcon sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            <Box>
              <Typography variant="h5" fontWeight={500}>
                Edit User
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Editing: <strong>{userToEdit?.name}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent className="admin-edit-dialog-content">
          <form id="admin-edit-user-form" onSubmit={handleEditSubmit}>
            <Grid container spacing={2} sx={{ mt: 1, p: 1 }}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
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
                  error={formError && !formData.name}
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={formError && !formData.email}
                  className="admin-form-field"
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
                  error={formError && !formData.mobile}
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date of Birth"
                    value={formData.dateOfBirth}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        className="admin-form-field"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <FormLabel component="legend" className="admin-form-label">
                  Gender
                </FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="admin-radio-group"
                >
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                  <FormControlLabel value="prefer-not-to-say" control={<Radio />} label="Prefer not to say" />
                </RadioGroup>
              </Grid>

              {/* Address Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
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
                  error={formError && !formData.address}
                  multiline
                  rows={3}
                  className="admin-form-field"
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
                  error={formError && !formData.pincode}
                  className="admin-form-field"
                />
              </Grid>

              {/* Health Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" className="admin-form-section-title">
                  Health Information (Optional)
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="weight"
                  label="Weight (kg)"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  value={formData.weight}
                  onChange={handleChange}
                  fullWidth
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="height"
                  label="Height (cm)"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  fullWidth
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="waist"
                  label="Waist (cm)"
                  type="number"
                  value={formData.waist}
                  onChange={handleChange}
                  fullWidth
                  className="admin-form-field"
                />
              </Grid>

              {/* Error Display */}
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
        <DialogActions className="admin-edit-dialog-actions">
          <Button
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            className="admin-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-edit-user-form"
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
            ) : 'Update User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="admin-password-dialog"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle className="admin-password-dialog-title">
          <Box display="flex" alignItems="center">
            <LockIcon sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            <Box>
              <Typography variant="h5" fontWeight={500}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Changing password for: <strong>{userToChangePassword?.name}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent className="admin-password-dialog-content">
          <form id="admin-password-form" onSubmit={handlePasswordSubmit}>
            <Grid container spacing={2} sx={{ mt: 1, p: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label="New Password"
                  type="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  fullWidth
                  required
                  error={passwordError && !passwordData.password}
                  helperText="Password must be at least 6 characters long"
                  className="admin-form-field"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  fullWidth
                  required
                  error={passwordError && (passwordData.password !== passwordData.confirmPassword)}
                  helperText={
                    passwordData.password !== passwordData.confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                  className="admin-form-field"
                />
              </Grid>

              {/* Error Display */}
              {passwordError && (
                <Grid item xs={12}>
                  <Alert severity="error" className="admin-form-error">
                    {passwordError}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>
        <DialogActions className="admin-password-dialog-actions">
          <Button
            onClick={() => setPasswordDialogOpen(false)}
            variant="outlined"
            className="admin-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="admin-password-form"
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
            ) : 'Update Password'}
          </Button>
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
            <WarningIcon sx={{ mr: 1.5, color: '#f44336', fontSize: '1.8rem' }} />
            <Typography variant="h5" fontWeight={500}>
              Confirm Delete
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the user <strong>{userToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All user data and associated information will be permanently removed.
          </Typography>
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
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
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={formLoading}
            className="admin-delete-btn"
          >
            {formLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Deleting...
              </>
            ) : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;