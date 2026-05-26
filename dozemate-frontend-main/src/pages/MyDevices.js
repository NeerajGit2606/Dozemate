import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Paper,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    CircularProgress,
    Alert,
    Snackbar,
    Card,
    CardContent,
    IconButton,
    Box,
    Chip,
    Tooltip,
    FormControl,
    InputLabel,
    InputAdornment,
    Fade,
    Divider,
    Grid
} from "@mui/material";
import DevicesIcon from '@mui/icons-material/Devices';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import "./MyDevices.css";
import { apiUrl } from "../config/api";

const MyDevices = () => {
    const [devices, setDevices] = useState([]);
    const [activeDevice, setActiveDevice] = useState("");
    const [selectedActiveDeviceId, setSelectedActiveDeviceId] = useState("");
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info"
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [deviceStatusMap, setDeviceStatusMap] = useState({});
    const [selectedDeviceStatus, setSelectedDeviceStatus] = useState("");


    useEffect(() => {
        fetchDevices();
    }, []);

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

    // Fetch user's devices and active device
    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(apiUrl("/api/devices/user"), {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });
            const data = await response.json();
            if (response.ok) {
                const deviceList = data.devices || [];
                setDevices(deviceList);

                // Build status map from DB
                const statusMap = {};
                deviceList.forEach(dev => {
                    statusMap[dev.deviceId] = dev.status || "inactive";
                });
                setDeviceStatusMap(statusMap);

                if (data.activeDevice) {
                    if (typeof data.activeDevice === 'object' && data.activeDevice.deviceId) {
                        setActiveDevice(data.activeDevice.deviceId);
                        setSelectedActiveDeviceId(data.activeDevice.deviceId);
                        setSelectedDeviceStatus(statusMap[data.activeDevice.deviceId]);
                    } else if (typeof data.activeDevice === 'string') {
                        const activeDeviceObj = deviceList.find(d =>
                            d._id === data.activeDevice || d.deviceId === data.activeDevice
                        );
                        if (activeDeviceObj) {
                            setActiveDevice(activeDeviceObj.deviceId);
                            setSelectedActiveDeviceId(activeDeviceObj.deviceId);
                            setSelectedDeviceStatus(activeDeviceObj.status);
                        }
                    }
                }
            }
            else {
                setError(data.message || "Failed to fetch devices");
                showMessage(data.message || "Failed to fetch devices", "error");
            }
        } catch (error) {
            setError("Network error when fetching devices");
            showMessage("Network error when fetching devices", "error");
        } finally {
            setLoading(false);
        }
    };

    // Remove device
    const openDeleteConfirmation = (deviceId, deviceName) => {
        setDeviceToDelete({ id: deviceId, name: deviceName });
        setOpenConfirmDialog(true);
    };

    const handleDeleteDevice = async () => {
        if (!deviceToDelete) return;
        try {
            const response = await fetch(apiUrl('/api/devices/remove/${deviceToDelete.id}'), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message || "Device removed successfully!");
                fetchDevices();
            } else {
                showMessage(data.message || "Failed to remove device", "error");
            }
        } catch (error) {
            showMessage("Network error when removing device", "error");
        }
        setOpenConfirmDialog(false);
        setDeviceToDelete(null);
    };

    // Set active device
    const handleSelectActiveDevice = (deviceId) => {
        setSelectedActiveDeviceId(deviceId);
    };

    const saveActiveDevice = async () => {
        console.log("🚀 saveActiveDevice called with:", selectedActiveDeviceId);
        if (!selectedActiveDeviceId) {
            showMessage("Please select a device first", "warning");
            return;
        }

        // ✅ get live status from devices state
        const selectedDevice = devices.find(d => d.deviceId === selectedActiveDeviceId);
        const currentStatus = selectedDevice?.status || "inactive";
        const isDeactivating = currentStatus === "active";

        const url = isDeactivating
            ? apiUrl(`/api/devices/deactivate/${encodeURIComponent(selectedActiveDeviceId)}`)
            : apiUrl(`/api/devices/activate/${encodeURIComponent(selectedActiveDeviceId)}?profileId=${encodeURIComponent("default")}`);

        try {
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const data = await response.json();
            console.log("🔄 API response:", data);

            if (response.ok) {
                showMessage(data.message || "Device updated successfully!");

                setDevices(prev =>
                    prev.map(dev =>
                        dev.deviceId === selectedActiveDeviceId
                            ? { ...dev, status: isDeactivating ? "inactive" : "active" }
                            : dev // leave others unchanged ✅
                    )
                );

                if (isDeactivating) {
                    console.log("🔴 Device set as INACTIVE:", selectedActiveDeviceId);
                    setActiveDevice(null);
                } else {
                    console.log("🟢 Device set as ACTIVE:", selectedActiveDeviceId);
                    setActiveDevice(selectedActiveDeviceId);
                }
            } else {
                showMessage(data.message || "Failed to update device", "error");
            }
        } catch (error) {
            console.error("❌ Error while saving active device:", error);
            showMessage("Network error when updating device", "error");
        }
    };


    const getActiveDeviceName = () => {
        if (!activeDevice || !devices.length) return "None";
        const device = devices.find(dev => dev._id === activeDevice || dev.deviceId === activeDevice);
        if (device) {
            const deviceName = device.name || device.deviceType || "Unnamed";
            return `${device.deviceId} - ${deviceName}`;
        }
        return activeDevice;
    };

    // Filter devices based on search query
    const filteredDevices = devices.filter(dev =>
        dev.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dev.name && dev.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.deviceType && dev.deviceType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.manufacturer && dev.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dev.location && dev.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusChip = (status) => {
        console.log("🎨 Rendering status chip for:", status);
        if (!status) return (
            <div
                label="Unknown"
                size="small"
                icon={<ErrorOutlineIcon />}
                className="status-chip unknown"
            />
        );
        return status.toLowerCase();

    };

    return (
        <Container className="my-devices-container">
            <Box className="page-header">
                <Typography variant="h4" component="h1" className="page-title">
                    <DevicesIcon className="page-icon" />
                    My Devices
                </Typography>
                <Typography variant="subtitle1" className="subtitle">
                    Manage your connected devices and select your active device
                </Typography>
            </Box>

            {/* Expanded Set Active Device Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                    <Card className="control-card expanded-active-device-card">
                        <CardContent>
                            <Box className="active-device-header" sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <CheckCircleOutlineIcon className="card-icon active" />
                                <Typography variant="h6" className="card-title" sx={{ ml: 1 }}>
                                    Set Active Device
                                </Typography>
                            </Box>
                            <Divider className="card-divider" />
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <Box className="active-device-display" sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            Current active device
                                        </Typography>
                                        <Typography variant="h6" className="active-device-name">
                                            {getActiveDeviceName()}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                        Select a device from your list to make it your active device. The active device will be used for all primary operations and data sync.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl variant="outlined" fullWidth className="device-select-container">
                                        <InputLabel>Select Device</InputLabel>
                                        <Select
                                            className="device-select"
                                            value={selectedActiveDeviceId}
                                            onChange={(e) => handleSelectActiveDevice(e.target.value)}
                                            label="Select Device"
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {devices.map((dev) => (
                                                <MenuItem key={dev._id} value={dev.deviceId}>
                                                    {`${dev.deviceId} - ${dev.name || dev.deviceType || "Unnamed"}`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <Box sx={{ display: "flex", gap: 2, mt: 2, alignItems: "center" }}>

                                            <button
                                                className="action-button save-button"
                                                style={{
                                                    flex: 1,
                                                    background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    padding: "12px 0",
                                                    fontWeight: 600,
                                                    fontSize: "1rem",
                                                    cursor: "pointer",
                                                    transition: "background 0.2s"
                                                }}
                                                onClick={saveActiveDevice}
                                            >
                                                {(() => {
                                                    const selectedDevice = devices.find(d => d.deviceId === selectedActiveDeviceId);
                                                    if (!selectedDevice) return "Set as Active";
                                                    return selectedDevice.status === "active" ? "Set as Inactive" : "Set as Active";
                                                })()}
                                            </button>

                                        </Box>


                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Search and devices list */}
            <Card className="devices-list-card">
                <CardContent>
                    <Box className="device-list-header">
                        <Typography variant="h6" className="section-title">
                            <DevicesIcon className="section-icon" />
                            Your Devices
                        </Typography>
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                        <Box sx={{ flex: 1 }} />
                        <Box>
                            <input
                                className="search-field"
                                type="text"
                                placeholder="Search devices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0",
                                    outline: "none",
                                    fontSize: "1rem",
                                    minWidth: "220px"
                                }}
                            />
                            {searchQuery && (
                                <IconButton size="small" onClick={() => setSearchQuery("")}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                    <Divider className="list-divider" />
                    {loading ? (
                        <Box className="loading-container">
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" className="error-alert">{error}</Alert>
                    ) : (
                        <Fade in={!loading}>
                            <TableContainer className="device-table-container">
                                <Table className="device-table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Device ID</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Manufacturer</TableCell>
                                            <TableCell>Firmware</TableCell>
                                            <TableCell>Location</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredDevices.length > 0 ? (
                                            filteredDevices.map((dev) => (
                                                <TableRow key={dev._id}
                                                    className={dev.deviceId === activeDevice ? "active-row" : ""}
                                                >
                                                    <TableCell className="device-id-cell">{dev.deviceId}</TableCell>
                                                    <TableCell>{dev.name || dev.deviceType || "Unnamed Device"}</TableCell>
                                                    <TableCell>{dev.deviceType || "Unknown"}</TableCell>
                                                    <TableCell>{dev.manufacturer || "Unknown"}</TableCell>
                                                    <TableCell>{dev.firmwareVersion || "Unknown"}</TableCell>
                                                    <TableCell>{dev.location || "Unspecified"}</TableCell>
                                                    <TableCell>
                                                        {getStatusChip(dev.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="Remove Device">
                                                            <IconButton
                                                                className="delete-button"
                                                                size="small"
                                                                onClick={() => openDeleteConfirmation(dev.deviceId, dev.name || dev.deviceType || "this device")}
                                                            >
                                                                <DeleteOutlineIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center" className="empty-table-message">
                                                    {searchQuery ? "No devices match your search" : "No devices found"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Fade>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
                className="delete-dialog"
            >
                <DialogTitle className="dialog-title">
                    <WarningIcon className="warning-icon" />
                    Confirm Device Removal
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to remove {deviceToDelete?.name}?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <button
                        onClick={() => setOpenConfirmDialog(false)}
                        className="cancel-button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDeleteDevice}
                        className="delete-confirm-button"
                        style={{
                            background: "linear-gradient(90deg, #ef4444, #f87171)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 24px",
                            fontWeight: 600,
                            fontSize: "1rem",
                            cursor: "pointer"
                        }}
                    >
                        Remove
                    </button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                className="feedback-snackbar"
            >
                <Alert onClose={closeSnackbar} severity={snackbar.severity} className="feedback-alert">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default MyDevices;
