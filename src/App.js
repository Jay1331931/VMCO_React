import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import VersionPopup from "./components/VersionPopup"; // You'll need to create this component
import AppRoutes from "./AppRoutes";
import usePlatform from "../src/utilities/platform";
const currentVersion = process.env.REACT_APP_TALAB_VERSION;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const isIOSsMobile= /iPhone/i.test(navigator.userAgent);
const lastSkippedVersion = localStorage.getItem('last_skipped_version');

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Function to check actual internet connectivity
    const checkActualConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        // Try to fetch a small resource to verify internet
        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return true;
      } catch (error) {
        return false;
      }
    };

    const updateNetworkStatus = async () => {
      const browserStatus = navigator.onLine;
      
      if (!browserStatus) {
        // Browser says offline
        setIsOnline(false);
        setInitialCheckDone(true);
        return;
      }
      
      // Browser says online, verify actual connection
      if (!initialCheckDone) {
        // First time check - verify actual connectivity
        const actualConnection = await checkActualConnection();
        setIsOnline(actualConnection);
        setInitialCheckDone(true);
      } else {
        // Subsequent checks - use browser status for speed
        setIsOnline(browserStatus);
        
        // But verify in background
        checkActualConnection().then(actual => {
          if (!actual && browserStatus) {
            setIsOnline(false);
          }
        });
      }
    };

    // Initial check
    updateNetworkStatus();

    // Listen for browser events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Set up periodic checks (every 10 seconds)
    const intervalId = setInterval(updateNetworkStatus, 10000);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      clearInterval(intervalId);
    };
  }, [initialCheckDone]);

  return isOnline;
};

const CleanOfflineScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        
        {/* Icon */}
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          backgroundColor: '#F6921E',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '25px'
        }}>
          <span style={{ 
            color: 'white', 
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            !
          </span>
        </div>
        
        {/* Text */}
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#0B4C45',
          marginBottom: '8px'
        }}>
          Connection Lost
        </h1>
        
        <p style={{ 
          color: '#666',
          marginBottom: '25px',
          fontSize: '15px'
        }}>
          Unable to connect to the internet
        </p>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#009345',
            color: 'white',
            // border: 'none',
            padding: '10px 32px',
            fontSize: '15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
        
      </div>
    </div>
  );
};

function App() {
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [appVersion,setAppVersions] =useState(null);
const isMobile=usePlatform()
  const updateHeaderTop = () => {
    const header = document.querySelector(".app-header");
    if (header) {
      document.documentElement.style.setProperty(
        "--catalog-header-top",
        `${header.offsetHeight}px`
      );
    }
  };

  useEffect(() => {
    updateHeaderTop();
    window.addEventListener("resize", updateHeaderTop);
    return () => window.removeEventListener("resize", updateHeaderTop);
  }, []);
  const lockOrientation = async () => {
    if (Capacitor.isNative) {
      await ScreenOrientation.lock({ orientation: "portrait" });
    }
  };

  // Call in useEffect or componentDidMount

  const checkForUpdates = async () => {
   
        if (!isMobile  || isIOSsMobile ) {
          return;
        }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/get-latest-version?platform=android`);
      const result = await response.json();

      if (result.status === "Ok" && result.data) {
        const latestVersion = result?.data?.version_number;
        setLatestVersion(latestVersion);
        setAppVersions(result.data)
          if (lastSkippedVersion ==  result?.data?.version_number) {
      return; 
    }
        if (latestVersion !== currentVersion) {
          setShowUpdatePopup(true);
        }
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };
  useEffect(() => {
    lockOrientation();
    
    checkForUpdates();

    // const updateInterval = setInterval(checkForUpdates, 5000);

    // return () => {
    //   clearInterval(updateInterval);
    // };
  }, []);
  const handleUpdateClick = () => {
    if (Capacitor.isNativePlatform()) {
      // Open Play Store for Android
      window.open(
        "https://play.google.com/store/apps/details?id=com.vmco.android.talabpoint",
        "_system"
      );
    } 
    setShowUpdatePopup(false);
  };
  const isOnline = useNetworkStatus();
  
  return (
    <>
     {!isOnline ? (
    <CleanOfflineScreen 
        />




      ) :  <Router>
        <AppRoutes />
      </Router>}
   

      {showUpdatePopup && latestVersion && (
        <VersionPopup
        appVersion={appVersion}
          currentVersion={currentVersion}
          latestVersion={latestVersion}
          onUpdate={handleUpdateClick}
          
          onClose={() => setShowUpdatePopup(false)}
        />
      )}
    </>
  );
}

export default App;
