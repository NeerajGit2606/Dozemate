import React, { useRef, useState, useEffect } from "react";
import { apiUrl } from "../config/api";
import {
    TextField,
    Button,
    Container,
    Typography,
    Card,
    CardContent,
    Divider,
    Box,
    Snackbar,
    Alert,
    IconButton,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid
} from "@mui/material";
import Chip from "@mui/material/Chip";
import DevicesIcon from '@mui/icons-material/Devices';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import "./AddDevice.css";

const AddDevice = () => {
    const [deviceId, setDeviceId] = useState("");
    const [deviceDetails, setDeviceDetails] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [adding, setAdding] = useState(false);
    const [mode, setMode] = useState("create"); // 'create' | 'edit'
    const lastCheckedRef = useRef("");          // de-dupe blur calls
    const [codes, setCodes] = useState(null);
    const [autoInfo, setAutoInfo] = useState({ type: "", manufacturer: "" });
    const [selectedModel, setSelectedModel] = useState("");
    const [selectedManufacturer, setSelectedManufacturer] = useState("");

    useEffect(() => {
        if (!deviceId.trim()) {
            setDeviceDetails(null);
            setMode("create");
            lastCheckedRef.current = "";
            setAutoInfo({ type: "", manufacturer: "" }); // reset when cleared
        }
    }, [deviceId]);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const res = await fetch(apiUrl("/api/public/codes"));
                const data = await res.json();
                setCodes(data || {});
                console.log("[AddDevice] Codes lookup loaded");
            } catch (err) {
                console.error("[AddDevice:ERR] /public/codes fetch failed", err.message);
            }
        };
        fetchLookups();
    }, []);

    useEffect(() => {
        if (!codes) return;
        const first4 = (deviceId || "").slice(0, 4);
        if (/^\d{4}$/.test(first4)) {
            const modelCode = first4.slice(0, 2);
            const mfrCode = first4.slice(2, 4);

            setAutoInfo({
                type: codes.modelsByCode?.[modelCode]?.name || "",
                manufacturer: codes.manufacturersByCode?.[mfrCode]?.name || ""
            });

            console.log("[AddDevice] Auto-selected:", modelCode, mfrCode);
        }
    }, [deviceId, codes]);


    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info"
    });

    const showMessage = (message, severity = "info") => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Fetch device details from backend
    const fetchDeviceDetails = async () => {
        if (!deviceId.trim()) {
            showMessage("Please enter a Device ID", "warning");
            return;
        }
        setDeviceDetails(null);
        setFetching(true);
        try {
            const token = localStorage.getItem("token");
            const id = deviceId.trim().toUpperCase();
            const response = await fetch(apiUrl(`/api/devices/details/${id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            // FIX: Use data.data instead of data.device
            if (response.ok && data.data) {
                setDeviceDetails(data.data);
                setMode("edit");
                showMessage("Device details fetched!", "success");
            } else {
                setDeviceDetails(null);
                setMode("create");
                showMessage(data.message || "Device not found", "error");
            }
        } catch (error) {
            setDeviceDetails(null);
            setMode("create");
            showMessage("Network error while fetching device details", "error");
        } finally {
            setFetching(false);
        }
    };

    // Add device to user section
    const handleAddDevice = async () => {
        if (!deviceId.trim()) {
            showMessage("Please enter a Device ID", "warning");
            return;
        }
        setAdding(true);
        try {
            const token = localStorage.getItem("token");
            const id = deviceId.trim().toUpperCase();
            const response = await fetch(apiUrl("/api/devices/assign"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    deviceId: id,
                    modelCode: selectedModel,
                    manufacturerCode: selectedManufacturer
                })
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message || "Device assigned successfully!", "success");
                setDeviceId("");
                setDeviceDetails(null);
                setMode("create");
                lastCheckedRef.current = "";
            } else {
                showMessage(data.message || "Failed to assign device", "error");
            }
        } catch (error) {
            showMessage("Network error while assigning device", "error");
        } finally {
            setAdding(false);
        }
    };

    // Handle Enter key for deviceId input
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            fetchDeviceDetails();
        }
    };

    // Run lookup when the Device ID field loses focus
    const handleBlurCheck = () => {
        if (fetching || adding) return;
        const id = deviceId.trim().toUpperCase();
        if (!id || lastCheckedRef.current === id) return;
        lastCheckedRef.current = id;
        fetchDeviceDetails();
    };

    return (
        <Container className="add-device-container">
            <Box className="page-header">
                <Typography variant="h4" component="h1" className="page-title">
                    <AddBoxIcon className="page-icon" />
                    Add Device
                </Typography>
                <Typography variant="subtitle1" className="subtitle">
                    Enter your Device ID to fetch and add your device
                </Typography>
            </Box>

            <Card className="device-form-card">
                <CardContent>
                    <Typography variant="h6" className="card-title">
                        <DevicesIcon className="card-icon" />
                        Device Registration
                    </Typography>
                    <Divider className="card-divider" />

                    <Box className="device-form" sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="Device ID"
                                    name="deviceId"
                                    variant="outlined"
                                    value={deviceId}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase().replace(/\s/g, "");
                                        setDeviceId(val);

                                        // auto-detect type/manufacturer from first 4 digits
                                        const first4 = val.slice(0, 4);
                                        if (/^\d{4}$/.test(first4) && codes) {
                                            const modelCode = first4.slice(0, 2);
                                            const mfrCode = first4.slice(2, 4);

                                            setAutoInfo({
                                                type: codes.modelsByCode?.[modelCode]?.name || "",
                                                manufacturer: codes.manufacturersByCode?.[mfrCode]?.name || ""
                                            });
                                        }
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleBlurCheck}
                                    className="form-field"
                                    placeholder="e.g. 0102-ACDE48112233"
                                    disabled={fetching || adding}
                                    autoFocus
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Button
                                    variant="contained"
                                    className="action-button fetch-button"
                                    onClick={fetchDeviceDetails}
                                    disabled={fetching || !deviceId.trim()}
                                    fullWidth
                                    sx={{ height: "100%" }}
                                >
                                    {fetching ? <CircularProgress size={22} /> : "Fetch Details"}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Device Details Preview */}
                    {deviceDetails && (
                        <Box className="device-details-preview" sx={{ mt: 4 }}>
                            <Card elevation={2} className="device-details-card">
                                <CardContent>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Device ID</Typography>
                                            <Typography variant="subtitle2">{deviceDetails.deviceId}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Type</Typography>
                                            <Typography variant="subtitle2">
                                                {autoInfo.type || deviceDetails?.deviceType || "-"}
                                            </Typography>

                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Manufacturer</Typography>
                                            <Typography variant="subtitle2">
                                                {autoInfo.manufacturer || deviceDetails?.manufacturer || "-"}
                                            </Typography>

                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Firmware</Typography>
                                            <Typography variant="subtitle2">{deviceDetails.firmwareVersion || "-"}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Location</Typography>
                                            <Typography variant="subtitle2">{deviceDetails.location || "-"}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">Status</Typography>
                                            <Typography variant="subtitle2">{deviceDetails.status || "-"}</Typography>
                                        </Grid>
                                    </Grid>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        className="action-button submit-button"
                                        onClick={handleAddDevice}
                                        sx={{ mt: 3 }}
                                        fullWidth
                                    >
                                        {adding ? <CircularProgress size={22} /> : (mode === "edit" ? "Add Device (unavailable in edit)" : "Add Device")}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Error preview if device not found */}
                    {!fetching && deviceId && !deviceDetails && snackbar.severity === "error" && (
                        <Box className="device-details-preview" sx={{ mt: 4 }}>
                            <Card elevation={1} className="device-details-card error">
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <ErrorOutlineIcon color="error" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight={600} color="error">
                                            Device not found!
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Please check your Device ID and try again.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                className="feedback-snackbar"
            >
                <Alert
                    onClose={closeSnackbar}
                    severity={snackbar.severity}
                    className="feedback-alert"
                    action={
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={closeSnackbar}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AddDevice;