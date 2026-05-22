import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { createContext, useState, useEffect, useMemo } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddDevice from "./pages/AddDevice";
import MyDevices from "./pages/MyDevices";
import UserProfile from "./pages/UserProfile";
import Support from "./pages/Support";
import AboutUs from "./pages/ContactUs";
import History from "./pages/History";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminManagement from "./pages/superadmin/AdminManagement";
import Organizations from "./pages/superadmin/Organizations";
import AdminProfile from "./pages/admin/AdminProfile";
import UserManagement from "./pages/superadmin/UserManagement";
import Devices from "./pages/superadmin/Devices";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminDeviceManagement from "./pages/admin/AdminDeviceManagement";
import AdminHistory from "./pages/admin/AdminHistory";
import DownloadReport from "./pages/admin/DownloadReport";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from './pages/ForgotPassword';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import GraphSettings from "./pages/superadmin/GraphSettings";  // ⬅ add this
import OAuthCallback from './pages/OAuthCallback';

const MyContext = createContext();

// New component to contain the main application logic
const AppContent = () => {
    const { token, isAuthenticated, role } = useAuth();
    const routerLocation = useLocation();
    const navigate = useNavigate();
    const [isToggleSidebar, setIsToggleSidebar] = useState(false);
    const [themeMode, setThemeMode] = useState(localStorage.getItem("themeMode") || "light");
    const [openUnauthorizedPopup, setOpenUnauthorizedPopup] = useState(false);

    const isHideSidebarAndHeader = routerLocation.pathname === "/login" || routerLocation.pathname === "/signup";

    useEffect(() => {
        if (themeMode === "light") {
            document.body.classList.remove("dark");
            document.body.classList.add("light");
        } else {
            document.body.classList.remove("light");
            document.body.classList.add("dark");
        }
    }, [themeMode]);


    const ProtectedRoute = ({ children }) => {

        const { isAuthenticated, authChecked } = useAuth();
        const location = useLocation();

        if (!authChecked) {
            return <div className="loading-spinner">Checking auth…</div>;
        }

        if (!isAuthenticated) {
            // only redirect if not already on login/signup
            if (location.pathname !== "/login" && location.pathname !== "/signup") {
                return <Navigate to="/login" replace />;
            }
        }
        return children;
    };


    const handleClosePopup = () => {
        setOpenUnauthorizedPopup(false);
    };

    const handleLoginRedirect = () => {
        setOpenUnauthorizedPopup(false);
        navigate("/login");
    };

    // Memoize the context value to prevent unnecessary re-renders
    const values = useMemo(() => ({
        isToggleSidebar,
        setIsToggleSidebar,
        themeMode,
        setThemeMode,
    }), [isToggleSidebar, themeMode]);

    return (
        <MyContext.Provider value={values}>
            {!isHideSidebarAndHeader && <Header />}
            <div className="main d-flex">
                {!isHideSidebarAndHeader && (
                    <div className={"sidebarWrapper" + (isToggleSidebar ? " toggle" : "")}>
                        <Sidebar />
                    </div>
                )}
                <div className="content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/oauth/success" element={<OAuthCallback />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/add-device" element={<ProtectedRoute><AddDevice /></ProtectedRoute>} />
                        <Route path="my-devices" element={<ProtectedRoute><MyDevices /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                        <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
                        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/graph-settings" element={<ProtectedRoute><GraphSettings /></ProtectedRoute>} />


                        {/* Admin Routes */}
                        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
                        <Route path="/admin/devices" element={<ProtectedRoute><AdminDeviceManagement /></ProtectedRoute>} />
                        <Route path="/admin/history" element={<ProtectedRoute><AdminHistory /></ProtectedRoute>} />
                        <Route path="/admin/report" element={<ProtectedRoute><DownloadReport /></ProtectedRoute>} />

                        {/* Super Admin Routes */}
                        <Route path="/superadmin/dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                        <Route path="/superadmin/admins" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
                        <Route path="/superadmin/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                        <Route path="/superadmin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
                        <Route path="/superadmin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                        <Route path="/superadmin/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
                        <Route
                            path="/superadmin/graph-settings"
                            element={role === "superadmin" ? <GraphSettings /> : <Navigate to="/dashboard" />}
                        />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        {/* Redirect unknown routes to Dashboard if logged in, else to login */}
                        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />

                    </Routes>
                </div>
            </div>

            {/* Unauthorized Access Popup */}
            <Dialog open={
                openUnauthorizedPopup &&
                !['/login', '/signup'].includes(routerLocation.pathname) &&
                !routerLocation.state?.loggedOut
            }
                onClose={handleClosePopup} >
                <DialogTitle>Unauthorized Access</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You are not logged in. Please log in to access this page.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePopup} color="primary">Cancel</Button>
                    <Button onClick={handleLoginRedirect} color="primary" variant="contained">Login</Button>
                </DialogActions>
            </Dialog>
        </MyContext.Provider>
    );
}

// The main App component now wraps everything with AuthProvider
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
export { MyContext };