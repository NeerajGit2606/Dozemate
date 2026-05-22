import React, { useContext } from "react";
import { Button, Typography, Box, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaUsers } from "react-icons/fa6";
import { TbLibraryPlus } from "react-icons/tb";
import { MdHistory, MdDevicesOther, MdOutlineContactSupport, MdSettingsInputComponent } from "react-icons/md";
import { HiOutlineDocumentReport, HiOutlineUserCircle } from "react-icons/hi";
import { IoMdInformationCircleOutline, IoMdAnalytics } from "react-icons/io";
import { BiLogOut, BiSolidUserCircle } from "react-icons/bi";
import { MdAdminPanelSettings } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import { MyContext } from "../../App";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, role } = useAuth();
  const context = useContext(MyContext);

  const closeSidebar = () => context.setIsToggleSidebar(false);

  const go = (path) => {
    navigate(path);
    closeSidebar();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: { loggedOut: true } });
  };

  const renderUserSidebar = () => (
    <ul type="none">
      <li><Button className="w-100" onClick={() => go("/dashboard")}><span className="icon"><RxDashboard /></span>Dashboard</Button></li>
      <li><Button className="w-100" onClick={() => go("/history")}><span className="icon"><MdHistory /></span>History</Button></li>
      <li><Button className="w-100" onClick={() => go("/my-devices")}><span className="icon"><MdDevicesOther /></span>Devices</Button></li>
      <li><Button className="w-100" onClick={() => go("/add-device")}><span className="icon"><TbLibraryPlus /></span>Add Device</Button></li>
      <li><Button className="w-100" onClick={() => go("/profile")}><span className="icon"><HiOutlineUserCircle /></span>Profile</Button></li>
      <li><Button className="w-100" onClick={() => go("/graph-settings")}><span className="icon"><HiOutlineUserCircle /></span>Graph Settings</Button></li>
      <li><Button className="w-100" onClick={() => go("/support")}><span className="icon"><MdOutlineContactSupport /></span>Support</Button></li>
      <li><Button className="w-100" onClick={() => go("/about")}><span className="icon"><IoMdInformationCircleOutline /></span>About Us</Button></li>
      <li><Button className="w-100" onClick={handleLogout} color="error"><span className="icon"><BiLogOut /></span>Logout</Button></li>
    </ul>
  );

  const renderAdminSidebar = () => (
    <ul type="none">
      <li><Button className="w-100" onClick={() => go("/admin/dashboard")}><span className="icon"><RxDashboard /></span>Admin Dashboard</Button></li>
      <li><Button className="w-100" onClick={() => go("/admin/users")}><span className="icon"><FaUsers /></span>User Management</Button></li>
      <li><Button className="w-100" onClick={() => go("/admin/devices")}><span className="icon"><MdDevicesOther /></span>Device Management</Button></li>
      <li><Button className="w-100" onClick={() => go("/admin/history")}><span className="icon"><IoMdAnalytics /></span>User History</Button></li>
      <li><Button className="w-100" onClick={() => go("/admin/report")}><span className="icon"><HiOutlineDocumentReport /></span>Download Report</Button></li>
      <li><Button className="w-100" onClick={() => go("/admin/profile")}><span className="icon"><BiSolidUserCircle /></span>Profile</Button></li>
      <li><Button className="w-100" onClick={() => go("/support")}><span className="icon"><MdOutlineContactSupport /></span>Support</Button></li>
      <li><Button className="w-100" onClick={() => go("/about")}><span className="icon"><IoMdInformationCircleOutline /></span>About Us</Button></li>
      <li><Button className="w-100" onClick={handleLogout} color="error"><span className="icon"><BiLogOut /></span>Logout</Button></li>
    </ul>
  );

  const renderSuperAdminSidebar = () => (
    <ul type="none">
      <li><Button className="w-100" onClick={() => go("/superadmin/dashboard")}><span className="icon"><RxDashboard /></span>Master Dashboard</Button></li>
      <li><Button className="w-100" onClick={() => go("/superadmin/organizations")}><span className="icon"><MdSettingsInputComponent /></span>Organizations</Button></li>
      <li><Button className="w-100" onClick={() => go("/superadmin/admins")}><span className="icon"><MdAdminPanelSettings /></span>Admin Management</Button></li>
      <li><Button className="w-100" onClick={() => go("/superadmin/users")}><span className="icon"><FaUsers /></span>User Management</Button></li>
      <li><Button className="w-100" onClick={() => go("/superadmin/devices")}><span className="icon"><MdDevicesOther /></span>Device Management</Button></li>
      <li><Button className="w-100" onClick={() => go("/superadmin/profile")}><span className="icon"><HiOutlineUserCircle /></span>Profile</Button></li>
       <li><Button className="w-100" onClick={() => go("/superadmin/graph-settings")}><span className="icon"><HiOutlineUserCircle /></span>Graph Settings</Button></li>
      <li>
        <Button className="w-100" onClick={handleLogout} color="error"><span className="icon"><BiLogOut /></span>Logout</Button></li>
    </ul>
  );

  return (
    <>
      {/* Click-to-close overlay */}
      <div
        className={`app-overlay ${context.isToggleSidebar ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Fixed overlay drawer */}
      <aside className={`app-sidebar ${context.isToggleSidebar ? "open" : ""}`}>
        {(role === "admin" || role === "superadmin") && (
          <Box sx={{ p: 1, mb: 1 }}>
            <Typography variant="subtitle2" color="primary" align="center" sx={{ fontWeight: 'bold' }}>
              {role === "admin" ? "Administrator Panel" : "Super Administrator"}
            </Typography>
            <Divider sx={{ my: 1 }} />
          </Box>
        )}

        {!role || role === "user" ? renderUserSidebar() : null}
        {role === "admin" ? renderAdminSidebar() : null}
        {role === "superadmin" ? renderSuperAdminSidebar() : null}
      </aside>
    </>
  );
};

export default Sidebar;
