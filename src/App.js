import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Template from './screens/template';
import Orders from './screens/orders';
import Customers from './screens/customers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Template />} />
        <Route path="/orders" element={<Orders />} /> {/* Route for Orders */}
        <Route path="/customers" element={<Customers />} /> {/* Route for Customers */}
      </Routes>
    </Router>
  );
}

export default App;