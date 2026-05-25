// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // init from localStorage once
  const [token, setToken] = useState(() => {
    const raw = localStorage.getItem("token");
    return raw && raw !== "undefined" && raw !== "null" ? raw : null;
  });

  const [userState, setUserState] = useState(() => {
    const role = localStorage.getItem("userRole") || "user";
    const raw = localStorage.getItem("userData");
    if (!raw) return { role };
    try {
      const u = JSON.parse(raw);
      return { ...u, role: u.role || role };
    } catch {
      return { role };
    }
  });

  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { setAuthChecked(true); }, []);

  // helper that also persists to localStorage
  const setUser = useCallback((updater) => {
    setUserState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next) {
        localStorage.setItem("userData", JSON.stringify(next));
        if (next.role) localStorage.setItem("userRole", next.role);
      } else {
        localStorage.removeItem("userData");
      }
      return next;
    });
  }, []);

  const login = (newToken, userData, userRole) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    const role = userData?.role || userRole || "user";
    const nextUser = userData ? { ...userData, role } : { role };

    localStorage.setItem("userRole", role);
    localStorage.setItem("userData", JSON.stringify(nextUser)); // <-- correct key
    setUserState(nextUser);
    setAuthChecked(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");
    setToken(null);
    setUserState(null);
  };

  const getRole = () => userState?.role || localStorage.getItem("userRole") || "user";
  const bumpAvatarVersion = () =>
    setUser(prev => (prev ? { ...prev, avatarVersion: Date.now() } : prev));

  return (
    <AuthContext.Provider
      value={{
        token,
        user: userState,
        setUser,               // <-- expose this
        bumpAvatarVersion,     // handy for forcing avatar refresh
        role: getRole(),
        isAuthenticated: !!token,
        authChecked,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
