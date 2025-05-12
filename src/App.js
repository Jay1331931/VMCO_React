import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '../src/components/Sidebar';
import Orders from './screens/orders';
import Customers from './screens/customers';
import Catalog from './screens/catalog';  
import Cart from './screens/cart';  
import CustomersDetails from './screens/customersDetails';
import LoginScreen from './screens/login';
import CustomersOnboarding from './screens/customersOnboarding';
import Checkout from './screens/checkout';
import ForgotPassword from './components/ForgotPassword';
import EmployeeLogin from './screens/employeeLogin';
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
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/customersOnboarding" element={<CustomersOnboarding />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
      </Routes>
    </Router>
  );
}

export default App;