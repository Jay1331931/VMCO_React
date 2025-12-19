import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import AppRoutes from "./AppRoutes";
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
