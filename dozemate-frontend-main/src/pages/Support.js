import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Phone as PhoneIcon, 
  Email as EmailIcon,
  Send as SendIcon,
  SupportAgent as SupportIcon,
  QuestionAnswer as FAQIcon,
  KeyboardArrowRight as ArrowIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import './Support.css';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    
    // Show success message
    setSnackbar({
      open: true,
      message: 'Your message has been sent! Our team will get back to you soon.',
      severity: 'success'
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  return (
    <Container maxWidth="lg" className="support-container">
      <Box className="page-header">
        <Typography variant="h4" component="h1" className="page-title">
          <SupportIcon className="page-icon" /> 
          Support & Help
        </Typography>
        <Typography variant="subtitle1" className="subtitle">
          We're here to help you with any questions or issues you might have. Our dedicated support team is ready to assist you.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Information Cards */}
        <Grid item xs={12} md={4}>
          <Card className="contact-card">
            <CardContent>
              <Box className="icon-box">
                <PhoneIcon className="contact-icon" />
              </Box>
              <Typography variant="h5" component="h2" align="center" className="contact-title">
                Call Us
              </Typography>
              <Typography variant="body1" align="center" className="contact-text">
                Our support team is available during business hours
              </Typography>
              <Typography variant="h6" align="center" className="contact-info">
                (+91) 9310035724
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="contact-card">
            <CardContent>
              <Box className="icon-box">
                <EmailIcon className="contact-icon" />
              </Box>
              <Typography variant="h5" component="h2" align="center" className="contact-title">
                Email Us
              </Typography>
              <Typography variant="body1" align="center" className="contact-text">
                Send us an email and we'll respond as soon as possible
              </Typography>
              <Typography variant="h6" align="center" className="contact-info">
                plawat@slimiot.com
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="contact-card">
            <CardContent>
              <Box className="icon-box">
                <BugIcon className="contact-icon" />
              </Box>
              <Typography variant="h5" component="h2" align="center" className="contact-title">
                Report Bug
              </Typography>
              <Typography variant="body1" align="center" className="contact-text">
                Found a bug? Report it directly to our development team
              </Typography>
              <Typography variant="h6" align="center" className="contact-info">
                hkchaurasia2@gmail.com
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contact Form Section */}
      <Paper elevation={3} className="form-section">
        <Box className="section-header">
          <SupportIcon className="section-icon" />
          <Typography variant="h5" component="h2" className="section-title">
            Contact Us Directly
          </Typography>
        </Box>
        
        <Divider className="section-divider" />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Your Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
                className="form-field"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Your Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                className="form-field"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                variant="outlined"
                className="form-field"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                multiline
                rows={4}
                variant="outlined"
                className="form-field"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={<SendIcon />}
                className="submit-button"
              >
                Send Message
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* FAQ Section */}
      <Paper elevation={3} className="faq-section">
        <Box className="section-header">
          <FAQIcon className="section-icon" />
          <Typography variant="h5" component="h2" className="section-title">
            Frequently Asked Questions
          </Typography>
        </Box>
        
        <Divider className="section-divider" />
        
        <Box className="faq-item">
          <Typography variant="h6" className="faq-question">
            How do I add a new device?
          </Typography>
          <Typography variant="body1" className="faq-answer">
            Navigate to the "My Devices" page and click on "Assign Device". Enter your device ID and click submit.
          </Typography>
        </Box>
        
        <Box className="faq-item">
          <Typography variant="h6" className="faq-question">
            How can I change my account information?
          </Typography>
          <Typography variant="body1" className="faq-answer">
            Go to your profile page by clicking on your avatar in the top-right corner and selecting "Profile". You can edit your information there.
          </Typography>
        </Box>
        
        <Box className="faq-item">
          <Typography variant="h6" className="faq-question">
            What should I do if my device is not responding?
          </Typography>
          <Typography variant="body1" className="faq-answer">
            First, check if the device is properly connected to power and network. If the issue persists, try removing and adding the device again.
          </Typography>
        </Box>

        <Box className="faq-item">
          <Typography variant="h6" className="faq-question">
            How do I report a bug or technical issue?
          </Typography>
          <Typography variant="body1" className="faq-answer">
            If you encounter any bugs or technical issues, please email our development team directly at hkchaurasia2@gmail.com with detailed information about the problem, including steps to reproduce it.
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          endIcon={<ArrowIcon />}
          className="all-faqs-button"
        >
          View All FAQs
        </Button>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        className="feedback-snackbar"
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          className="feedback-alert"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Support;