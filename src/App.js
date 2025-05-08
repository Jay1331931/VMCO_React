import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '../src/components/Sidebar';
import Orders from './screens/orders';
import Customers from './screens/customers';
import Catalog from './screens/catalog';
import Support from './screens/support';  
import Cart from './screens/cart';  
import CustomersDetails from './screens/customersDetails';
import OrderDetails from './screens/orderDetails';
import SupportDetails from './screens/supportDetails';
// Remove unused import: import CommentPopup from './screens/commentPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Sidebar />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path='/support' element={<Support />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customersDetails" element={<CustomersDetails />} />
        <Route path="/orderDetails" element={<OrderDetails />} />
        <Route path="/supportDetails" element={<SupportDetails />} />
        </Routes>
    </Router>
  );
}

export default App;