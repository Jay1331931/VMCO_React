import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../src/components/Sidebar";
import Orders from "./screens/orders";
import OrdersMui from "./screens/ordersmui";
import Customers from "./screens/customers";
import Catalog from "./screens/catalog";
import Support from "./screens/support";
import SupportMui from "./screens/supportmui";
import Maintenance from "./screens/maintenance";
import MaintenanceMui from "./screens/maintenancemui";
import Cart from "./screens/cart";
import CustomersDetails from "./screens/customersDetails";
import LoginScreen from "./screens/login";
import CustomersOnboarding from "./screens/customersOnboarding";
import Checkout from "./screens/checkout";
import ForgotPassword from "./components/ForgotPassword";
import EmployeeLogin from "./screens/employeeLogin";
import OrderDetails from "./screens/orderDetails";
import OrderDetailsMui from "./screens/orderDetailsmui";
import SupportDetails from "./screens/supportDetails";
import MaintenanceDetails from "./screens/maintenanceDetails";
// import Logout from "./screens/logout";
import RbacEditor from "./screens/rbacEditor";
import CustomerDetails from "./screens/customerDetails";
import Payment from "./screens/payment";
import BankTransactions from "./screens/BankTransactions";
import Reports from "./screens/reports";
import ApiLogsReport from "./screens/apiLogsReport";
import AddBankTransaction from "./components/AddBankTransaction";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import OptionsPage from "./components/OptionsPage";
import Constants from "./constants";
import { useAuth } from "./context/AuthContext";
import { isTokenValid } from './utilities/authUtils';
import RbacManager from "./utilities/rbac";
import BulkUploadBranchAndCustomer from "./screens/bulkUploadBranchAndCustomer";
import TapCardComponent from "./screens/TapCardComponent";
import DeliveryScheduleEditor from "./screens/deliveryScheduleEditor";
import PriceListEditor from "./screens/priceListEditor";
import CustomersMUI from "./screens/customersmui";
import DomainVerification from "./screens/DomainVerification";
import ApprovalHistory from "./screens/approvalHistory";
import PaymentLines from "./components/PaymentLines";
import ApplePayComponent from "./screens/ApplePayComponent";
import ApplePayment from "./components/ApplePayment";
import ApplePaymentReact from "./components/ApplePaymentReact";
function App() {
  const { user, token, loading } = useAuth();
  const [pageName, setPageName] = useState("")

  useEffect(() => {
    if (user) {
      const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin"
          ? user?.designation
          : user?.roles[0],
        "SidebarList"
      );

      const pages = ["Catalog", "Orders", "Support", "Maintenance", "Customers", "Bank Transfer", "Company"];
      const isV = rbacMgr.isV.bind(rbacMgr);

      for (const page of pages) {
        if (isV(page)) {
          setPageName(page);
          break; // important: stop the loop once found
        }
      }
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>; // or a loading spinner
  }

  const tokenIsValid = token && isTokenValid(token);
  //     const role= user?.roles[0] && user?.roles[0]?.toLowerCase() ==="employee" ?  user?.designation : user?.roles[0];
  // if(tokenIsValid){
  // RbacManager.loadRbacConfig(role,token);
  // }

  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<LoginScreen />} /> */}
        <Route path="/" element={tokenIsValid ? <Navigate to={`/${pageName}`} /> : <LoginScreen />} />

        {/* <Route path="/orders" element={<ProtectedRoute page="orders"><Orders /></ProtectedRoute>} /> */}
        <Route path="/orders" element={<ProtectedRoute page="orders"><OrdersMui /></ProtectedRoute>} />
        {/* <Route path="/customers" element={<ProtectedRoute page="customers"><Customers /></ProtectedRoute>}/> */}
        <Route path="/customers" element={<ProtectedRoute page="customers"><CustomersMUI /></ProtectedRoute>} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/support" element={<ProtectedRoute page="support"><SupportMui /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute page="maintenance"><MaintenanceMui /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute page="cart"><Cart /></ProtectedRoute>} />
        <Route path="/customersDetails" element={<CustomersDetails />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/.well-known/apple-developer-merchantid-domain-association" element={<DomainVerification />} />   {/*component={DomainVerification} */}

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
        <Route path="/orderDetails" element={<ProtectedRoute page="orderDetails"><OrderDetailsMui /></ProtectedRoute>} />
        <Route path="/supportDetails" element={<ProtectedRoute page="supportDetails"><SupportDetails /></ProtectedRoute>} />
        <Route path="/maintenanceDetails" element={<ProtectedRoute page="maintenanceDetails"><MaintenanceDetails /></ProtectedRoute>} />
        <Route path="/rbacEditor" element={<ProtectedRoute page="rbacEditor"><RbacEditor /></ProtectedRoute>} />
        <Route path="/deliveryScheduleEditor" element={<ProtectedRoute page="deliveryScheduleEditor"><DeliveryScheduleEditor /></ProtectedRoute>} />
        <Route path="/priceListEditor" element={<ProtectedRoute page="priceListEditor"><PriceListEditor /></ProtectedRoute>} />
        <Route path="/approvalHistory" element={<ProtectedRoute page="approvalHistory"><ApprovalHistory /></ProtectedRoute>} />
        {/* <Route path="/logout" element={<Logout />} /> */}
        <Route path="/payment" element={<Payment />} />
        <Route path="/bankTransactions" element={<BankTransactions />} />
        <Route path="/bankTransactions/add" element={<AddBankTransaction />} />
        <Route path="/bankTransactions/edit/:id" element={<AddBankTransaction />} />
        <Route path="/bankTransactions/order/:amount/:orderId" element={<AddBankTransaction />} />
        <Route path="/admin/upload" element={<BulkUploadBranchAndCustomer />} />
        <Route path="/customerDetails" element={<CustomerDetails />} />
        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
        <Route path="/payment-options/order/:orderId/:orderType" element={<OptionsPage />} />
        <Route path="/reports" element={<ProtectedRoute page="reports"><Reports /></ProtectedRoute>} />
        <Route path="/apiLogsReport" element={<ProtectedRoute page="reports"><ApiLogsReport /></ProtectedRoute>} />
        <Route path="/tapcard/:orderId/:amount/:customerId/:orderType" element={<TapCardComponent />} />
         <Route path="/applyPay/:orderId/:amount/:customerId/:orderType" element={<ApplePayComponent/>}/>
        <Route path="/payments/:orderId" element={<PaymentLines />} />
        <Route path='/apply-pay/testing' element={<ApplePaymentReact/>} />
      </Routes>
    </Router>
  );
}

export default App;