import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // <-- Correct import
import RbacManager from "../utilities/rbac";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Add your API call here
const fetchUser = async (token) => {
  //console.log('Fetching user with token:', token);
  const API_SERVER_URL = process.env.REACT_APP_API_BASE_URL;

  const response = await fetch(`${API_SERVER_URL}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    
  });

  //console.log('Response received:', response);

  if (!response.ok) throw new Error("Failed to fetch user");

  // Get the response JSON
  const userData = await response.json();
  //console.log('Response json:', JSON.stringify(userData.data));
  if (userData.data) {
    const { iat, exp, ...cleanedData } = userData.data;
    return cleanedData;
  }
  return userData.data;
};

// Helper to check if token is expired
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token); // <-- Use jwtDecode here
    if (!exp) return false;
    return Date.now() < exp * 1000;
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [buttonClicked, setButtonClicked] = useState(false);
  const getCookie = (name) => {
    // const cookies = document.cookie
    //   .split(";")
    //   .map((cookie) => cookie.trim())
    //   .reduce((acc, cookie) => {
    //     const [key, value] = cookie.split("=");
    //     acc[key] = decodeURIComponent(value);
    //     return acc;
    //   }, {});
    // return cookies[name] || null;
    return localStorage.getItem(name);
  };

  useEffect(() => {
    const tokenFromCookie = getCookie("token");
    if (tokenFromCookie && isTokenValid(tokenFromCookie)) {
      setToken(tokenFromCookie);
      setIsAuthenticated(true);
      setLoading(true); // Set loading to true while fetching

      fetchUser(tokenFromCookie)
        .then((userData) => {
          setUser(userData);
              const role= userData?.roles[0] && userData?.roles[0]?.toLowerCase() ==="employee" ?  userData?.designation : userData?.roles[0];
          
            RbacManager.loadRbacConfig(role,tokenFromCookie);
            
          setLoading(false); // Done loading
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          setToken(null);
          setLoading(false); // Done loading
        });
    } else {
      // Token missing or expired, logout
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      setLoading(false);
      // localStorage.removeItem("token");
      // document.cookie =
      //   "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }, []);

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = (buttonClickedValue = false) => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    setButtonClicked(buttonClickedValue);
    
    // document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, loading, login, logout ,buttonClicked}}
    >
      {children}
    </AuthContext.Provider>
  );
};
