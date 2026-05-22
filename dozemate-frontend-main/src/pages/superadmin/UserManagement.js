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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  FormHelperText,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Visibility as ViewIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import './UserManagement.css';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    pincode: '',
    mobile: '',
    organizationId: '',
    dateOfBirth: null,
    gender: '',
    weight: '',
    height: '',
    waist: '',
    country: '',
    countryCode: '',
    deviceId: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [isValidDeviceId, setIsValidDeviceId] = useState(true);
  // Auth context
  const { token } = useAuth();

  
// ─ Units for Health Information
const [units, setUnits] = useState({
  weight: 'kg',   // 'kg' | 'lb'
  height: 'cm',   // 'cm' | 'in'
  waist: 'cm',   // 'cm' | 'in'
});

// Helpers
const kgToLb = (kg) => kg * 2.2046226218;
const lbToKg = (lb) => lb / 2.2046226218;
const cmToIn = (cm) => cm / 2.54;
const inToCm = (inch) => inch * 2.54;

// Convert the existing numeric value when unit changes
const handleUnitChange = (field, newUnit) => {
  setUnits((prev) => {
    const prevUnit = prev[field];
    if (prevUnit === newUnit) return prev;

    setFormData((f) => {
      const raw = parseFloat(f[field]);
      if (Number.isNaN(raw)) return f;

      let base; // store internally in metric (kg/cm)
      if (field === 'weight') {
        base = prevUnit === 'kg' ? raw : lbToKg(raw);
        return { ...f, weight: newUnit === 'kg' ? +base.toFixed(1) : +kgToLb(base).toFixed(1) };
      }
      if (field === 'height') {
        base = prevUnit === 'cm' ? raw : inToCm(raw);
        return { ...f, height: newUnit === 'cm' ? +base.toFixed(1) : +cmToIn(base).toFixed(1) };
      }
      if (field === 'waist') {
        base = prevUnit === 'cm' ? raw : inToCm(raw);
        return { ...f, waist: newUnit === 'cm' ? +base.toFixed(1) : +cmToIn(base).toFixed(1) };
      }
      return f;
    });

    return { ...prev, [field]: newUnit };
  });
};


  // Fetch organizations on component mount
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch users when organization, page, or limit changes
  useEffect(() => {
    if (selectedOrganization) {
      fetchUsers();
    } else {
      setUsers([]);
      setTotalCount(0);
    }
    // eslint-disable-next-line
  }, [selectedOrganization, page, limit]);


  useEffect(() => {
    if (formData.pincode.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
            const postOffice = data[0].PostOffice[0];
            const fullAddress = `${postOffice.Name}, ${postOffice.Block}, ${postOffice.District}, ${postOffice.State}`;

            setFormData(prev => ({
              ...prev,
              city: postOffice.District,
              address: fullAddress
            }));
          }
        })
        .catch(err => {
          console.error('Pincode lookup failed:', err);
        });
    }
  }, [formData.pincode]);


  // Function to fetch organizations
  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const response = await fetch('https://admin.dozemate.com/api/organizations', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organizations');
      }
      const responseData = await response.json();
      const orgs = responseData.data?.organizations || [];
      setOrganizations([
        { _id: 'individual', name: 'Individual Users' },
        { _id: 'all', name: 'All Users' },
        ...orgs,
      ]);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Function to fetch users based on the selected organization
  const fetchUsers = async () => {
    if (!selectedOrganization) return;
    setLoading(true);
    try {
      let url = 'https://admin.dozemate.com/api/manage/users';
      if (selectedOrganization === 'individual') {
        url += '?organizationId=null';
      } else if (selectedOrganization !== 'all') {
        url += `/organization/${selectedOrganization}`;
      }
      // Add pagination params
      const params = [];
      if (selectedOrganization === 'all' || selectedOrganization === 'individual') {
        params.push(`page=${page + 1}`);
        params.push(`limit=${limit}`);
        url += (url.includes('?') ? '&' : '?') + params.join('&');
      }
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

    const twentyYearsAgoJan1 = new Date();
    twentyYearsAgoJan1.setFullYear(twentyYearsAgoJan1.getFullYear() - 20, 0, 1);


    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      address: '',
      pincode: '',
      mobile: '',
      organizationId: '',
      dateOfBirth: twentyYearsAgoJan1,   // default as requested
      gender: '',
      // defaults (convert to current selected units)
      weight: units.weight === 'kg' ? 50 : 110,
      height: units.height === 'cm' ? 160 : 63,
      waist: units.waist === 'cm' ? 83 : 33,
      country: '',
      countryCode: '',
      deviceId: ''
    });

    setFormError('');
    setAddDialogOpen(true);
  };

  // Function to handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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
  const validateForm = () => {

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (dob > today) {
        setFormError('Date of birth cannot be in the future');
        return false;
      }
    }

    if (!formData.name || !formData.email || !formData.password ||
      !formData.address || !formData.pincode || !formData.mobile ||
      !formData.organizationId) {
      setFormError('Please fill all required fields');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setFormError('Please enter a valid 10-digit mobile number');
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
    if (!formData.deviceId || !parseDeviceId(formData.deviceId)) {
      setFormError('Please enter a valid Device ID');
      return false;
    }

    // Normalize to metric for validation
    const weightKg = formData.weight ?
      (units.weight === 'kg' ? parseFloat(formData.weight) : lbToKg(parseFloat(formData.weight))) : null;
    const heightCm = formData.height ?
      (units.height === 'cm' ? parseFloat(formData.height) : inToCm(parseFloat(formData.height))) : null;
    const waistCm = formData.waist ?
      (units.waist === 'cm' ? parseFloat(formData.waist) : inToCm(parseFloat(formData.waist))) : null;

    // Basic non-negative checks
    if ([weightKg, heightCm, waistCm].some(v => v !== null && v < 0)) {
      setFormError('Health values cannot be negative');
      return false;
    }

    // Client-specified mins
    if (weightKg !== null && weightKg < 5) {
      setFormError('Weight must be at least 5 kg');
      return false;
    }
    if (heightCm !== null && heightCm < inToCm(10)) { // 10 inches
      setFormError('Height must be at least 10 inches');
      return false;
    }
    if (waistCm !== null && waistCm < inToCm(5)) { // 5 inches
      setFormError('Waist must be at least 5 inches');
      return false;
    }

    return true;
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);

    try {
      let deviceObjectIds = [];
      if (formData.deviceId) {
        const deviceRes = await fetch(`https://admin.dozemate.com/api/manage/devices/search?q=${formData.deviceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const deviceData = await deviceRes.json();
        const device = deviceData.data?.[0];
        if (device) {
          deviceObjectIds.push(device._id);  // Push actual ObjectId
        }
      }

      // Normalize to metric for backend
      const weightKgSend = formData.weight ?
        (units.weight === 'kg' ? parseFloat(formData.weight) : lbToKg(parseFloat(formData.weight))) : undefined;
      const heightCmSend = formData.height ?
        (units.height === 'cm' ? parseFloat(formData.height) : inToCm(parseFloat(formData.height))) : undefined;
      const waistCmSend = formData.waist ?
        (units.waist === 'cm' ? parseFloat(formData.waist) : inToCm(parseFloat(formData.waist))) : undefined;

      const dataToSend = {
        ...formData,
        weight: weightKgSend,
        height: heightCmSend,
        waist: waistCmSend,
        devices: deviceObjectIds,
        role: deviceObjectIds.length > 1 ? 'admin' : 'user',
      };
      delete dataToSend.confirmPassword;
      if (dataToSend.organizationId === 'individual' || dataToSend.organizationId === '') {
        dataToSend.organizationId = null;
      }

      console.log("Data to send:", dataToSend);  // Confirm it has _id(s)
      const response = await fetch('https://admin.dozemate.com/api/manage/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
      setFormError('');
      setSelectedUser(null);
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError(err.message || 'An error occurred while creating the user');
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


  const handlePhoneChange = (e) => {
    const input = e.target.value;
    const number = parsePhoneNumberFromString(input, 'IN');
    if (number && number.isValid()) {
      setFormData(prev => ({
        ...prev,
        country: number.country,
        countryCode: number.countryCallingCode,
        mobile: number.nationalNumber,
      }));
      console.log("Parsed country:", number.country);
      console.log("Parsed country code:", number.countryCallingCode);
    }
  };


  const parseDeviceId = (deviceId) => {
    if (!deviceId || !/^\d{7}[A-Z]-[A-Z0-9]+$/.test(deviceId)) {
      return null;
    }

    const firstDigit = deviceId[0];
    const secondAndThird = deviceId.slice(1, 3);
    const fourth = deviceId[3];
    const fifth = deviceId[4];
    const sixth = deviceId[5];
    const seventh = deviceId[6];
    const letter = deviceId[7]; // 8th character
    const afterDash = deviceId.split('-')[1];

    return {
      deviceType: getDeviceTypeFromDigit(firstDigit),
      secondThird: secondAndThird,
      manufacturer: getManufacturerFromDigit(firstDigit, fourth),
      tech: getTechFromDigit(firstDigit, fifth),
      sensor: getSensorFromDigit(firstDigit, sixth),
      ports: getPortsFromDigit(firstDigit, seventh),
      subtype: letter,
      serial: afterDash
    }
  };

  const getDeviceTypeFromDigit = (digit) => {
    const map = {
      '1': 'Dozemate',
      '2': 'Sensabit',
      '3': 'Smart ring',
      '4': 'GPSmart',
      '5': 'Stethopod',
      '6': 'UWB+GPS',
      '7': 'MultiPort Device',
      '8': 'Reserved-8',
      '9': 'Reserved-9'
    };
    return map[digit] || 'Unknown';
  };



  const getManufacturerFromDigit = (firstDigit, digit) => {
    const map = {
      '1': { 'X': 'Slimiot' },
      '2': { 'X': 'Sensabit' },
      '3': { 'X': 'Dozemate' }
    };
    return map[firstDigit]?.[digit] || 'Enter Manually';
  };

  const getTechFromDigit = (firstDigit, digit) => {
    const map = {
      '1': {
        '1': 'BLE',
        '2': 'WiFi',
        '3': 'BLE+WiFi',
        '4': 'UWB',
        '5': 'NB-IoT',        // add this
        '6': 'LoRa',
        '7': 'WiFi + GSM',
        'B': 'BLE',
        'W': 'WiFi',
        'M': 'BLE+WiFi',
        'U': 'UWB',
        'G': 'GPS/GNSS'
      }
    };
    return map[firstDigit]?.[digit] || 'Unknown';
  };


  const getSensorFromDigit = (firstDigit, digit) => {
    const map = {
      '1': {
        '0': 'No sensors',
        '1': 'Temperature/Humidity',
        '2': 'IMU (Accelerometer)',
        '3': 'Temp + IMU',
        '4': 'Gas Sensor',
        '5': 'Temp + Gas',
        '6': 'IMU + Gas',
        '7': 'All Sensors',
        '8': 'Advanced Sensor Set',
        '9': 'Custom Sensor',
        'A': 'Special Sensor A',
        'B': 'Special Sensor B'
      }
      // Add other device types ('2', '3') if needed
    };
    return map[firstDigit]?.[digit] || 'Unknown';
  };


  const getPortsFromDigit = (firstDigit, digit) => {
    const map = {
      '1': {
        '0': 'No ports',
        '1': 'UART',
        '2': 'I2C',
        '3': 'SPI',
        '4': 'UART + I2C',
        '5': 'UART + SPI',
        '6': 'I2C + SPI',
        '7': 'UART + I2C + SPI',
        'U': 'UART',
        'I': 'I2C',
        'S': 'SPI',
        'B': 'UART+I2C',
        'C': 'UART+SPI',
        'D': 'I2C+SPI',
        'E': 'UART+I2C+SPI'
      }
      // Add more for other firstDigit values if applicable
    };
    return map[firstDigit]?.[digit] || 'Unknown';
  };


  return (
    <Box className="user-management-container">
      <Box className="user-management-header">
        <Typography variant="h4" className="page-title">
          <PersonIcon sx={{ mr: 1.5, verticalAlign: 'bottom' }} />
          User Management
        </Typography>
        <Box className="header-actions" sx={{
          display: 'flex',
          flexDirection: 'row !important',  // override CSS class
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}
        >
          <FormControl variant="outlined" size="small" sx={{ minWidth: 250 }}>
            <InputLabel>Select Organization</InputLabel>
            <Select
              value={selectedOrganization}
              onChange={(e) => {
                setSelectedOrganization(e.target.value);
                setPage(0);
              }}
              label="Select Organization"
              disabled={loadingOrgs}
            >
              <MenuItem value="">Select Organization</MenuItem>
              {organizations.map((org) => (
                <MenuItem key={org._id} value={org._id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrganizations}
            disabled={loadingOrgs}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            Add User
          </Button>
        </Box>
      </Box>
      {loading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading users...</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className="users-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id || user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile || '-'}</TableCell>
                      <TableCell>
                        {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {user.organizationId
                          ? organizations.find((org) => org._id === user.organizationId)?.name ||
                          'Unknown'
                          : 'Individual'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            onClick={() => openViewDialog(user)}
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No users found
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
      {/* View User Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser ? (
            <Box>
              <Typography variant="h6" sx={{ mt: 2 }}>Personal Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name"
                    value={selectedUser.name || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    value={selectedUser.email || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mobile"
                    value={selectedUser.mobile || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
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
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Gender"
                    value={selectedUser.gender ? selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1) : '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
              <Typography variant="h6" sx={{ mt: 3 }}>Address Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Address"
                    value={selectedUser.address || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Pincode"
                    value={selectedUser.pincode || ''}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
              <Typography variant="h6" sx={{ mt: 3 }}>Health Information</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Weight (kg)"
                    value={selectedUser.weight || '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Height (cm)"
                    value={selectedUser.height || '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Waist (cm)"
                    value={selectedUser.waist || '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Add User Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0',
            p: 3
          }}
        >
          <Box display="flex" alignItems="center">
            <AddIcon sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            <Typography variant="h5" fontWeight={500}>
              Add New User
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Fill in the details below to add a new user to the system.
          </Typography>
        </DialogTitle>
        <DialogContent >
          <form id="add-user-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1, p: 1 }}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  color="primary"
                  fontWeight={600}
                  sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}
                >
                  Personal Information
                </Typography>
              </Grid>
              <Grid container spacing={7}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="name"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={formError && !formData.name}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6} >
                  <TextField
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={formError && !formData.email}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={7}>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="mobile"
                    label="Mobile Number"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    onBlur={handlePhoneChange} // parse when the user finishes typing
                    fullWidth
                    required
                    error={formError && !formData.mobile}
                    helperText="Enter a valid 10-digit mobile number"
                  />

                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date of Birth"
                      value={formData.dateOfBirth}
                      onChange={handleDateChange}
                      maxDate={new Date()}  // <-- no future DOB
                      slotProps={{ textField: { fullWidth: true, InputProps: { sx: { borderRadius: '8px' } } } }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
                    Gender
                  </FormLabel>
                  <RadioGroup
                    row
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <FormControlLabel value="female" control={<Radio />} label="Female" />
                    <FormControlLabel value="male" control={<Radio />} label="Male" />
                    <FormControlLabel value="other" control={<Radio />} label="Other" />
                    <FormControlLabel value="prefer-not-to-say" control={<Radio />} label="Prefer not to say" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {/* Address Information Section */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  color="primary"
                  fontWeight={600}
                  sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}
                >
                  Address Information
                </Typography>
              </Grid>
              <Grid container spacing={7}>
                <Grid item xs={12} md={8}>
                  <TextField
                    name="address"
                    label="Address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    fullWidth
                    error={formError && !formData.address}
                    multiline
                    rows={3}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="pincode"
                    label="Pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    error={formError && !formData.pincode}
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>

              </Grid>


              <Grid container spacing={2} sx={{ mt: 1 }}>

                <Grid item xs={12} md={4}>
                  <TextField
                    name="city"
                    label="City"
                    value={formData.city || ''}
                    fullWidth
                    InputProps={{ readOnly: true, sx: { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>


              {/* Health Information Section */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  color="primary"
                  fontWeight={600}
                  sx={{ borderBottom: '2px solid #1976d2', pb: 1 }}
                >
                  Health Information (Optional)
                </Typography>
              </Grid>
              <Grid container spacing={7}>
                {/* Weight */}
                <Grid item xs={12} md={4}>
                  <Grid container spacing={1}>
                    <Grid item xs={8}>
                      <TextField
                        name="weight"
                        label={`Weight (${units.weight})`}
                        type="number"
                        inputProps={{ step: '0.1', min: 0 }}
                        value={formData.weight}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          label="Unit"
                          value={units.weight}
                          onChange={(e) => handleUnitChange('weight', e.target.value)}
                        >
                          <MenuItem value="kg">kg</MenuItem>
                          <MenuItem value="lb">lb</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Height */}
                <Grid item xs={12} md={4}>
                  <Grid container spacing={1}>
                    <Grid item xs={8}>
                      <TextField
                        name="height"
                        label={`Height (${units.height})`}
                        type="number"
                        inputProps={{ step: '0.1', min: 0 }}
                        value={formData.height}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          label="Unit"
                          value={units.height}
                          onChange={(e) => handleUnitChange('height', e.target.value)}
                        >
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="in">inch</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Waist */}
                <Grid item xs={12} md={4}>
                  <Grid container spacing={1}>
                    <Grid item xs={8}>
                      <TextField
                        name="waist"
                        label={`Waist (${units.waist})`}
                        type="number"
                        inputProps={{ step: '0.1', min: 0 }}
                        value={formData.waist}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{ sx: { borderRadius: '8px' } }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select
                          label="Unit"
                          value={units.waist}
                          onChange={(e) => handleUnitChange('waist', e.target.value)}
                        >
                          <MenuItem value="cm">cm</MenuItem>
                          <MenuItem value="in">inch</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* Organization & Security Section */}
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" fontWeight={600} sx={{ borderBottom: '2px solid #1976d2', pb: 1 }} > Organization & Security </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={formError && !formData.organizationId} >
                  <InputLabel>Organization</InputLabel>
                  <Select name="organizationId" value={formData.organizationId} onChange={handleChange} label="Organization" sx={{ borderRadius: '8px' }} >
                    {organizations.map((org) => (
                      <MenuItem key={org._id} value={org._id}>
                        {org.name}
                      </MenuItem>
                    ))}
                    <MenuItem value="">Individual (No Organization)</MenuItem>
                  </Select>
                  <FormHelperText>Select the organization for this user</FormHelperText>
                </FormControl>
              </Grid>
              <Grid container spacing={7}>
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
                    InputProps={{ sx: { borderRadius: '8px' } }}
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
                    InputProps={{ sx: { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>

              {/* Device Details */}
              <Typography variant="h6" sx={{ mt: 3 }}>Device Details</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>

                  <TextField
                    name="deviceId"
                    label="Device ID"
                    value={formData.deviceId || ''}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, deviceId: value }));

                      if (!/^\d{7}[A-Z]-[A-Z0-9]+$/.test(value)) {
                        setIsValidDeviceId(false);
                        return;
                      }

                      setIsValidDeviceId(true);

                      try {
                        const response = await fetch(`https://admin.dozemate.com/api/manage/devices/search?q=${encodeURIComponent(value)}`, {
                          method: 'GET',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });

                        const data = await response.json();
                        const device = Array.isArray(data.data) ? data.data[0] : null;

                        if (device) {
                          // Parse deviceId to get tech, sensor, etc.
                          const parsed = parseDeviceId(device.deviceId);

                          setFormData(prev => ({
                            ...prev,
                            manufacturer: device.manufacturer || '',
                            firmwareVersion: device.firmwareVersion || '',
                            location: device.location || '',
                            deviceStatus: device.status || '',
                            deviceType: parsed?.deviceType || '',
                            tech: parsed?.tech || '',
                            sensor: parsed?.sensor || '',
                            ports: parsed?.ports || ''
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            deviceType: '',
                            manufacturer: '',
                            firmwareVersion: '',
                            location: '',
                            deviceStatus: '',
                            tech: '',
                            sensor: '',
                            ports: ''
                          }));
                        }

                      } catch (err) {
                        console.error('Device fetch error:', err);
                        setFormData(prev => ({
                          ...prev,
                          deviceType: '',
                          manufacturer: '',
                          firmwareVersion: '',
                          location: '',
                          deviceStatus: '',
                          tech: '',
                          sensor: '',
                          ports: ''
                        }));
                      }
                    }}
                    fullWidth
                    required
                    InputProps={{ sx: { borderRadius: '8px' } }}
                    error={!isValidDeviceId}
                    helperText={!isValidDeviceId ? "Invalid Device ID format" : " "}
                  />


                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField label="Device Type" value={formData.deviceType || ''} fullWidth InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Manufacturer" value={formData.manufacturer || ''} fullWidth InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Technology" value={formData.tech || ''} fullWidth InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Sensor" value={formData.sensor || ''} fullWidth InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField label="Ports" value={formData.ports || ''} fullWidth InputProps={{ readOnly: true }} />
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Device Status"
                    value={
                      selectedUser?.devices && Array.isArray(selectedUser.devices)
                        ? selectedUser.devices.length > 1
                          ? 'Admin'
                          : selectedUser.devices.length === 1
                            ? 'User'
                            : '-'
                        : '-'
                    }
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>

              {/* Auto-generated System Fields */}
              <Typography variant="h6" sx={{ mt: 3 }}>System Info</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Registration Date"
                    value={selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Expiry Date"
                    value={selectedUser?.expiryDate ? new Date(selectedUser.expiryDate).toLocaleDateString() : '-'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>

              {/* Error Display */}
              {formError && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ borderRadius: '8px' }}>
                    {formError}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 3 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: '8px', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-user-form"
            variant="contained"
            color="primary"
            disabled={formLoading}
            sx={{ borderRadius: '8px', px: 4 }}
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
    </Box>
  );
};

export default UserManagement;