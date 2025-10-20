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
        `${API_BASE_URL}/get-files`,
        { fileName, containerType: type },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          
        }
      );

      if (response.data) {
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error(`Error fetching ${type} file:`, error);
    }
  }, []);

  useEffect(() => {
    
    fetchUploadedFile(APPLEPAYFILE, "documents");
  }, [fetchUploadedFile]);

  return (
    <div>
      <h3>Domain verification file pending from Tap</h3>
    </div>
  );
};

export default DomainVerification;
