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

// Reusable style objects
const commonStyles = {
  autocompleteRoot: {
    "& .MuiOutlinedInput-root": {
      fontSize: "15px",
      minWidth: "250px",
      height: "40px",
      padding: "4px 8px",
      display: "flex",
      alignItems: "center",
      "& .MuiAutocomplete-inputRoot": {
        padding: "0",
      },
    },
    "& .MuiInputBase-root": {
      flexWrap: "nowrap",
      overflowX: "scroll",
      position: "relative",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    },
    "& .MuiInputBase-root:hover": {
      overflow: "auto",
    },
    "& .MuiInputBase-root::-webkit-scrollbar": {
      display: "none",
    },
  },
  autocompleteTextField: (isMobile = false) => ({
    display: "inline-flex",
    flexDirection: "column",
    position: "relative",
    minWidth: isMobile ? "200px" : "250px",
    padding: 0,
    margin: 0,
    border: isMobile ? "1px solid rgba(0, 0, 0, 0.23)" : "1px solid rgba(0, 0, 0, 0.23)",
    borderRadius: isMobile ? "20px" : "20px",
    verticalAlign: "top",
    transition: "border-color 0.2s ease",
    "&:hover": {
      borderColor: "rgba(0, 0, 0, 0.87)",
    },
    "&:focus-within": {
      borderColor: "rgba(0, 0, 0, 0.87)"
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: isMobile ? "8px" : "20px",
      fontSize: "12px",
      maxWidth: isMobile ? "200px" : "250px",
      height: "40px",
      padding: "0 8px",
      "& .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },
    },
    "& .MuiAutocomplete-endAdornment": {
      display: "none",
    },
  }),
  autocompleteInputProps: {
    flexWrap: "nowrap",
    overflow: "hidden",
    "& .MuiAutocomplete-input": {
      minWidth: "30px !important",
    },
  },
  autocompletePaper: (isMobile = false) => ({
    borderRadius: isMobile ? "8px" : "20px",
  }),
  autocompleteListbox: {
    maxHeight: "300px",
  },
  chip: (isMobile = false) => ({
    maxWidth: isMobile ? "180px" : "200px",
    height: isMobile ? "22px" : "24px",
    fontSize: isMobile ? "10px" : "11px",
    margin: "2px",
  }),
  dateMenuContainer: {
    padding: 2,
    width: { xs: "100%", sm: 350 },
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
};

// Move components OUTSIDE of CustomToolbar
const SearchAutocomplete = ({
  displayableFilters,
  searchValue,
  handleInputChange,
  filters,
  excludeFiltersFromChips,
  filterObj,
  setFilterObj,
  handleFilterChange,
  setSearchQuery,
  searchOptions,
  columns,
  isMobile,
  t,
}) => (
  <Autocomplete
    multiple
    freeSolo
    fullWidth
    size="small"
    value={displayableFilters}
    inputValue={searchValue || ""}
    onInputChange={handleInputChange}
    onChange={(event, newValue, details, reason) => {
      if (reason === "removeOption") {
        const newFilterObj = {};
        Object.entries(filters).forEach(([key, value]) => {
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
    renderTags={(value, getTagProps) =>
      value.map((option, index) => {
        const columnName = columns.find(
          (col) => col.field === option.column
        )?.headerName || option.column;

        return (
          <Chip
            {...getTagProps({ index })}
            key={index}
            label={`${columnName}: ${option.searchString}`}
            size="small"
            sx={commonStyles.chip(isMobile)}
          />
        );
      })
    }
    renderInput={(params) => (
      <TextField
        {...params}
        placeholder={t("Search...")}
        variant="outlined"
        sx={commonStyles.autocompleteTextField(isMobile)}
        InputProps={{
          ...params.InputProps,
          sx: {
            ...params.InputProps.sx,
            ...commonStyles.autocompleteInputProps,
          },
        }}
      />
    )}
    componentsProps={{
      paper: {
        sx: commonStyles.autocompletePaper(isMobile)
      }
    }}
    ListboxProps={{
      sx: commonStyles.autocompleteListbox
    }}
    sx={commonStyles.autocompleteRoot}
  />
);

const ToolbarActions = ({
  showAssignfilters,
  handleClick,
  assigned,
  handleClose,
  handleSelectFilters,
  showColumnVisibility,
  showCalendar,
  setDateFilterAnchor,
  showFilters,
  setFilterAnchor,
  showExport,
  handleExportClick,
  showUpload,
  handleUploadClick,
  showAdd,
  showAddForm,
  buttonName,
  handleAddClick,
  t,
}) => (
  <>
    {showAssignfilters && (
      <>
        <Tooltip title={t("Assign Filters")}>
          <IconButton onClick={handleClick}>
            <AssignmentIcon />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={assigned} open={Boolean(assigned)} onClose={handleClose}>
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
            <FileDownloadIcon />
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
  </>
);

const TabToggles = ({
  showTransactionTabs,
  activeTransactionTab,
  handleTransactionTabChange,
  showApproval,
  isApprovalMode,
  handleApproval,
  showClosed,
  isClosedMode,
  handleClosedTickets,
  openTicketsCount,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      flexWrap: "wrap",
    }}
  >
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
);

const DateRangeMenu = ({
  dateFilterAnchor,
  setDateFilterAnchor,
  isMobile,
  i18n,
  dateFilter,
  setDateFilter,
  handleFilterChange,
  filters,
  dateCategory,
}) => (
  <Menu
    anchorEl={dateFilterAnchor}
    open={Boolean(dateFilterAnchor)}
    onClose={() => setDateFilterAnchor(null)}
    sx={{ ml: isMobile ? 0 : i18n.language === "en" ? -20 : 6 }}
  >
    <Box sx={commonStyles.dateMenuContainer}>
      <DateRange
        onChange={(item) => setDateFilter([item.selection])}
        editableDateInputs={true}
        style={{ width: "100%" }}
        ranges={dateFilter}
        months={1}
        direction="horizontal"
        preventSnapRefocus={true}
      />
      <Grid
        item
        sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
      >
        <Button
          sx={{ minWidth: 40 }}
          onClick={() => {
            const startDate = formatDatePure(dateFilter[0].startDate);
            const endDate = formatDatePure(dateFilter[0].endDate);

            handleFilterChange({
              ...filters,
              [dateCategory]: {
                startDate,
                endDate,
              },
            });
            setDateFilterAnchor(null);
          }}
        >
          Apply
        </Button>
      </Grid>
    </Box>
  </Menu>
);

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

  const displayableFilters = Object.entries(filters)
    .filter(([key]) => !excludeFiltersFromChips.includes(key))
    .map(([key, value]) => ({
      column: value?.column || key,
      searchString: value?.searchString || value,
    }))
    .filter((item) => item.searchString);

  return isMobile ? (
    <>
      <Toolbar
        sx={{
          padding: 0,
          backgroundColor: "background.paper",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
          width: "100%",
          minHeight: "auto"
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: 1.5,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flex: 1,
              minWidth: "200px",
            }}
          >
            <SearchAutocomplete
              displayableFilters={displayableFilters}
              searchValue={searchValue}
              handleInputChange={handleInputChange}
              filters={filters}
              excludeFiltersFromChips={excludeFiltersFromChips}
              filterObj={filterObj}
              setFilterObj={setFilterObj}
              handleFilterChange={handleFilterChange}
              setSearchQuery={setSearchQuery}
              searchOptions={searchOptions}
              columns={columns}
              isMobile={isMobile}
              t={t}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ToolbarActions
              showAssignfilters={showAssignfilters}
              handleClick={handleClick}
              assigned={assigned}
              handleClose={handleClose}
              handleSelectFilters={handleSelectFilters}
              showColumnVisibility={showColumnVisibility}
              showCalendar={showCalendar}
              setDateFilterAnchor={setDateFilterAnchor}
              showFilters={showFilters}
              setFilterAnchor={setFilterAnchor}
              showExport={showExport}
              handleExportClick={handleExportClick}
              showUpload={showUpload}
              handleUploadClick={handleUploadClick}
              showAdd={showAdd}
              showAddForm={showAddForm}
              buttonName={buttonName}
              handleAddClick={handleAddClick}
              t={t}
            />
          </Box>
        </Box>
        <TabToggles
          showTransactionTabs={showTransactionTabs}
          activeTransactionTab={activeTransactionTab}
          handleTransactionTabChange={handleTransactionTabChange}
          showApproval={showApproval}
          isApprovalMode={isApprovalMode}
          handleApproval={handleApproval}
          showClosed={showClosed}
          isClosedMode={isClosedMode}
          handleClosedTickets={handleClosedTickets}
          openTicketsCount={openTicketsCount}
        />
        <DateRangeMenu
          dateFilterAnchor={dateFilterAnchor}
          setDateFilterAnchor={setDateFilterAnchor}
          isMobile={isMobile}
          i18n={i18n}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          handleFilterChange={handleFilterChange}
          filters={filters}
          dateCategory={dateCategory}
        />
      </Toolbar>
    </>
  ) : (
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
           
            gap: "20px",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" ,lg:"row",xl:"row"},
            alignItems: { xs: "stretch", sm: "center" },
            marginRight: i18n.language === "en" ? "auto" : "none",
            marginLeft: i18n.language === "en" ? "none" : "auto",
          }}
        >
          <div  sx={{
    width: {
      xs: "150px",  
      sm: "150px",
      md: "150px",  
      lg: "250px",
      xl: "300px"  
    }
  }}>
             <SearchAutocomplete
            displayableFilters={displayableFilters}
            searchValue={searchValue}
            handleInputChange={handleInputChange}
            filters={filters}
            excludeFiltersFromChips={excludeFiltersFromChips}
            filterObj={filterObj}
            setFilterObj={setFilterObj}
            handleFilterChange={handleFilterChange}
            setSearchQuery={setSearchQuery}
            searchOptions={searchOptions}
            columns={columns}
            isMobile={isMobile}
            t={t}
          />
         
            </div>
            <TabToggles
            showTransactionTabs={showTransactionTabs}
            activeTransactionTab={activeTransactionTab}
            handleTransactionTabChange={handleTransactionTabChange}
            showApproval={showApproval}
            isApprovalMode={isApprovalMode}
            handleApproval={handleApproval}
            showClosed={showClosed}
            isClosedMode={isClosedMode}
            handleClosedTickets={handleClosedTickets}
            openTicketsCount={openTicketsCount}
          />
        </Box>
 
        <ToolbarActions
          showAssignfilters={showAssignfilters}
          handleClick={handleClick}
          assigned={assigned}
          handleClose={handleClose}
          handleSelectFilters={handleSelectFilters}
          showColumnVisibility={showColumnVisibility}
          showCalendar={showCalendar}
          setDateFilterAnchor={setDateFilterAnchor}
          showFilters={showFilters}
          setFilterAnchor={setFilterAnchor}
          showExport={showExport}
          handleExportClick={handleExportClick}
          showUpload={showUpload}
          handleUploadClick={handleUploadClick}
          showAdd={showAdd}
          showAddForm={showAddForm}
          buttonName={buttonName}
          handleAddClick={handleAddClick}
          t={t}
        />
      </Toolbar>
      <Menu
        anchorEl={filterAnchor}
        open={open}
        onClose={() => setFilterAnchor(null)}
        sx={{
          mt: 15,
          ml: isMobile ? 0 : i18n.language === "en" ? 110 : 0,
        }}
        disablePortal={false}
        keepMounted
      >
        <Grid
          item
          container
          sx={{
            padding: 1,
            columnGap: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Grid item sx={{ flex: 1 }}>
            <Select
              variant="standard"
              value={filterObj?.column || ""}
              onChange={(e) => {
                e.stopPropagation();
                setFilterObj((data) => ({ ...data, column: e.target.value }));
              }}
              onKeyDown={(e) => e.stopPropagation()}
              displayEmpty
              fullWidth
              size="small"
              sx={{ width: "100%" }}
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, overflowY: "auto" } },
              }}
            >
              <MenuItem value="" disabled>
                Select Column
              </MenuItem>
              {columns
                ?.filter(
                  (col) =>
                    col.field !== "updatedAt" && col.field !== "createdAt"
                )
                .map((col) => (
                  <MenuItem key={col.field} value={col.field}>
                    {col.headerName}
                  </MenuItem>
                ))}
            </Select>
          </Grid>

          <Grid item sx={{ flex: 1 }}>
            <Select
              variant="standard"
              value={filterObj?.operator || ""}
              onChange={(e) => {
                e.stopPropagation();
                setFilterObj((data) => ({ ...data, operator: e.target.value }));
              }}
              onKeyDown={(e) => e.stopPropagation()}
              displayEmpty
              fullWidth
              size="small"
              sx={{ width: "100%" }}
            >
              <MenuItem value="" disabled>
                Select Operator
              </MenuItem>
              {operators?.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item sx={{ flex: 1 }}>
            <TextField
              variant="standard"
              size="small"
              fullWidth
              placeholder="Enter value"
              value={filterObj?.searchString || ""}
              onChange={(e) => {
                e.stopPropagation();
                setFilterObj((data) => ({
                  ...data,
                  searchString: e.target.value,
                }));
              }}
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              sx={{ width: "100%" }}
            />
          </Grid>
          <Grid item>
            <Button
              sx={{ minWidth: 40 }}
              onClick={(e) => {
                e.stopPropagation();
                handleFilterChange({
                  ...filters,
                  [filterObj?.column]: filterObj?.searchString,
                });
              }}
            >
              <GridSearchIcon />
            </Button>
          </Grid>
        </Grid>
      </Menu>
      <DateRangeMenu
        dateFilterAnchor={dateFilterAnchor}
        setDateFilterAnchor={setDateFilterAnchor}
        isMobile={isMobile}
        i18n={i18n}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        handleFilterChange={handleFilterChange}
        filters={filters}
        dateCategory={dateCategory}
      />
    </>
  );
};

export default CustomToolbar;
