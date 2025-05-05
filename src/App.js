import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '../src/components/Sidebar';
import Orders from './screens/orders';
import Customers from './screens/customers';
import Catalog from './screens/catalog';  
import Cart from './screens/cart';  
import CustomersDetails from './screens/customersDetails';
// Remove unused import: import CommentPopup from './screens/commentPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Sidebar />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customersDetails" element={<CustomersDetails />} />
      </Routes>
    </Router>
  );
}

export default App;