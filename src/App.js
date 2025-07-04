import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '../src/components/Sidebar';
import Orders from './screens/orders';
import Customers from './screens/customers';
import Catalog from './screens/catalog';
import Support from './screens/support'; 
import Maintenance from './screens/maintenance';
import Cart from './screens/cart';  
import CustomersDetails from './screens/customersDetails';
import LoginScreen from './screens/login';
import CustomersOnboarding from './screens/customersOnboarding';
import Checkout from './screens/checkout';
import ForgotPassword from './components/ForgotPassword';
import EmployeeLogin from './screens/employeeLogin';
import OrderDetails from './screens/orderDetails';
import SupportDetails from './screens/supportDetails';
import MaintenanceDetails from './screens/maintenanceDetails';
import Logout from './screens/logout';
import RbacEditor from './screens/rbacEditor';
import Payment from './screens/payment';
import BankTransactions from './screens/BankTransactions';
import AddBankTransaction from './components/AddBankTransaction';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/support" element={<Support />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/customersDetails" element={<CustomersDetails />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/login/employee" element={<LoginScreen />} />
        <Route
          path="/customers/registration"
          element={<CustomersOnboarding />}
        />
        <Route
          path="/customers/registration/:id"
          element={<CustomersOnboarding />}
        />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/orderDetails" element={<OrderDetails />} />
        <Route path="/supportDetails" element={<SupportDetails />} />
        <Route path="/maintenanceDetails" element={<MaintenanceDetails />} />
        <Route path="/rbacEditor" element={<RbacEditor />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/bankTransactions" element={<BankTransactions/>} />
        <Route path="/bankTransactions/add" element={<AddBankTransaction />} />
        <Route path="/bankTransactions/edit/:id" element={<AddBankTransaction />} />
        </Routes>
    </Router>
  );
}

export default App;
