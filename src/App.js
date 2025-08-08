import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "../src/components/Sidebar";
import Orders from "./screens/orders";
import Customers from "./screens/customers";
import Catalog from "./screens/catalog";
import Support from "./screens/support";
import Maintenance from "./screens/maintenance";
import Cart from "./screens/cart";
import CustomersDetails from "./screens/customersDetails";
import LoginScreen from "./screens/login";
import CustomersOnboarding from "./screens/customersOnboarding";
import Checkout from "./screens/checkout";
import ForgotPassword from "./components/ForgotPassword";
import EmployeeLogin from "./screens/employeeLogin";
import OrderDetails from "./screens/orderDetails";
import SupportDetails from "./screens/supportDetails";
import MaintenanceDetails from "./screens/maintenanceDetails";
// import Logout from "./screens/logout";
import RbacEditor from "./screens/rbacEditor";
import CustomerDetails from "./screens/customerDetails";
import Payment from "./screens/payment";
import BankTransactions from "./screens/BankTransactions";
import AddBankTransaction from "./components/AddBankTransaction";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import OpationsPage from "./components/Opationspage";
import Constants from "./constants";
import { useAuth } from "./context/AuthContext";
function App() {
  const { user, token, loading } = useAuth();
  if(loading) {
    return <div>Loading...</div>; // or a loading spinner
  }
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/orders" element={<ProtectedRoute page="orders"><Orders /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute page="customers"><Customers /></ProtectedRoute>}/>
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/support" element={<ProtectedRoute page="support"><Support /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute page="maintenance"><Maintenance /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute  page="cart"><Cart /></ProtectedRoute>} />
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
        <Route path="/checkout" element={<ProtectedRoute page="checkout"><Checkout /></ProtectedRoute>} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/orderDetails" element={<ProtectedRoute page="orderDetails"><OrderDetails /></ProtectedRoute>} />
        <Route path="/supportDetails" element={<ProtectedRoute page="supportDetails"><SupportDetails /></ProtectedRoute>} />
        <Route path="/maintenanceDetails" element={<ProtectedRoute page="maintenanceDetails"><MaintenanceDetails /></ProtectedRoute>} />
        <Route path="/rbacEditor" element={<RbacEditor />} />
        {/* <Route path="/logout" element={<Logout />} /> */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/bankTransactions" element={<BankTransactions />} />
        <Route path="/bankTransactions/add" element={<AddBankTransaction />} />
        <Route
          path="/bankTransactions/edit/:id"
          element={<AddBankTransaction />}
        />
        <Route
          path="/bankTransactions/order/:amount/:orderId"
          element={<AddBankTransaction />}
        />
        <Route path="/customerDetails" element={<CustomerDetails />} />
        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
        <Route path="/payment-opations/order/:orderId" element={<OpationsPage/>} />
      </Routes>
    </Router>
  );
}

export default App;
