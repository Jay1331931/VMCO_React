import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize from cookie on mount
  useEffect(() => {
    const tokenFromCookie = getCookie('token');
    if (tokenFromCookie) {
      setToken(tokenFromCookie);
      setIsAuthenticated(true);
      // You could decode JWT here to get user info if needed
    }
  }, []);

  const getCookie = (name) => {
    const cookies = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
      
    return cookies[name] || null;
  };

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    // You might want to clear the cookie here too
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};