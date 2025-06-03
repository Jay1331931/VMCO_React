import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Add your API call here
const fetchUser = async (token) => {
  //console.log('Fetching user with token:', token);
  const API_SERVER_URL = process.env.REACT_APP_API_BASE_URL;

  const response = await fetch(`${API_SERVER_URL}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
  });

  //console.log('Response received:', response);
  
  if (!response.ok) throw new Error('Failed to fetch user');
  
  // Get the response JSON
  const userData = await response.json();
  //console.log('Response json:', JSON.stringify(userData.data));
  if (userData.data) {
    const { iat, exp, ...cleanedData } = userData.data;
    return cleanedData;
  }
  return userData.data;
};

export const AuthProvider = ({ children }) => {
  //console.log('........... IN AUTH PROVIDER');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  useEffect(() => {
    const tokenFromCookie = getCookie('token');
    if (tokenFromCookie) {
      //console.log('Token found in cookie:', tokenFromCookie);
      setToken(tokenFromCookie);
      setIsAuthenticated(true);
      // Fetch user info using the token
      fetchUser(tokenFromCookie)
        .then(userData => setUser(userData))
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
        });
    }
  }, []);

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};