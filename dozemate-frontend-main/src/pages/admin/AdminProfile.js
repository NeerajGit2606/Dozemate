import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Box,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';

import { 
  Edit, 
  Save, 
  Delete, 
  UploadFile, 
  Person, 
  Warning,
  MonitorWeight,
  Height,
  Straighten,
  Cake,
  Wc,
  Business,
  Lock // Add this import
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import './AdminProfile.css';
const API_BASE = "/api";
const AdminProfile = () => {
  const navigate = useNavigate(); // Add this line
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [organizationName, setOrganizationName] = useState('');

  const { token } = useAuth();

  // ...existing useEffect and functions remain the same...

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (profile?.organizationId) {
      fetchOrganizationName(profile.organizationId);
    }
  }, [profile?.organizationId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('${API_BASE}/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          address: data.data.address || '',
          pincode: data.data.pincode || '',
          mobile: data.data.mobile || '',
          dateOfBirth: data.data.dateOfBirth || null,
          gender: data.data.gender || "",
          waist: data.data.waist || "",
          weight: data.data.weight || "",
          height: data.data.height || ""
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationName = async (orgId) => {
    try {
      const response = await fetch('${API_BASE}/organizations', {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Add this function to handle navigation to reset password page
  const handleChangePassword = () => {
    navigate('/reset-password');
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      
      // Validate file size (under 5MB)
      if (selectedImage.size > 5 * 1024 * 1024) {
        setMessage({ text: 'Image size must be less than 5MB', type: 'error' });
        return;
      }
      
      // Validate file type
      if (!selectedImage.type.match(/image\/(jpeg|jpg|png|gif)/)) {
        setMessage({ text: 'Only image files (JPG, PNG, GIF) are allowed', type: 'error' });
        return;
      }

      setImage(selectedImage);
      setPreviewImage(URL.createObjectURL(selectedImage));
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    const formDataImage = new FormData();
    formDataImage.append('profileImage', image);

    try {
      const response = await fetch('${API_BASE}/user/profile/image', {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataImage
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Profile image updated successfully", type: "success" });
        fetchUserProfile();
        setImage(null);
        setPreviewImage(null);
      } else {
        setMessage({ text: data.message || "Error updating profile image", type: "error" });
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setMessage({ text: "Failed to upload image", type: "error" });
    }
  };

  const saveProfile = async () => {
    try {
      const response = await fetch('${API_BASE}/user/profile', {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Profile updated successfully", type: "success" });
        setEditMode(false);
        fetchUserProfile();
      } else {
        setMessage({ text: data.message || "Error updating profile", type: "error" });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setMessage({ text: "Failed to save profile", type: "error" });
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch('${API_BASE}/user/profile', {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Clear localStorage and redirect to login page
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        const data = await response.json();
        setMessage({ text: data.message || "Failed to delete account", type: "error" });
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setMessage({ text: "Failed to delete account", type: "error" });
    }
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Box className="profile-loading">
        <CircularProgress className="loading-spinner" />
        <Typography variant="body1">Loading your profile...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" className="profile-container">
        <Alert severity="error" className="profile-alert">{error}</Alert>
      </Container>
    );
  }
  
  if (!profile) {
    return (
      <Container maxWidth="md" className="profile-container">
        <Alert severity="error" className="profile-alert">Profile not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="profile-container">
      <Box className="profile-header">
        <Typography variant="h4" component="h1" className="profile-title">
          <Person className="profile-icon" /> 
          Admin Profile
        </Typography>
        <Typography variant="subtitle1" className="profile-subtitle">
          Manage your personal information and admin account settings
        </Typography>
      </Box>
      
      {message.text && (
        <Alert 
          severity={message.type} 
          className="profile-alert" 
          onClose={() => setMessage({ text: '', type: 'info' })}
        >
          {message.text}
        </Alert>
      )}

      <Paper elevation={3} className="profile-paper">
        <Box className="profile-avatar-section">
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar 
                src={previewImage || (profile.profileImage && `https://admin.dozemate.com${profile.profileImage}`)} 
                alt={profile.name} 
                sx={{ width: 100, height: 100 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" className="profile-name">{profile.name}</Typography>
              <Typography variant="subtitle1" className="profile-email">{profile.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip 
                  label={profile.role || "Admin"} 
                  className="profile-role" 
                  size="small" 
                />
                {organizationName && (
                  <Chip 
                    icon={<Business />}
                    label={organizationName} 
                    variant="outlined"
                    size="small" 
                  />
                )}
              </Box>
            </Grid>
            <Grid item className="edit-profile-button-container">
              {!editMode ? (
                <Button 
                  variant="contained" 
                  startIcon={<Edit />}
                  onClick={() => setEditMode(true)}
                  className="edit-button"
                >
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  startIcon={<Save />}
                  onClick={saveProfile}
                  className="save-button"
                >
                  Save Changes
                </Button>
              )}
            </Grid>
          </Grid>

          {editMode && (
            <Box className="image-upload-container">
              <input
                type="file"
                id="profile-image-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <label htmlFor="profile-image-input">
                <Button 
                  variant="outlined" 
                  component="span"
                  startIcon={<UploadFile />}
                  className="image-upload-button"
                >
                  Select Image
                </Button>
              </label>
              {image && (
                <Button 
                  variant="contained"
                  onClick={uploadImage}
                  className="upload-button"
                >
                  Upload Image
                </Button>
              )}
            </Box>
          )}
        </Box>

        <Divider className="profile-divider" />
        
        <Box className="profile-sections">
          <Typography variant="h6" className="section-heading">
            Personal Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="MuiTextField-root"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="MuiTextField-root"
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={formData.mobile || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="MuiTextField-root"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth ? formData.dateOfBirth.substring(0, 10) : ''}
                onChange={handleChange}
                disabled={!editMode}
                className="MuiTextField-root"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Cake />
                    </InputAdornment>
                  )
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!editMode} className="MuiFormControl-root">
                <InputLabel id="gender-select-label">Gender</InputLabel>
                <Select
                  labelId="gender-select-label"
                  id="gender-select"
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  label="Gender"
                  startAdornment={
                    <InputAdornment position="start">
                      <Wc />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="MuiTextField-root"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                disabled={!editMode}
                className="MuiTextField-root"
                variant="outlined"
              />
            </Grid>
          </Grid>

          {/* Security Settings Section */}
          <Typography variant="h6" className="section-heading" sx={{ mt: 4 }}>
            Security Settings
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<Lock />}
              onClick={handleChangePassword}
              className="edit-button"
              sx={{ 
                borderColor: '#2563eb',
                color: '#2563eb',
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.05)',
                  borderColor: '#1d4ed8'
                }
              }}
            >
              Change Password
            </Button>
          </Box>
        </Box>

        {editMode && <Divider className="profile-divider" />}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
            className="delete-button"
          >
            Delete Account
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle className="delete-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Warning sx={{ marginRight: 1, color: '#dc2626' }} />
            Delete Account
          </Box>
        </DialogTitle>
        <DialogContent className="delete-dialog-content">
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone.
            All your data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            className="cancel-dialog-button"
          >
            Cancel
          </Button>
          <Button 
            onClick={deleteAccount} 
            className="confirm-delete-button"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminProfile;