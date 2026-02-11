import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import VersionPopup from "./components/VersionPopup";
import AppRoutes from "./AppRoutes";
import usePlatform from "../src/utilities/platform";
import { Network } from '@capacitor/network';
import Swal from "sweetalert2";
import "./styles/transitions.css";

const currentVersion = process.env.REACT_APP_TALAB_VERSION;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const isIOSsMobile = /iPhone/i.test(navigator.userAgent);
const lastSkippedVersion = localStorage.getItem('last_skipped_version');

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };
    checkStatus();

    const handler = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
      if (status.connected) {
        sessionStorage.setItem("pageReloadReason", "Network reconnected - automatic reload");
        window.location.reload();
      }
    });
  }, []);

  return isOnline;
};

const initializeReloadDetection = () => {
  const reloadReason = sessionStorage.getItem("pageReloadReason");
  if (reloadReason) {
    setTimeout(() => {

       sessionStorage.removeItem("pageReloadReason");
      // Swal.fire({
      //   title: "⚠️ Page Reloaded",
      //   html: `<strong>Reason:</strong> ${reloadReason}<br/><small>Time: ${new Date().toLocaleTimeString()}</small>`,
      //   icon: "warning",
      //   confirmButtonText: "OK",
      //   allowOutsideClick: false,
      //   didOpen: () => {
      //     sessionStorage.removeItem("pageReloadReason");
      //   }
      // });
    }, 500);
  }

  window.addEventListener("beforeunload", () => {
    // FIX: Check if file picker is open before setting reload reason
    const isPickerOpen = sessionStorage.getItem("file_picker_open") === "true";
    if (!isPickerOpen) {
      sessionStorage.setItem("pageReloadReason", "User action (refresh/navigate)");
    }
  });
};

function App() {
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [appVersion, setAppVersions] = useState(null);
  const isMobile = usePlatform();

  useEffect(() => {
    initializeReloadDetection();
    
    // FIX: Clear picker flag when app regains focus (user returns from gallery)
    const handleFocus = () => {
      setTimeout(() => {
        sessionStorage.removeItem("file_picker_open");
      }, 1000);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    const updateHeaderTop = () => {
      const header = document.querySelector(".app-header");
      if (header) {
        document.documentElement.style.setProperty("--catalog-header-top", `${header.offsetHeight}px`);
      }
    };
    updateHeaderTop();
    window.addEventListener("resize", updateHeaderTop);
    return () => window.removeEventListener("resize", updateHeaderTop);
  }, []);

  const lockOrientation = async () => {
    if (Capacitor.isNative) {
      await ScreenOrientation.lock({ orientation: "portrait" });
    }
  };

  const checkForUpdates = async () => {
    if (!isMobile || isIOSsMobile) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/get-latest-version?platform=android`);
      const result = await response.json();
      if (result.status === "Ok" && result.data) {
        const latestV = result?.data?.version_number;
        setLatestVersion(latestV);
        setAppVersions(result.data);
        if (lastSkippedVersion !== latestV && latestV !== currentVersion) {
          setShowUpdatePopup(true);
        }
      }
    } catch (error) {
      console.error("Update check failed", error);
    }
  };

  useEffect(() => {
    lockOrientation();
    checkForUpdates();
  }, []);

  const handleUpdateClick = () => {
    if (Capacitor.isNativePlatform()) {
      window.open("https://play.google.com/store/apps/details?id=com.vmco.android.talabpoint", "_system");
    }
    setShowUpdatePopup(false);
  };

  return (
    <Router>
      <AppRoutes />
      {showUpdatePopup && latestVersion && (
        <VersionPopup
          appVersion={appVersion}
          currentVersion={currentVersion}
          latestVersion={latestVersion}
          onUpdate={handleUpdateClick}
          onClose={() => setShowUpdatePopup(false)}
        />
      )}
    </Router>
  );
}

export default App;