import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import AppRoutes from "./AppRoutes";
function App() {
  const updateHeaderTop = () => {
  const header = document.querySelector(".app-header");
  if (header) {
    document.documentElement.style.setProperty(
      "--catalog-header-top",
      `${header.offsetHeight}px`
    );
  }
};

useEffect(() => {
  updateHeaderTop();
  window.addEventListener("resize", updateHeaderTop);
  return () => window.removeEventListener("resize", updateHeaderTop);
}, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
