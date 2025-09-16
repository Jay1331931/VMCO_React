import { Box, Tab, Tabs } from "@mui/material";
import { memo } from "react";
// import { useAppTheme } from "../context/ThemeContext";
import { useTranslation } from 'react-i18next';
const AnimatedTabs = ({ 
  tabs = [], 
  value, 
  onChange, 
  // New props for toggle functionality
  toggleMode = false, // Enable toggle mode
  leftLabel = "All", 
  rightLabel = "My Approval" 
}) => {
    const { mode } = "light";
    const { t } = useTranslation();
    const handleChange = (event, newIndex) => {
        if (toggleMode) {
            // For toggle mode, switch between true/false or "all"/"approval"
            const newValue = newIndex === 0 ? "all" : "approval";
            onChange(newValue);
        } else {
            // Original functionality for multiple tabs
            const selectedTab = tabs[newIndex];
            if (selectedTab) {
                onChange(selectedTab.value);
            }
        }
    };

    // If toggle mode is enabled, create the two tabs
    const toggleTabs = toggleMode ? [
        { value: "all", label: leftLabel },
        { value: "approval", label: rightLabel }
    ] : tabs;

    // Get current index based on value
    const currentIndex = toggleMode 
        ? (value === "all" || value === false ? 0 : 1)
        : tabs.findIndex((t) => t.value === value);

    return (
        <Box
            sx={{
                backgroundColor: mode === "dark" ? "#7F8C8D" : "#E6EDF5",
                borderRadius: "30px",
                padding: "4px",
                width: "fit-content",
            }}
        >
            <Tabs
                value={currentIndex}
                onChange={handleChange}
                TabIndicatorProps={{
                    sx: {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        borderRadius: "30px",
                        backgroundColor: "#002b5b",
                        zIndex: 0,
                        transition: "all 0.3s ease",
                    },
                }}
                sx={{
                    minHeight: 0,
                    position: "relative",
                    "& .MuiTabs-flexContainer": {
                        position: "relative",
                        zIndex: 1,
                    },
                    "& .MuiTab-root": {
                        textTransform: "none",
                        minHeight: 0,
                        maxHeight: "24px",
                        minWidth: toggleMode ? "80px" : "100px", // Adjust width for toggle
                        borderRadius: "30px",
                        fontSize: "12px",
                        color: "#000",
                        zIndex: 1,
                        padding: "6px 12px",
                    },
                    "& .Mui-selected": {
                        color: "#FFF !important",
                    },
                }}
            >
                {toggleTabs.map((tab) => (
                    <Tab 
                        key={tab.value} 
                        label={t(tab.label)} 
                        disableRipple 
                    />
                ))}
            </Tabs>
        </Box>
    );
};

export default memo(AnimatedTabs);