import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import PageTransition from "./components/PageTransition";
import { usePageTransition } from "./hooks/usePageTransition";
import { getTransitionForRoute } from "./config/transitionConfig";
import Sidebar from "../src/components/Sidebar";
import OrdersMui from "./screens/ordersmui";
import Catalog from "./screens/catalog";
import SupportMui from "./screens/supportmui";
import MaintenanceMui from "./screens/maintenancemui";
import Cart from "./screens/cart";
import CustomersDetails from "./screens/customersDetails";
import LoginScreen from "./screens/login";
import CustomersOnboarding from "./screens/customersOnboarding";
import Checkout from "./screens/checkout";
import ForgotPassword from "./components/ForgotPassword";
import EmployeeLogin from "./screens/employeeLogin";
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
import AddInvites from "./components/AddInvites";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import OptionsPage from "./components/OptionsPage";
import Constants from "./constants";
import { useAuth } from "./context/AuthContext";
import { isTokenValid } from "./utilities/authUtils";
import RbacManager from "./utilities/rbac";
import BulkUploadBranchAndCustomer from "./screens/bulkUploadBranchAndCustomer";
import TapCardComponent from "./screens/TapCardComponent";
import DeliveryScheduleEditor from "./screens/deliveryScheduleEditor";
import PriceListEditor from "./screens/priceListEditor";
import OrderStagingTable from "./screens/orderStagingTable";
import CustomersMUI from "./screens/customersmui";
import DomainVerification from "./screens/DomainVerification";
import ApprovalHistory from "./screens/approvalHistory";
import PaymentLines from "./components/PaymentLines";
import ApplePayComponent from "./screens/ApplePayComponent";
import ApplePayment from "./components/ApplePayment";
import ApplePaymentReact from "./components/ApplePaymentReact";
import PrivacyPolicy from "./screens/PrivacyPolicy";
import ContactUs from "./screens/ContactUs";
import CoolingPeriodEditor from "./screens/coolingPeriodEditor";
import PricingPolicyEditor from "./screens/pricingPolicyEditor";
import PBIReport from "./screens/pbiReports";
import DataManagement from "./screens/dataManagement";
import { App } from "@capacitor/app";
import Swal from "sweetalert2";
import HomePage from "./screens/homePage";
import logo from "./assets/talab_point_logo.png"
import LoadingSpinner from "./components/LoadingSpinner";
function AppRoutes() {
  const { user, token, loading } = useAuth();
  const [pageName, setPageName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get transition type based on current route using configuration
  const transitionType = getTransitionForRoute(location.pathname);

  const tokenFromStorage = localStorage.getItem("token");
  const tokenIsValid =
    (token || tokenFromStorage) && isTokenValid(token || tokenFromStorage);

  useEffect(() => {
    if (user) {
      const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin"
          ? user?.designation
          : user?.roles[0],
        "SidebarList"
      );

      const pages = [
        "Catalog",
        "Orders",
        "Support",
        "Maintenance",
        "Customers",
        "Bank Transfer",
        "Company",
      ];
      const isV = rbacMgr.isV.bind(rbacMgr);

      for (const page of pages) {
        if (isV(page)) {
          if (page?.toLowerCase() === "catalog") {
            setPageName("home");
            break;
          } else {
            setPageName(page);
            break; // important: stop the loop once found
          }
        }
      }
    }
  }, [user]);

  //     const role= user?.roles[0] && user?.roles[0]?.toLowerCase() ==="employee" ?  user?.designation : user?.roles[0];
  // if(tokenIsValid){
  // RbacManager.loadRbacConfig(role,token);
  // }
  useEffect(() => {
    if (!window.Capacitor) return;

    App.addListener("backButton", () => {
      // No back history → DO NOTHING
      if (window.history.length <= 1) {
        return;
      }

      // Prevent going to login/root
      if (
        location.pathname === "/" ||
        location.pathname === "/login" ||
        location.pathname === "/login/employee"
      ) {
        return;
      }

      navigate(-1);
    });

    return () => {
      App.removeAllListeners(); // ✅ FIX
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const source = params.get("source");

  // Save source to sessionStorage if coming from d365
  if (source === "d365") {
    sessionStorage.setItem("accessSource", "d365");
  }

  // Save intended URL if token is invalid and not already on login/public pages
  // const publicPaths = ["/login", "/login/employee"];
  // const publicPaths = ["/pbiReport"];
  // const isPublicPath = publicPaths.some(p => location.pathname.startsWith(p));
// ✅ Only save redirect if STRICTLY /pbiReport?source=d365
  const isPbiReportFromD365 = 
    location.pathname === "/pbiReport" && source === "d365";

  if (isPbiReportFromD365) {
    const currentToken = localStorage.getItem("token");
    const currentTokenValid = currentToken && isTokenValid(currentToken);

    // ✅ Only save if token is invalid (user not logged in)
    if (!currentTokenValid) {
      sessionStorage.setItem("redirectAfterLogin", "/pbiReport?source=d365");
      console.log("✅ Saved redirect: /pbiReport?source=d365");
    }
  } else {
    // ✅ Clear any previously saved redirect if navigating elsewhere
    sessionStorage.removeItem("redirectAfterLogin");
  }
  // if (!tokenIsValid && !isPublicPath) {
  //   sessionStorage.setItem("redirectAfterLogin", location.pathname + location.search); // ✅ saves /pbiReport?source=d365
  // }
}, [location]);

if (loading) {
  return (
    <div className="loader-container">
  <div className="loader-logo-wrapper">
    <img src={logo} alt="Talab Point Logo" className="loader-logo" />
  </div>
  <style>
    {`
      .loader-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        background: white; 
        z-index: 9999;
      }

      .loader-logo-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        border-radius: 50%;
        /* Gradient Transition Effect */
        // background: linear-gradient(45deg, #ffffff, #f0f0f0);
        // box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        animation: rotate360 3s linear infinite;
      }

      .loader-logo {
        width: 100px;  /* Increased from 50px for better visibility */
        height: 100px;
        object-fit: contain;
      }

      @keyframes rotate360 {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}
  </style>
</div>
  );
}

  // const tokenIsValid = (token || tokenname) && isTokenValid(token ||tokenname);
  return (
    <Routes>
      <Route
        path="/"
        element={
          tokenIsValid ? (
            <Navigate to={`/${pageName}`} replace />
          ) : (
            <LoginScreen />
          )
        }
      />

      <Route path="privacy-policy" element={<PrivacyPolicy />} />

      <Route path="contact-us" element={<ContactUs />} />
      {/* <Route path="/orders" element={<ProtectedRoute page="orders"><Orders /></ProtectedRoute>} /> */}

      <Route
        path="/orders"
        element={
          <ProtectedRoute page="orders">
            <OrdersMui />
          </ProtectedRoute>
        }
      />
      {/* <Route path="/customers" element={<ProtectedRoute page="customers"><Customers /></ProtectedRoute>}/> */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute page="customers">
            <CustomersMUI />
          </ProtectedRoute>
        }
      />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:entityname" element={<Catalog />} />
      <Route
        path="/support"
        element={
          <ProtectedRoute page="support">
            <SupportMui />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute page="maintenance">
            <MaintenanceMui />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute page="cart">
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route path="/customersDetails" element={<CustomersDetails />} />
      <Route path="/login" element={<LoginScreen />} />
      {/* <Route path="/.well-known/apple-developer-merchantid-domain-association" element={<DomainVerification />} />   component={DomainVerification} */}

      <Route path="/login/employee" element={<LoginScreen />} />
      <Route path="/customers/registration" element={<CustomersOnboarding />} />
      <Route
        path="/customers/registration/:id"
        element={<CustomersOnboarding />}
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute page="checkout">
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route path="/forgotPassword" element={<ForgotPassword />} />
      <Route
        path="/orderDetails"
        element={
          <ProtectedRoute page="orderDetails">
            <OrderDetailsMui />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supportDetails"
        element={
          <ProtectedRoute page="supportDetails">
            <SupportDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenanceDetails"
        element={
          <ProtectedRoute page="maintenanceDetails">
            <MaintenanceDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rbacEditor"
        element={
          <ProtectedRoute page="rbacEditor">
            <RbacEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/deliveryScheduleEditor"
        element={
          <ProtectedRoute page="deliveryScheduleEditor">
            <DeliveryScheduleEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coolingPeriodEditor"
        element={
          <ProtectedRoute page="coolingPeriodEditor">
            <CoolingPeriodEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricingPolicyEditor"
        element={
          <ProtectedRoute page="pricingPolicyEditor">
            <PricingPolicyEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/priceListEditor"
        element={
          <ProtectedRoute page="priceListEditor">
            <PriceListEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvalHistory"
        element={
          <ProtectedRoute page="approvalHistory">
            <ApprovalHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orderStagingTable"
        element={
          <ProtectedRoute page="orderStagingTable">
            <OrderStagingTable />
          </ProtectedRoute>
        }
      />
      {/* <Route path="/logout" element={<Logout />} /> */}
      <Route path="/payment" element={<Payment />} />
      <Route path="/bankTransactions" element={<BankTransactions />} />
      <Route path="/bankTransactions/add" element={<AddBankTransaction />} />
      <Route path="/invite/add" element={<AddInvites />} />
      <Route
        path="/bankTransactions/edit/:id"
        element={<AddBankTransaction />}
      />
      <Route
        path="/bankTransactions/order/:amount/:orderId/:orderType"
        element={<AddBankTransaction />}
      />
      <Route path="/customerDetails" element={<CustomerDetails />} />
      {/* Catch-all route for 404 Not Found */}
      <Route path="*" element={<NotFound />} />
      <Route
        path="/payment-options/order/:orderId/:orderType"
        element={<OptionsPage />}
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute page="reports">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/upload"
        element={
          <ProtectedRoute page="uploads">
            <BulkUploadBranchAndCustomer />
          </ProtectedRoute>} />
      <Route
        path="/dataManagement"
        element={
          <ProtectedRoute page="dataManagement">
            <DataManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apiLogsReport"
        element={
          <ProtectedRoute page="reports">
            <ApiLogsReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tapcard/:orderId/:amount/:customerId/:orderType"
        element={<TapCardComponent />}
      />
      <Route
        path="/apple-pay/:orderId/:amount/:customerId/:orderType"
        element={<ApplePayComponent />}
      />
      <Route path="/payments/:orderId" element={<PaymentLines />} />
      <Route path="/apple-pay/testing" element={<ApplePaymentReact />} />
      <Route path="/home" element={
        <ProtectedRoute page="home">
          <HomePage />
        </ProtectedRoute>
      } />
      <Route path="/pbiReport" element={
        <ProtectedRoute page="pbiReport">
          <PBIReport />
        </ProtectedRoute>
      } />
      </Routes>
  );
}

export default AppRoutes;
