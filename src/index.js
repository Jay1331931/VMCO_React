import React from "react";
import ReactDOM from "react-dom/client"; // Updated import
import App from "./App";
import { AuthProvider } from './context/AuthContext';

// Create a root and render the App component
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
