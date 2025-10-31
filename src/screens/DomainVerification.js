import React, { useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const APPLEPAYFILE=process.env.REACT_APP_APPLE_PAY
const token = localStorage.getItem("token");

const DomainVerification = () => {
const fetchUploadedFile = useCallback(async (fileName, type) => {
  try {
    if (!fileName) return;

    const response = await axios.post(
      `${API_BASE_URL}/auth/get-files`,
      { fileName, containerType: type },
      
    );

    const fileData = response?.data?.data;
    if (fileData?.url) {
      const link = document.createElement("a");
      link.href = fileData.url; 
      link.download = fileData.fileName || fileName; 
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    console.error("No valid file URL received from backend.");
  } catch (error) {
    console.error(`Error fetching ${type} file:`, error);
  }
}, []);


  useEffect(() => {
    
    fetchUploadedFile(APPLEPAYFILE, "documents");
  }, [fetchUploadedFile]);

  return (
    <div>
      <h3>Domain verification file downloaded</h3>
    </div>
  );
};

export default DomainVerification;
