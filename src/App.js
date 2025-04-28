import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Template from './screens/template';
import Orders from './screens/orders';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Template />} />
        <Route path="/orders" element={<Orders />} /> {/* Route for Orders */}
      </Routes>
    </Router>
  );
}

export default App;