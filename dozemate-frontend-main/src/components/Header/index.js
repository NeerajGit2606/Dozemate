import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoLight from '../../assets/images/logo.png';
import logoDark from '../../assets/images/logo-dark.png';
import { MdMenuOpen, MdOutlineMenu, MdNotifications } from "react-icons/md";
import { IoMdMail } from "react-icons/io";
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import { MyContext } from "../../App";
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { logout, user: authUser, role } = useAuth();
  const context = useContext(MyContext);

  const getLogo = () => (context?.themeMode === 'dark' ? logoDark : logoLight);

  const handleClickAccDrop = (event) => setAnchorEl(event.currentTarget);
  const handleCloseAccDrop = () => setAnchorEl(null);

  // Prefer context user; if missing, fetch it
  useEffect(() => {
    const bootstrap = async () => {
      if (authUser) {
        setUserData(authUser);
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      try {
        // Use your actual profile endpoint:
        const res = await fetch('https://admin.dozemate.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        const u = json?.user || json?.data || json; // support multiple shapes
        setUserData(u || null);
      } catch (e) {
        console.error('profile fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [authUser]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true, state: { loggedOut: true } });
  };

  const initials = (str = '') => {
    const parts = str.trim().split(/\s+/);
    return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
  };

  const getProfileImageUrl = () => {
    const img = userData?.profileImage || userData?.avatar || userData?.photoUrl;
    if (!img) return null;
    if (/^https?:\/\//i.test(img)) return img;
    return `https://admin.dozemate.com${img}`;
  };

  return (
    <header className="header-container">
      <div className="header-inner">
        <div className="header-logo-container">
          <Link to="/" className="logo">
            <img src={getLogo()} alt="Logo" className="header-logo" />
          </Link>
        </div>

        <div className="header-center-icons">
          <IconButton className="icon-btn" onClick={() => context.setIsToggleSidebar(!context.isToggleSidebar)}>
            {context.isToggleSidebar ? <MdOutlineMenu /> : <MdMenuOpen />}
          </IconButton>
          <IconButton className="icon-btn" aria-label="notifications">
            <MdNotifications />
          </IconButton>
          <IconButton className="icon-btn" aria-label="mail">
            <IoMdMail />
          </IconButton>
        </div>

        <div className="header-profile">
          <Button className="myAcc" onClick={handleClickAccDrop} disabled={loading}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <span className="userImg">
                {getProfileImageUrl() ? (
                  <img
                    src={getProfileImageUrl()}
                    alt="User"
                    onError={(e)=>{ e.currentTarget.style.display='none'; }}
                  />
                ) : (
                  <Avatar sx={{ width: 36, height: 36 }}>
                    {initials(userData?.name || userData?.fullName || userData?.email)}
                  </Avatar>
                )}
              </span>
            )}
          </Button>

          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleCloseAccDrop}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* Header block */}
            <MenuItem disabled sx={{ opacity: 1, py: 1.5, alignItems: 'flex-start' }}>
              <Avatar sx={{ mr: 1 }}>
                {initials(userData?.name || userData?.fullName || userData?.email)}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {userData?.name || userData?.fullName || 'New User'}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {userData?.email || 'No email'}
                </div>
                {role && (
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                    Role: {role}
                  </div>
                )}
              </div>
            </MenuItem>

            <Divider />

            <MenuItem onClick={() => { handleCloseAccDrop(); navigate('/profile'); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              Profile & Settings
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
