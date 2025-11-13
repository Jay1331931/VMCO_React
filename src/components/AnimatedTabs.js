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
            if (labels.left === "All" && labels.right === "My Approval") {
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
        { value: value === "all" || value === "approval" ? "all" : "open", label: labels.left },
        { value: value === "all" || value === "approval" ? "approval" : "closed", label: labels.right }
    ] : tabs;

    const currentIndex = toggleMode
        ? (value === "all" || value === "open" || value === false ? 0 : 1)
        : tabs.findIndex((t) => t.value === value);

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
// import { Box, Tab, Tabs, useMediaQuery } from "@mui/material";
// import { memo } from "react";
// import { useTranslation } from "react-i18next";

// const AnimatedTabs = ({
//   tabs = [],
//   value,
//   onChange,
//   toggleMode = false,
//   leftLabel,
//   rightLabel,
// }) => {
//   const { mode } = "light";
//   const { t } = useTranslation();

//   // ✅ Detect mobile
//   const isMobile = useMediaQuery("(max-width: 600px)");

//   const getLabels = () => {
//     if (leftLabel && rightLabel) return { left: leftLabel, right: rightLabel };
//     if (value === "all" || value === "approval")
//       return { left: "All", right: "My Approval" };
//     if (value === "open" || value === "closed")
//       return { left: "Open", right: "Closed" };
//     return { left: "All", right: "My Approval" };
//   };

//   const labels = getLabels();

//   const handleChange = (event, newIndex) => {
//     if (toggleMode) {
//       let newValue;
//       if (labels.left === "All" && labels.right === "My Approval")
//         newValue = newIndex === 0 ? "all" : "approval";
//       else if (labels.left === "Open" && labels.right === "Closed")
//         newValue = newIndex === 0 ? "open" : "closed";
//       else newValue = newIndex === 0 ? "all" : "approval";

//       onChange(newValue);
//     } else {
//       const selectedTab = tabs[newIndex];
//       if (selectedTab) onChange(selectedTab.value);
//     }
//   };

//   const toggleTabs = toggleMode
//     ? [
//         {
//           value: value === "all" || value === "approval" ? "all" : "open",
//           label: labels.left,
//         },
//         {
//           value: value === "all" || value === "approval" ? "approval" : "closed",
//           label: labels.right,
//         },
//       ]
//     : tabs;

//   const currentIndex = toggleMode
//     ? value === "all" || value === "open" || value === false
//       ? 0
//       : 1
//     : tabs.findIndex((t) => t.value === value);

//   return (
//     <Box
//       sx={{
//         backgroundColor: mode === "dark" ? "#7F8C8D" : "#E6EDF5",
//         borderRadius: "30px",
//         padding: "4px",
//         width: isMobile ? "180px" : "300px",
//         height: isMobile ? "80px" : "auto",
//         display: "flex",
//         flexDirection: isMobile ? "column" : "row",
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Tabs
//         orientation={isMobile ? "vertical" : "horizontal"} // ✅ switches to vertical mode
//         value={currentIndex}
//         onChange={handleChange}
//         TabIndicatorProps={{
//           sx: {
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             borderRadius: "30px",
//             backgroundColor: "#002b5b",
//             transition: "all 0.3s ease",
//             width: isMobile ? "100%" : "auto",
//             height: isMobile ? "50%" : "100%",
//           },
//         }}
//         sx={{
//           minHeight: 0,
//           "& .MuiTabs-flexContainer": {
//             flexDirection: isMobile ? "column" : "row",
//             alignItems: "center",
//             justifyContent: "center",
//           },
//           "& .MuiTab-root": {
//             textTransform: "none",
//             minHeight: 0,
//             fontSize: "12px",
//             color: "#000",
//             borderRadius: "30px",
//             padding: isMobile ? "6px 8px" : "6px 12px",
//             width: isMobile ? "100%" : "auto",
//             zIndex: 1,
//           },
//           "& .Mui-selected": {
//             color: "#FFF !important",
//           },
//         }}
//       >
//         {toggleTabs.map((tab) => (
//           <Tab key={tab.value} label={t(tab.label)} disableRipple />
//         ))}
//       </Tabs>
//     </Box>
//   );
// };

// export default memo(AnimatedTabs);
