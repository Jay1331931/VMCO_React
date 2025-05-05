import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Template from './screens/template';
import Orders from './screens/orders';
import Customers from './screens/customers';
import Catalog from './screens/catalog';  
import Cart from './screens/cart';  

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Template />} />
        <Route path="/orders" element={<Orders />} /> {/* Route for Orders */}
        <Route path="/customers" element={<Customers />} /> {/* Route for Customers */}
        <Route path="/catalog" element={<Catalog />} /> {/* Route for Catalog */}
        <Route path="/cart" element={<Cart />} /> {/* Route for Cart */}
      </Routes>
    </Router>
  );
}

export default App;