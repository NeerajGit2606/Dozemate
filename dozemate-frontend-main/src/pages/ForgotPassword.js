import React, { useState } from "react";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Divider,
    InputAdornment
} from "@mui/material";

import { Email, Send, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/api";
import "./ResetPassword.css"; // ✅ Reuse the same CSS

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "info" });

    const handleSubmit = async () => {
        if (!email.trim()) {
            setMessage({ text: "Please enter your email address", type: "error" });
            return;
        }

        setLoading(true);
        setMessage({ text: "", type: "info" });

        try {
            const response = await fetch(apiUrl("/api/auth/forgot"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({
                    text: "If that email exists, a reset link has been sent.",
                    type: "success"
                });
                setEmail("");
            } else {
                setMessage({
                    text: data.message || "Failed to send reset link.",
                    type: "error"
                });
            }
        } catch (err) {
            console.error("Error:", err);
            setMessage({
                text: "Network error. Please try again later.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" className="reset-password-container">
            <Paper elevation={3} className="reset-password-paper">
                {/* Header */}
                <Box className="reset-password-header">
                    <Email className="reset-password-icon" />
                    <Typography variant="h4" component="h1" className="reset-password-title">
                        Forgot Password
                    </Typography>
                    <Typography variant="subtitle1" className="reset-password-subtitle">
                        Enter your email to receive a reset link
                    </Typography>
                </Box>

                <Divider className="reset-password-divider" />

                {/* Alert */}
                {message.text && (
                    <Alert
                        severity={message.type}
                        className="reset-password-alert"
                        onClose={() => setMessage({ text: "", type: "info" })}
                    >
                        {message.text}
                    </Alert>
                )}

                {/* Email Input */}
                <Box className="reset-password-content">
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="reset-password-input"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email />
                                </InputAdornment>
                            )
                        }}
                    />

                    {/* Action Buttons */}
                    <Box className="reset-password-actions">
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/login")}
                            disabled={loading}
                            startIcon={<ArrowBack />}
                            className="back-button"
                        >
                            Back to Login
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading || !email}
                            className="save-button"
                            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForgotPassword;
