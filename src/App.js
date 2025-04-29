import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Template from './screens/template';
import Orders from './screens/orders';
import Customers from './screens/customers';
import Catalogue from './screens/catalogue';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Template />} />
        <Route path="/orders" element={<Orders />} /> {/* Route for Orders */}
        <Route path="/customers" element={<Customers />} /> {/* Route for Customers */}
        <Route path="/catalogue" element={<Catalogue />} /> {/* Route for Catalogue */}
      </Routes>
    </Router>
  );
}

export default App;