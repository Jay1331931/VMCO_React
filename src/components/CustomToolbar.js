import React, { useCallback, useState } from "react";
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
} from "@mui/x-data-grid";
import {
  Box,
  TextField,
  IconButton,
  Chip,
  Button,
  Tooltip,
  Typography,
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

const operators = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  // { value: "notContains", label: "Does not contain" },
  // { value: "startsWith", label: "Starts with" },
  // { value: "endsWith", label: "Ends with" },
  // { value: "greaterThan", label: "Greater than" },
  // { value: "lessThan", label: "Less than" },
];
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
  columnVisibilityModel = {},
  showExport = true,
  showUpload = false,
  showAdd = false,
  handleAddClick,
  handleUploadClick,
  setSearchQuery,
  columnsToDisplay,
}) => {
  const { t, i18n } = useTranslation();
  const [searchValue, setSearchValue] = useState(searchQuery || "");
  const [filterObj, setFilterObj] = useState({});
  const [customFilters, setCustomFilters] = useState({});
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
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    // onSearch(value);
  };
  console.log("filterAnchor", filterAnchor);
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

  const handleSearchClear = () => {
    setSearchValue("");
    onSearch("");
  };

  const handleFilterApply = () => {
    // Get the current filter model from the grid
    const filterModel = gridApiRef.current.getFilterModel();

    // Convert the filter model to your custom filters format
    const customFilters = {};
    filterModel.items.forEach((item) => {
      customFilters[item.field] = item.value;
    });

    // Call your custom filter change handler
    // onFilterChange(customFilters);
    setFilterAnchor(customFilters);
  };

  const handleFilterClear = () => {
    // Clear the grid's filter model
    gridApiRef.current.setFilterModel({ items: [] });

    // Clear your custom filters
    const clearedFilters = {};
    Object.keys(filters).forEach((key) => {
      clearedFilters[key] = "";
    });
    // onFilterChange(clearedFilters);
    setFilterAnchor(clearedFilters);
  };

  // Listen for filter model changes and apply them
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
    // api.subscribeEvent('filterModelChange', handleFilterModelChange);

    // return () => {
    //   api.unsubscribeEvent('filterModelChange', handleFilterModelChange);
    // };
    const unsubscribe = api.subscribeEvent(
      "filterModelChange",
      handleFilterModelChange
    );

    return () => {
      unsubscribe();
    };
    // }, [gridApiRef, onFilterChange]);
  }, [gridApiRef, setFilterAnchor]);

  const CustomChip = ({ key, option }) => {
    return (
      <Chip
        key={key}
        label={`${option.column}: ${option.searchString}`}
        // onDelete={() => handleDeleteChip(option?.column)}
      />
    );
  };
  const handleInputChange = useCallback(
    (event, newValue) => {
      setSearchValue(newValue);

      if (!newValue?.trim()) {
        setSearchOptions([]);
        return;
      }

      // Generate options from columns that can be searched
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
      // setFilters((data) => ({
      //   ...data,
      //   [dateCategory]: `${startDate}-${endDate}`,
      // }));
      setCustomFilters((data) => ({
        ...data,
        [dateCategory]: {
          searchString: `${startDate}-${endDate}`,
        },
      }));
      setDateFilterAnchor(null);
    }
  };

  return (
    <>
      <Toolbar
        sx={{
          gap: 2,
          padding: 2,
          backgroundColor: "background.paper",
          // borderBottom: 1,
          borderColor: "divider",
          flexWrap: "wrap",
          justifyContent: "flex-start",
        }}
      >
        <Box
          sx={{
            width: "400px",
            marginRight: i18n.language === "en" ? "auto" : "none",
            marginLeft: i18n.language === "en" ? "none" : "auto",
          }}
        >
          <Autocomplete
            multiple
            freeSolo
            fullWidth
            size="small"
            value={Object.entries(filters)
              .map(([key, value]) => ({
                column: value?.column || key,
                searchString: value?.searchString || value,
              }))
              .filter((item) => item.searchString)} // Filter out empty entries
            inputValue={searchValue || ""}
            onInputChange={(event, newValue) =>
              handleInputChange(event, newValue)
            }
            onChange={(event, newValue, details, reason) => {
              if (details === "removeOption") {
                const newFilterObj = {};
                Object.entries(filters).forEach(([key, value]) => {
                  if (key !== reason.option.column) {
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
                handleFilterChange({ ...filters, ...newFilterObj });
                setSearchQuery("");
              }
            }}
            options={searchOptions}
            renderOption={(props, option) => {
              console.log("columns", columns, option);
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
              return `${columnName}: ${
                typeof option.searchString === "string"
                  ? option.searchString
                  : `${option.searchString?.startDate?.split("T")[0] ?? ""} - ${
                      option.searchString?.endDate?.split("T")[0] ?? ""
                    }`
              }`;
            }}
            filterOptions={(options) => options} // Don't filter options, show all
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t("Search...")}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                    fontSize: "12px",
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      border: "1px solid #3D5654",
                    },
                  },
                }}
              />
            )}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "15px",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  border: "1px solid #3D5654",
                },
              },
              "& .MuiAutocomplete-popupIndicator": { borderRadius: "20px" },
              "& .MuiAutocomplete-listbox": { borderRadius: "20px" },
            }}
          />
        </Box>

        {/* Default Grid Toolbar Components */}
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

        <Tooltip title={t("Date-Range")}>
          <IconButton
            component="span"
            onClick={(e) => setDateFilterAnchor(e.currentTarget)}
          >
            <CalendarMonthIcon />
          </IconButton>
        </Tooltip>

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
            <ExportCsv
              render={(params) => (
                <ToolbarButton {...params} size="small">
                  <FileDownloadIcon />
                </ToolbarButton>
              )}
            >
              {t("Export")}
            </ExportCsv>
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
          <Tooltip title={t("Add")}>
            <ToolbarButton onClick={handleAddClick} size="small">
              <AddIcon />
            </ToolbarButton>
          </Tooltip>
        )}
      </Toolbar>

      <Menu
        anchorEl={filterAnchor}
        open={open}
        onClose={() => setFilterAnchor(null)}
        // anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ mt: 27, ml: i18n.language === "en" ? 110 : 0 }}
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
              onChange={(e) =>
                setFilterObj((data) => ({ ...data, column: e.target.value }))
              }
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
                    col.field !== "updatedAt" &&
                    col.field !== "scheduledAt" &&
                    col.field !== "createdAt" &&
                    col.field !== "expectedAmount"
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
              onChange={(e) =>
                setFilterObj((data) => ({ ...data, operator: e.target.value }))
              }
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
              value={filterObj?.searchString}
              onChange={(e) => {
                // setSearchValue(e.target.value);
                setFilterObj((data) => ({
                  ...data,
                  searchString: e.target.value,
                }));
              }}
              // onChange={handleFilterChange}
              sx={{ width: "100%" }}
            />
          </Grid>
          <Grid item>
            <Button
              sx={{ minWidth: 40 }}
              onClick={() => {
                // setSearchQuery(searchValue);
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
      <Menu
        anchorEl={dateFilterAnchor}
        open={Boolean(dateFilterAnchor)}
        onClose={() => setDateFilterAnchor(null)}
        // anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ ml: i18n.language === "en" ? -20 : 6 }}
      >
        <Grid item container sx={{ padding: 1, columnGap: 1 }}>
          <Grid item sx={{ flex: 1 }}>
            <Select
              variant="standard"
              value={dateCategory}
              onChange={(e) => setDateCategory(e.target.value)}
              displayEmpty
              fullWidth
              size="small"
              sx={{ width: "100%" }}
            >
              <MenuItem value="" disabled>
                Select Date Column
              </MenuItem>
              {columns?.map((col) => {
                if (
                  col.field === "updatedAt" ||
                  col.field === "scheduledAt" ||
                  col.field === "createdAt"
                ) {
                  return (
                    <MenuItem key={col.field} value={col.field}>
                      {col.headerName}
                    </MenuItem>
                  );
                }
                return null;
              })}
            </Select>
          </Grid>
          {/* <Grid item sx={{ flex: 1 }}>
              <Button
                onClick={(e) => setDateFilterAnchor(e.currentTarget)}
                size="small"
                sx={{ width: "100%" }}
                variant="outlined"
                startIcon={<CalendarMonthIcon />}
              >
                {`${dateFilter[0].startDate.toLocaleDateString()} - ${dateFilter[0].endDate.toLocaleDateString()}`}
              </Button>
            </Grid> */}
          <Grid item>
            <Button
              sx={{ minWidth: 40 }}
              onClick={() => {
                handleFilterChange({
                  ...filters,
                  [dateCategory]: {
                    startDate: dateFilter[0].startDate.toISOString(),
                    endDate: dateFilter[0].endDate.toISOString(),
                  },
                });
              }}
            >
              <GridSearchIcon />
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ padding: 2, width: 350 }}>
          <DateRange
            onChange={(item) => setDateFilter([item.selection])}
            editableDateInputs={true}
            style={{ width: "100%" }}
            ranges={dateFilter}
            months={2}
            direction="horizontal"
            preventSnapRefocus={true}
          />
        </Box>
      </Menu>
    </>
  );
};

export default CustomToolbar;
