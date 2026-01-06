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
  return (
    <>
      <Router>
        <AppRoutes />
      </Router>

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
