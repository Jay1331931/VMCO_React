import React, { useCallback, useState, useEffect } from "react";
import {
  Toolbar,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportCsv,
  ToolbarButton,
  QuickFilter,
  QuickFilterTrigger,
  QuickFilterControl,
  QuickFilterClear,
  useGridApiContext,
  GridToolbarContainer
} from "@mui/x-data-grid";
import AssignmentIcon from '@mui/icons-material/Assignment';
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Button,
  Tooltip,
  Typography,
  Badge,
} from "@mui/material";
import { Autocomplete, Grid, Menu, MenuItem, Select } from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ViewColumn as ViewColumnIcon,
  FileDownload as FileDownloadIcon,
  UploadFile as UploadFileIcon,
  Add as AddIcon,
  FilterAlt,
  KeyboardDoubleArrowRight,
  Add,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { GridSearchIcon } from "@mui/x-data-grid";
import { CalendarMonth as CalendarMonthIcon } from "@mui/icons-material";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { addDays, addYears } from "date-fns";
import AnimatedTabs from "./AnimatedTabs";

const operators = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
];

function formatDatePure(date) {
  if (!date) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

const CustomToolbar = ({
  searchQuery,
  onSearch,
  setFilterAnchor,
  filterAnchor,
  handleFilterChange,
  onColumnVisibilityChange,
  columns = [],
  searchPlaceholder = "Search...",
  showColumnVisibility = true,
  showFilters = true,
  filters = {},
  showCalendar = true,
  columnVisibilityModel = {},
  showExport = true,
  showUpload = false,
  showAdd = false,
  handleAddClick,
  handleUploadClick,
  handleExportClick,
  setSearchQuery,
  columnsToDisplay,
  isApprovalMode,
  handleApproval,
  showApproval,
  isClosedMode,
  showClosed,
  handleClosedTickets,
  buttonName,
  showAddForm = false,
  showAssignfilters = false,
  openTicketsCount = 0,
  showTransactionTabs = false,
  activeTransactionTab = "pending",
  handleTransactionTabChange,
  excludeFiltersFromChips = [],
}) => {
  const { t, i18n } = useTranslation();
  const [searchValue, setSearchValue] = useState(searchQuery || "");
  const [filterObj, setFilterObj] = useState({});
  const [customFilters, setCustomFilters] = useState({});
  const [assigned, setAssigned] = useState(null);
  const [dateFilter, setDateFilter] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: "selection",
    },
  ]);
  const [dateCategory, setDateCategory] = useState("createdAt");
  const [dateFilterAnchor, setDateFilterAnchor] = useState(null);
  const gridApiRef = useGridApiContext();
  const open = Boolean(filterAnchor);
  const [searchOptions, setSearchOptions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onSearch(searchValue);
    }
  };

  const handleOptionSelect = (newValue) => {
    if (!Array.isArray(newValue)) return;

    const updated = {};
    newValue.forEach(({ column, searchString }) => {
      if (column && searchString?.trim()) {
        updated[column] = {
          searchString: searchString.trim(),
        };
      }
    });

    setCustomFilters(updated);
  };

  const handleFilterApply = () => {
    const filterModel = gridApiRef.current.getFilterModel();
    const customFilters = {};
    filterModel.items.forEach((item) => {
      customFilters[item.field] = item.value;
    });
    setFilterAnchor(customFilters);
  };

  const handleFilterClear = () => {
    gridApiRef.current.setFilterModel({ items: [] });
    const clearedFilters = {};
    Object.keys(filters).forEach((key) => {
      clearedFilters[key] = "";
    });
    setFilterAnchor(clearedFilters);
  };

  React.useEffect(() => {
    const handleFilterModelChange = (event) => {
      if (
        event.reason === "upsertFilterItem" ||
        event.reason === "deleteFilterItem"
      ) {
        handleFilterApply();
      }
    };

    const api = gridApiRef.current;
    const unsubscribe = api.subscribeEvent(
      "filterModelChange",
      handleFilterModelChange
    );

    return () => {
      unsubscribe();
    };
  }, [gridApiRef, setFilterAnchor]);

  const handleInputChange = useCallback(
    (event, newValue) => {
      setSearchValue(newValue);

      if (!newValue?.trim()) {
        setSearchOptions([]);
        return;
      }

      const newOptions = columns
        .filter(
          (col) =>
            col.field !== "updatedAt" &&
            col.field !== "createdAt" &&
            col?.searchable
        )
        .map((col) => ({
          column: col.field,
          searchString: newValue.trim(),
          source: "search",
          operator: "contains",
        }));

      setSearchOptions(newOptions);
    },
    [columns]
  );

  const applyDateFilter = () => {
    const { startDate, endDate } = dateFilter[0];
    if (startDate && endDate) {
      setCustomFilters((data) => ({
        ...data,
        [dateCategory]: {
          searchString: `${startDate}-${endDate}`,
        },
      }));
      setDateFilterAnchor(null);
    }
  };

  const handleClick = (event) => {
    setAssigned(event.currentTarget);
  };

  const handleClose = () => {
    setAssigned(null);
  };

  const handleSelectFilters = (option) => {
    handleFilterChange({
      ...filters,
      assignedType: option,
    });
    handleClose();
  };

  // Filter out excluded fields from display
  const displayableFilters = Object.entries(filters)
    .filter(([key]) => !excludeFiltersFromChips.includes(key))
    .map(([key, value]) => ({
      column: value?.column || key,
      searchString: value?.searchString || value,
    }))
    .filter((item) => item.searchString);

  return (
    <>
      <Toolbar
        sx={{
          gap: 2,
          padding: 2,
          backgroundColor: "background.paper",
          borderColor: "divider",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        <Box
          sx={{
            width: "500px",
            gap: "20px",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            marginRight: i18n.language === "en" ? "auto" : "none",
            marginLeft: i18n.language === "en" ? "none" : "auto",
          }}
        >
          <Autocomplete
            multiple
            freeSolo
            fullWidth
            size="small"
            value={displayableFilters}
            inputValue={searchValue || ""}
            onInputChange={(event, newValue) =>
              handleInputChange(event, newValue)
            }
            onChange={(event, newValue, details, reason) => {
              if (reason === "removeOption") {
                const newFilterObj = {};
                Object.entries(filters).forEach(([key, value]) => {
                  // Keep excluded filters and remove only the selected option
                  if (excludeFiltersFromChips.includes(key) || key !== details.option.column) {
                    newFilterObj[key] = value;
                  }
                });
                setFilterObj(newFilterObj);
                handleFilterChange(newFilterObj);
                setSearchQuery("");
              } else {
                const newFilterObj = { ...filterObj };
                newValue.forEach((item) => {
                  if (item.column && item.searchString) {
                    newFilterObj[item.column] = item.searchString;
                  }
                });
                setFilterObj(newFilterObj);
                // Preserve excluded filters
                const preservedFilters = {};
                excludeFiltersFromChips.forEach(key => {
                  if (filters[key]) {
                    preservedFilters[key] = filters[key];
                  }
                });
                handleFilterChange({ ...preservedFilters, ...newFilterObj });
                setSearchQuery("");
              }
            }}
            options={searchOptions}
            renderOption={(props, option) => {
              const columnName = columns.find(
                (col) => col.field === option.column
              )?.headerName;
              return (
                <Box component="li" {...props}>
                  <Typography sx={{ fontSize: "14px" }}>
                    {columnName} <KeyboardDoubleArrowRight fontSize="smaller" />{" "}
                    {option.searchString}
                  </Typography>
                </Box>
              );
            }}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;

              const columnName =
                columns.find((col) => col.field === option.column)
                  ?.headerName || option.column;
              return `${columnName}: ${typeof option.searchString === "string"
                ? option.searchString
                : `${option.searchString?.startDate?.split("T")[0] ?? ""} - ${option.searchString?.endDate?.split("T")[0] ?? ""
                }`
                }`;
            }}
            filterOptions={(options) => options}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("Search...")}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                    fontSize: "12px",
                    minWidth: "250px",
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "1px solid #3D5654",
                    },
                  },
                  "& .css-1uhhrmm-MuiAutocomplete-endAdornment": {
                    display: "none",
                  },
                }}
              />
            )}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "15px",
                minWidth: "250px",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  border: "1px solid #3D5654",
                },
              },
              "& .MuiAutocomplete-popupIndicator": { borderRadius: "20px" },
              "& .MuiAutocomplete-listbox": { borderRadius: "20px" },
            }}
          />
          {showTransactionTabs && (
            <AnimatedTabs
              toggleMode={true}
              value={activeTransactionTab}
              onChange={(mode) => handleTransactionTabChange(mode)}
              leftLabel="Pending"
              rightLabel="All"
            />
          )}
          {showApproval && (
            <AnimatedTabs
              toggleMode={true}
              value={isApprovalMode ? "approval" : "all"}
              onChange={(mode) => handleApproval(mode)}
            />
          )}
          {showClosed && (
            <AnimatedTabs
              toggleMode={true}
              value={isClosedMode}
              onChange={(mode) => handleClosedTickets(mode)}
              badgeCount={isClosedMode === "open" ? openTicketsCount : 0}
              showBadgeOnFirstTab={true}
            />
          )}
        </Box>

        {showAssignfilters && (
          <>
            <Tooltip title={t("Assign Filters")}>
              <IconButton onClick={handleClick}>
                <AssignmentIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={assigned} open={assigned} onClose={handleClose}>
              <MenuItem onClick={() => handleSelectFilters("assignedto")}>
                {t("Assigned To Me")}
              </MenuItem>
              <MenuItem onClick={() => handleSelectFilters("reportingto")}>
                {t("Reporting To Me")}
              </MenuItem>
              <MenuItem onClick={() => handleSelectFilters("customerregion")}>
                {t("Region")}
              </MenuItem>
            </Menu>
          </>
        )}

        <GridToolbarContainer>
          {showColumnVisibility && (
            <Tooltip title={t("Columns")}>
              <ColumnsPanelTrigger
                render={(params) => (
                  <ToolbarButton {...params} size="small">
                    <ViewColumnIcon />
                  </ToolbarButton>
                )}
              >
                {t("Columns")}
              </ColumnsPanelTrigger>
            </Tooltip>
          )}
        </GridToolbarContainer>

        {showCalendar && (
          <Tooltip title={t("Date-Range")}>
            <IconButton
              component="span"
              onClick={(e) => setDateFilterAnchor(e.currentTarget)}
            >
              <CalendarMonthIcon />
            </IconButton>
          </Tooltip>
        )}

        {showFilters && (
          <Tooltip title={t("Filters")}>
            <ToolbarButton
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              size="small"
            >
              <FilterAlt sx={{ width: 23, height: 23 }} />
            </ToolbarButton>
          </Tooltip>
        )}

        {showExport && (
          <Tooltip title={t("Export")}>
            <span>
              <IconButton onClick={handleExportClick} size="small">
                {<FileDownloadIcon />}
              </IconButton>
            </span>
          </Tooltip>
        )}

        {showUpload && (
          <Tooltip title={t("Upload")}>
            <ToolbarButton onClick={handleUploadClick} size="small">
              <UploadFileIcon />
            </ToolbarButton>
          </Tooltip>
        )}

        {showAdd && (
          <Tooltip title={showAddForm ? "Close" : buttonName}>
            <ToolbarButton onClick={handleAddClick} size="small">
              <AddIcon
                sx={{
                  transform: showAddForm ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.7s ease-in-out',
                }}
              />
            </ToolbarButton>
          </Tooltip>
        )}
      </Toolbar>

      <Menu
        anchorEl={filterAnchor}
        open={open}
        onClose={() => setFilterAnchor(null)}
        sx={{
          mt: isMobile ? 15 : 15,
          ml: isMobile ? 0 : i18n.language === "en" ? 110 : 0,
        }}
      >
        {/* Filter menu content remains the same */}
      </Menu>

      <Menu
        anchorEl={dateFilterAnchor}
        open={Boolean(dateFilterAnchor)}
        onClose={() => setDateFilterAnchor(null)}
        sx={{ ml: isMobile ? 0 : i18n.language === "en" ? -20 : 6 }}
      >
        {/* Date filter menu content remains the same */}
      </Menu>
    </>
  );
};

export default CustomToolbar;
