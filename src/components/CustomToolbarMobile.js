import React from "react";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  FilterAlt as FilterIcon,
  ViewColumn as ViewColumnIcon,
  FileDownload as FileDownloadIcon,
  UploadFile as UploadFileIcon,
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const CustomToolbarMobile = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  filterAnchor,
  setFilterAnchor,
  handleFilterChange,
  handleAddOrder,
  HandleBulkOrderUpload,
  handleApproval,
  isApprovalMode,
  isV,
  t,
}) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [dateAnchor, setDateAnchor] = React.useState(null);

  const open = Boolean(anchorEl);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
        mb: 1.5,
      }}
    >
      {/* 🔍 Search Input */}
      <TextField
        fullWidth
        size="small"
        placeholder={t("Search orders...")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch(e.target.value);
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            fontSize: "14px",
          },
        }}
      />

      {/* 🧭 Action Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {/* 🔎 Filter */}
        <Tooltip title={t("Filters")}>
          <IconButton onClick={handleFilterClick} size="small" color="primary">
            <FilterIcon />
          </IconButton>
        </Tooltip>

        {/* 📆 Date Range */}
        <Tooltip title={t("Date Range")}>
          <IconButton
            onClick={(e) => setDateAnchor(e.currentTarget)}
            size="small"
            color="primary"
          >
            <CalendarMonthIcon />
          </IconButton>
        </Tooltip>

        {/* 📊 Column Visibility (optional) */}
        <Tooltip title={t("Columns")}>
          <IconButton size="small" color="primary">
            <ViewColumnIcon />
          </IconButton>
        </Tooltip>

        {/* 📤 Export */}
        <Tooltip title={t("Export")}>
          <IconButton size="small" color="primary">
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>

        {/* 📥 Upload */}
        {isV("uploadButton") && (
          <Tooltip title={t("Upload")}>
            <IconButton
              size="small"
              color="primary"
              onClick={HandleBulkOrderUpload}
            >
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* ➕ Add */}
        {isV("addButton") && (
          <Tooltip title={t("Add Order")}>
            <IconButton
              size="small"
              color="primary"
              onClick={handleAddOrder}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* 🧾 Approval */}
        {isV("approvalButton") && (
          <Button
            variant={isApprovalMode ? "contained" : "outlined"}
            size="small"
            onClick={handleApproval}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {isApprovalMode ? t("Exit Approval") : t("Approvals")}
          </Button>
        )}
      </Box>

      {/* 🔽 Filters Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem
          onClick={() => {
            handleFilterChange({ status: "Approved" });
            handleFilterClose();
          }}
        >
          {t("Approved")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleFilterChange({ status: "Pending" });
            handleFilterClose();
          }}
        >
          {t("Pending")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleFilterChange({ status: "Rejected" });
            handleFilterClose();
          }}
        >
          {t("Rejected")}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomToolbarMobile;
