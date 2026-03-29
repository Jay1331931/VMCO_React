import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { PowerBIEmbed } from "powerbi-client-react";
import { models } from "powerbi-client";
import "../styles/pbiReports.css"; 
import api from "../utilities/api";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function PBIReports() {
  const [embedConfig, setEmbedConfig] = useState(null);
  const fetchEmbedConfig = useCallback(
        async () => {
            try {
                const res = await api.get(`${API_BASE_URL}/pbi-reports/getEmbedToken`);
                setEmbedConfig({
                    type: "report",
                    id: res.data.reportId,
                    embedUrl: res.data.embedUrl,
                    accessToken: res.data.embedToken,
                    tokenType: models.TokenType.Embed,
                    settings: {
                        panes: {
                            filters: { visible: true },
                            pageNavigaation: { visible: true }
                        },
                        navContentPaneEnabled: true
                    }
                });
            } catch (error) {
                console.error("Error fetching embed config:", error);
            }
        },        []
    );
  useEffect(() => {
    fetchEmbedConfig();
//     axios.get(`${API_BASE_URL}/reports/getEmbedToken`)
//       .then(res => {
//         setEmbedConfig({
//           type: "report",
//           id: res.data.reportId,
//           embedUrl: res.data.embedUrl,
//           accessToken: res.data.embedToken,
//           tokenType: models.TokenType.Embed,
//           settings: {
//     panes: {
//       filters: { visible: true },
//       pageNavigaation: { visible: true }
//     },
//     navContentPaneEnabled: true
//   }
//         });
//       });
  }, []);

  return (
    <div className="app-container">
      <div className="powerbi-wrapper">
        {embedConfig && (
        <PowerBIEmbed
          embedConfig={embedConfig}
        />
      )}
      </div>
    </div>
  );
}

export default PBIReports;
