import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Divider,
  Button
} from '@mui/material';
import {
  Lightbulb as InnovationIcon,
  HealthAndSafety as HealthIcon,
  Build as EngineeringIcon,
  BusinessCenter as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Psychology as MindIcon,
  Handshake as PartnershipIcon
} from '@mui/icons-material';
import './ContactUs.css';
import { Link as RouterLink } from "react-router-dom";
import Link from "@mui/material/Link";


const AboutUs = () => {
  return (
    <Container maxWidth="lg" className="aboutus-container">
      {/* Header Section */}
      <Box className="page-header">
        <Typography variant="h4" component="h1" className="page-title">
          <InfoIcon className="page-icon" />
          About SlimIoT Technologies
        </Typography>
        <Typography variant="subtitle1" className="subtitle">
          Innovating for a healthier tomorrow
        </Typography>
        <Divider className="section-divider" />
      </Box>

      {/* Company Introduction */}
      <Paper elevation={3} className="content-section">
        <Typography variant="h5" gutterBottom className="section-title">
          <InfoIcon className="section-icon" />
          Who We Are
        </Typography>
        <Typography variant="body1" paragraph>
          We are an innovative startup based in India, involved in the innovation and manufacturing of electronic devices mainly in the area of health. Our mission is to leverage technology to improve healthcare accessibility and outcomes.
        </Typography>
        <Typography variant="body1">
          With a focus on Internet of Things (IoT) solutions, we develop products that connect the physical and digital worlds to provide meaningful health insights and interventions.
        </Typography>
      </Paper>

      {/* Core Competencies */}
      <Typography variant="h5" gutterBottom className="section-title" sx={{ mb: 3 }}>
        <MindIcon className="section-icon" />
        Our Core Competencies
      </Typography>
      <Grid container spacing={4} className="feature-grid">
        <Grid item xs={12} md={6} lg={3}>
          <Paper className="feature-box">
            <Box className="icon-container">
              <HealthIcon className="feature-icon" />
            </Box>
            <Typography variant="h6" gutterBottom className="feature-title">
              Healthcare Devices
            </Typography>
            <Typography variant="body2" className="feature-text">
              Innovative medical and health monitoring devices with patented technologies
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper className="feature-box">
            <Box className="icon-container">
              <EngineeringIcon className="feature-icon" />
            </Box>
            <Typography variant="h6" gutterBottom className="feature-title">
              Hardware & Firmware
            </Typography>
            <Typography variant="body2" className="feature-text">
              End-to-end development of electronic hardware and embedded firmware solutions
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper className="feature-box">
            <Box className="icon-container">
              <InnovationIcon className="feature-icon" />
            </Box>
            <Typography variant="h6" gutterBottom className="feature-title">
              Software Development
            </Typography>
            <Typography variant="body2" className="feature-text">
              Custom software solutions including web and mobile applications
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper className="feature-box">
            <Box className="icon-container">
              <BusinessIcon className="feature-icon" />
            </Box>
            <Typography variant="h6" gutterBottom className="feature-title">
              Strategic Partnerships
            </Typography>
            <Typography variant="body2" className="feature-text">
              Collaborative approach with options for equity participation in promising ventures
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Innovation and Patents */}
      <Paper elevation={3} className="content-section">
        <Typography variant="h5" gutterBottom className="section-title">
          <InnovationIcon className="section-icon" />
          Innovation & Intellectual Property
        </Typography>
        <Typography variant="body1" paragraph>
          Innovation is at the core of what we do. We hold patents for several of our healthcare devices and have additional patents in the pipeline. Our R&D team continuously works on developing novel solutions that address real-world health challenges.
        </Typography>
        <Typography variant="body1">
          We pride ourselves on creating unique technologies that combine hardware excellence with intelligent software to deliver seamless user experiences.
        </Typography>
      </Paper>

      {/* Project Approach */}
      <Paper elevation={3} className="content-section">
        <Typography variant="h5" gutterBottom className="section-title">
          <PartnershipIcon className="section-icon" />
          Our Project Approach
        </Typography>
        <Typography variant="body1" paragraph>
          We are selective in the projects we undertake, focusing on initiatives that align with our expertise and vision. For projects of mutual interest, we offer flexible engagement models including:
        </Typography>
        <Box component="ul" className="approach-list">
          <Typography component="li" variant="body1" paragraph className="approach-list-item">
            Traditional service-based development
          </Typography>
          <Typography component="li" variant="body1" paragraph className="approach-list-item">
            Co-development partnerships
          </Typography>
          <Typography component="li" variant="body1" paragraph className="approach-list-item">
            Equity participation at mutually agreed terms
          </Typography>
        </Box>
        <Typography variant="body1">
          This approach allows us to be deeply invested in the success of the projects we work on, going beyond the typical client-vendor relationship.
        </Typography>
      </Paper>

      {/* Contact Information */}
      <Paper elevation={3} className="contact-section">
        <Typography variant="h5" gutterBottom className="section-title" style={{ justifyContent: 'center' }}>
          Get In Touch
        </Typography>

        <Box className="contact-item">
          <LocationIcon className="contact-icon" />
          <Typography variant="body1">
            SlimIoT Technologies Private Limited | Faridabad, India
          </Typography>
        </Box>

        <Box className="contact-item">
          <EmailIcon className="contact-icon" />
          <Typography variant="body1">
            plawat[at]slimiot.com
          </Typography>
        </Box>

        <Box className="contact-item">
          <PhoneIcon className="contact-icon" />
          <Typography variant="body1">
            +91 9310035724
          </Typography>
        </Box>

        <Button
          variant="contained"
          className="contact-button"
          onClick={() => window.location.href = '/support'}
        >
          Contact Us
        </Button>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link component={RouterLink} to="/terms" underline="hover">Terms</Link>
          {" "} | {" "}
          <Link component={RouterLink} to="/privacy" underline="hover">Privacy</Link>
        </Box>

      </Paper>
    </Container>
  );
};

export default AboutUs;