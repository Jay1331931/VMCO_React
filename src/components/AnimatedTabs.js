import { Box, Tab, Tabs } from "@mui/material";
import { memo } from "react";
import { useTranslation } from 'react-i18next';

const AnimatedTabs = ({ 
  tabs = [], 
  value, 
  onChange, 
  toggleMode = false,
  leftLabel, // Made optional - will be auto-determined if not provided
  rightLabel // Made optional - will be auto-determined if not provided
}) => {
    const { mode } = "light";
    const { t } = useTranslation();

    // Auto-determine labels based on value if not explicitly provided
    const getLabels = () => {
        if (leftLabel && rightLabel) {
            // If explicitly provided, use them
            return { left: leftLabel, right: rightLabel };
        }

        // Auto-determine based on current value
        if (value === "all" || value === "approval") {
            return { left: "All", right: "My Approval" };
        } else if (value === "open" || value === "closed") {
            return { left: "Open", right: "Closed" };
        }

        // Default fallback
        return { left: "All", right: "My Approval" };
    };

    const labels = getLabels();

    const handleChange = (event, newIndex) => {
        if (toggleMode) {
            // Determine the values based on current labels
            let newValue;
            if (labels.left === "All" && labels.right === "My Approval") {
                newValue = newIndex === 0 ? "all" : "approval";
            } else if (labels.left === "Open" && labels.right === "Closed") {
                newValue = newIndex === 0 ? "open" : "closed";
            } else {
                // Fallback for custom labels
                newValue = newIndex === 0 ? "all" : "approval";
            }
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
        { value: value === "all" || value === "approval" ? "all" : "open", label: labels.left },
        { value: value === "all" || value === "approval" ? "approval" : "closed", label: labels.right }
    ] : tabs;

    // Get current index based on value
    const currentIndex = toggleMode 
        ? (value === "all" || value === "open" || value === false ? 0 : 1)
        : tabs.findIndex((t) => t.value === value);

    return (
        <Box
            sx={{
                backgroundColor: mode === "dark" ? "#7F8C8D" : "#E6EDF5",
                borderRadius: "30px",
                padding: "4px",
                width: "300px",
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
                        minWidth: toggleMode ? "100px" : "100px",
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
