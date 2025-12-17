import React from "react";
import ReactDOM from "react-dom/client"; // Updated import
import App from "./App";
import { AuthProvider } from './context/AuthContext';
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// Create a root and render the App component
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      {/* <App /> */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
    <App/>
  </LocalizationProvider>

    </AuthProvider>
  </React.StrictMode>
);
