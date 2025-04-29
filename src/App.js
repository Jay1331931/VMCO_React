import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Template from './screens/template';
import Orders from './screens/orders';
import Customers from './screens/customers';
import CustomersOnboarding from './screens/customersOnboarding';
import CommentPopup from './screens/commentPanel'; // Import the CommentPopup component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Template />} />
        <Route path="/orders" element={<Orders />} /> {/* Route for Orders */}
        <Route path="/customers" element={<Customers />} /> {/* Route for Customers */}
        <Route path="/customersOnboarding" element={<CustomersOnboarding />} /> {/* Route for Customers Onboarding */}
        </Routes>
    </Router>
  );
}

export default App;