import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';

import {
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  Save,
  ArrowBack
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import './ResetPassword.css';
import { apiUrl } from '../config/api';


const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  // State management
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });

  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  // Handle password form changes
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  // Navigate back to profile
  const goBack = () => {
    navigate(-1);
  };


  const updatePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ text: "Both password fields are required", type: "error" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }
      setLoading(true);
    setMessage({ text: '', type: 'info' });
    try {
      const response = await fetch(apiUrl(`/api/auth/reset/${token}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordData.newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: '✅ Password reset successful. Redirecting to login…', type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ text: data.message || 'Failed to reset password', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
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

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <Container maxWidth="sm" className="reset-password-container">
      <Paper elevation={3} className="reset-password-paper">
        {/* Header */}
        <Box className="reset-password-header">
          <Security className="reset-password-icon" />
          <Typography variant="h4" component="h1" className="reset-password-title">
            Change Password
          </Typography>
          <Typography variant="subtitle1" className="reset-password-subtitle">
            Update your account password for better security
          </Typography>
        </Box>

        <Divider className="reset-password-divider" />

        {/* Message Alert */}
        {message.text && (
          <Alert
            severity={message.type}
            className="reset-password-alert"
            onClose={() => setMessage({ text: '', type: 'info' })}
          >
            {message.text}
          </Alert>
        )}

        {/* Password Form */}
        <Box className="reset-password-content">
          <Typography variant="h6" className="section-heading">
            Security Settings
          </Typography>


          <TextField
            fullWidth
            label="New Password"
            name="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            disabled={loading}
            className="reset-password-input"
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('new')}
                    edge="end"
                    disabled={loading}
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Password Strength Indicator */}
          {passwordData.newPassword && (
            <Box className="password-strength">
              <Box className="strength-bar">
                <Box
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                    backgroundColor: passwordStrength.color
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                style={{ color: passwordStrength.color }}
                className="strength-label"
              >
                Password Strength: {passwordStrength.label}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            disabled={loading}
            className="reset-password-input"
            variant="outlined"
            error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
            helperText={
              passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                ? 'Passwords do not match'
                : ''
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('confirm')}
                    edge="end"
                    disabled={loading}
                  >
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Password Requirements */}
          <Box className="password-requirements">
            <Typography variant="caption" className="requirements-title">
              Password Requirements:
            </Typography>
            <Typography variant="caption" className="requirement-item">
              • At least 6 characters long
            </Typography>
            <Typography variant="caption" className="requirement-item">
              • Contains uppercase and lowercase letters
            </Typography>
            <Typography variant="caption" className="requirement-item">
              • Contains at least one number
            </Typography>
          </Box>

          <Box className="reset-password-actions">
            <Button
              variant="outlined"
              onClick={goBack}
              disabled={loading}
              startIcon={<ArrowBack />}
              className="back-button"
            >
              Go Back
            </Button>

            <Button
              variant="contained"
              onClick={updatePassword}
              disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="save-button"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>

          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;