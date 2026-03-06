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
const currentIosVersion=process.env.REACT_APP_TALAB_IOS_VERSION
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const isIOSMobile = /iPhone/i.test(navigator.userAgent);
const isAndroidMobile = /Android/i.test(navigator.userAgent);
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
    }, 500);
  }

  window.addEventListener("beforeunload", () => {
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
    let device='android'
    if (!isMobile ) {
      return;
    }else if (isIOSMobile){
      device='ios'
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/get-latest-version?platform=${device}`);
      const result = await response.json();
      if (result.status === "Ok" && result.data) {
        const latestV = result?.data?.version_number;
        setLatestVersion(latestV);
        setAppVersions(result.data);
        if (lastSkippedVersion !== latestV && latestV !== currentVersion && isAndroidMobile && result.data.platform?.toLowerCase() === 'android')  {
          setShowUpdatePopup(true);
        }else if (lastSkippedVersion !==latestV && latestV !== currentIosVersion && isIOSMobile && result.data.platform?.toLowerCase() === "ios"){
          setShowUpdatePopup(true)
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
  console.log("isMO",isMobile)
    if (Capacitor.isNativePlatform() && isMobile ) {
      console.log("isIos",isIOSMobile,isAndroidMobile)
      if(isAndroidMobile){
        window.open("https://play.google.com/store/apps/details?id=com.vmco.android.talabpoint", "_system");
      }else if(isIOSMobile){
        // iOS App Store universal link for direct app page with update capability
        console.log("clicked on update now with ")
        window.open("itms-apps://itunes.apple.com/in/app/id6756706821", "_system");
      }
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
