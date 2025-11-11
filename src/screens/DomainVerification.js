import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const APPLEPAYFILE=process.env.REACT_APP_APPLE_PAY
const token = localStorage.getItem("token");

const DomainVerification = () => {
const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(true);

const fetchUploadedFile = useCallback(async (fileName, type) => {
  try {
    if (!fileName) return;

    const {data} = await axios.post(
      `${API_BASE_URL}/auth/read-file`,
      { fileName, containerType: type },
      
    );
console.log("response",data.content)
setFileContent(data.content)
    console.error("No valid file URL received from backend.");
  } catch (error) {
    console.error(`Error fetching ${type} file:`, error);
  }finally{

setLoading(false)
  }
}, []);


  useEffect(() => {
    
    fetchUploadedFile(APPLEPAYFILE, "documents");
  }, [fetchUploadedFile]);

return (
    <div style={{ padding: "20px" }}>
{/*      
      {loading ? (
        <p>Loading and reading file...</p>
      ) : fileContent ? ( */}
        <>
         
          <pre style="word-wrap: break-word; white-space: pre-wrap;"
            // style={{
            //   backgroundColor: "#f5f5f5",
            //   padding: "10px",
            //   borderRadius: "6px",
            //   whiteSpace: "pre-wrap",
            //   wordBreak: "break-word",
            // }}
          >
            {fileContent}
          </pre>
        </>
      {/* ) : (
        <p style={{ color: "red" }}>No content found.</p>
      )} */}
    </div>
  );
};

export default DomainVerification;
