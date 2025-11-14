import { Box, Tab, Tabs } from "@mui/material";
import { memo } from "react";
import { useTranslation } from 'react-i18next';

const AnimatedTabs = ({
    tabs = [],
    value,
    onChange,
    toggleMode = false,
    leftLabel,
    rightLabel,
    badgeCount = 0,
    showBadgeOnFirstTab = false
}) => {
    const { mode } = "light";
    const { t } = useTranslation();

    const getLabels = () => {
        if (leftLabel && rightLabel) {
            return { left: leftLabel, right: rightLabel };
        }

        if (value === "all" || value === "approval") {
            return { left: "All", right: "My Approval" };
        } else if (value === "open" || value === "closed") {
            return { left: "Open", right: "Closed" };
        }

        return { left: "All", right: "My Approval" };
    };

    const labels = getLabels();

    const handleChange = (event, newIndex) => {
        if (toggleMode) {
            let newValue;

            // Handle custom labels (like "Pending" and "All")
            if (leftLabel && rightLabel) {
                newValue = newIndex === 0 ? leftLabel.toLowerCase() : rightLabel.toLowerCase();
            } else if (labels.left === "All" && labels.right === "My Approval") {
                newValue = newIndex === 0 ? "all" : "approval";
            } else if (labels.left === "Open" && labels.right === "Closed") {
                newValue = newIndex === 0 ? "open" : "closed";
            } else {
                newValue = newIndex === 0 ? "all" : "approval";
            }
            onChange(newValue);
        } else {
            const selectedTab = tabs[newIndex];
            if (selectedTab) {
                onChange(selectedTab.value);
            }
        }
    };

    const toggleTabs = toggleMode ? [
        { value: "left", label: labels.left },
        { value: "right", label: labels.right }
    ] : tabs;

    // Determine current index based on value
    const getCurrentIndex = () => {
        if (!toggleMode) {
            return tabs.findIndex((t) => t.value === value);
        }

        // For custom labels
        if (leftLabel && rightLabel) {
            const normalizedValue = value.toLowerCase();
            const normalizedLeft = leftLabel.toLowerCase();
            const normalizedRight = rightLabel.toLowerCase();

            return normalizedValue === normalizedLeft ? 0 : 1;
        }

        // For default behavior
        if (value === "all" || value === "open" || value === false) {
            return 0;
        }
        return 1;
    };

    const currentIndex = getCurrentIndex();

    const renderTabLabel = (tab, index) => {
        if (showBadgeOnFirstTab && index === 0 && badgeCount > 0) {
            return `${t(tab.label)} (${badgeCount})`;
        }
        return t(tab.label);
    };

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
                {toggleTabs.map((tab, index) => (
                    <Tab
                        key={tab.value}
                        label={renderTabLabel(tab, index)}
                        disableRipple
                    />
                ))}
            </Tabs>
        </Box>
    );
};

export default memo(AnimatedTabs);