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
  FilterAlt,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { GridSearchIcon } from "@mui/x-data-grid";

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
  setSearchQuery,
  columnsToDisplay,
}) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState(searchQuery || "");
  const [filterObj, setFilterObj] = useState({});
  const [customFilters, setCustomFilters] = useState({});
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
      setSearchQuery(newValue);
      setSearchValue(newValue);

      if (!newValue?.trim()) {
        setSearchOptions([]);
        return;
      }

      const trimmedValue = newValue.trim();

      const newOptions = columns
        .filter((col) => columns.includes(col.field))
        .map((col) => ({
          column: col.field,
          searchString: trimmedValue,
          source: "search",
          operator: "contains",
        }));

      setSearchOptions((prevOptions) => {
        const isDifferent =
          prevOptions.length !== newOptions.length ||
          prevOptions.some(
            (opt, index) =>
              opt.column !== newOptions[index].column ||
              opt.searchString !== newOptions[index].searchString
          );

        return isDifferent ? newOptions : prevOptions;
      });
    },
    [columns]
  );

  return (
    <Toolbar
      sx={{
        gap: 2,
        padding: 2,
        backgroundColor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        flexWrap: "wrap",
      }}
    >
      {/* Active Filters Display */}
      {/* {showFilters && Object.values(filters).some((value) => value) && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const column = columns.find((col) => col.field === key);
            return (
              <Chip
                key={key}
                label={`${column?.headerName || key}: ${value}`}
                onDelete={() => {
                  // Remove this specific filter from the grid
                  const currentFilters = gridApiRef.current.getFilterModel();
                  const newFilters = {
                    items: currentFilters.items.filter(
                      (item) => item.field !== key
                    ),
                  };
                  gridApiRef.current.setFilterModel(newFilters);

                  // Update custom filters
                  // onFilterChange({ ...filters, [key]: "" });
                  setFilterAnchor({ ...filters, [key]: "" });
                }}
                size="small"
              />
            );
          })}
          <Button
            size="small"
            onClick={handleFilterClear}
            sx={{ minWidth: "auto" }}
          >
            {t("Clear All")}
          </Button>
        </Box>
      )} */}
      {/* Custom Search Input */}
      <TextField
        variant="outlined"
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
          ),
          endAdornment: searchValue && (
            <IconButton size="small" onClick={handleSearchClear}>
              <ClearIcon />
            </IconButton>
          ),
        }}
        sx={{ minWidth: 300 }}
      />
      {/* <Autocomplete
        multiple
        freeSolo
        size="small"
        fullWidth
        inputValue={searchValue}
        onInputChange={handleInputChange}
        value={Object.keys(customFilters).map((key) => ({
          column: key,
          searchString: customFilters[key]?.searchString || "",
        }))}
        options={searchValue ? searchOptions : []}
        getOptionLabel={(option) => `${option.column}: ${option.searchString}`}
        // onInputChange={(e, newInputValue) => handleSearchChange(newInputValue)}
        onChange={(e, val) => handleOptionSelect(val)}
        // clearIcon={
        //   <Clear
        //     onClick={(e) => {
        //       e.stopPropagation();
        //       setCustomFilters({});
        //       handleSearchChange("");
        //     }}
        //   />
        // }
        renderOption={(props, option) => {
          const { column, searchString } = option;
          const { key, ...otherProps } = props;
          return (
            <Typography key={key} {...otherProps}>
              {columnsToDisplay[column] || column} <KeyboardDoubleArrowRight />{" "}
              {searchString}
            </Typography>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={searchPlaceholder || "Search"}
            variant="outlined"
            sx={{
              "& .MuiInputLabel-root": { color: "#3D5654" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#3D5654" },
            }}
          />
        )}
        renderTags={(values, getTagProps) =>
          values?.map((option, index) => (
            <Chip
              key={index}
              {...getTagProps({ index })}
              label={`${columnsToDisplay[option.column] || option.column}: ${
                option.searchString
              }`}
              onDelete={() => {
                const updated = { ...customFilters };
                delete updated[option.column];
                setCustomFilters(updated);
              }}
              sx={{
                backgroundColor: "#e3ebf2",
                borderRadius: "80px",
                maxHeight: "25px",
              }}
            />
          ))
        }
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "20px",
            fontSize: "14px",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              border: "1px solid #3D5654",
            },
          },
          "& .MuiAutocomplete-popupIndicator": { borderRadius: "20px" },
          "& .MuiAutocomplete-listbox": { borderRadius: "20px" },
          "& .MuiChip-root": { borderRadius: "80px" },
        }}
      /> */}

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

      <Tooltip title="Filters">
        <Button
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{
            height: "30px",
            aspectRatio: "0.1",
            backgroundColor: "#FFFFFF",
            color: "black",
            "&:hover": { backgroundColor: "#ccc" },
            borderRadius: "150px",
            px: "20px",
            fontSize: "12px",
            fontWeight: "500px",
            textTransform: "capitalize",
            gap: "5px",
            // minWidth: "100px !important",
            display: { xs: "none", sm: "inline-flex" },
          }}
        >
          <FilterAlt sx={{ width: 20, height: 20 }} />
        </Button>
      </Tooltip>
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
      <Menu
        anchorEl={filterAnchor}
        open={open}
        onClose={() => setFilterAnchor(null)}
      >
        <Grid
          container
          direction="column"
          sx={{ padding: 1, rowGap: 1, display: "flex", width: 500 }}
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
                value={filterObj?.column}
                onChange={(e) =>
                  setFilterObj((data) => ({ ...data, column: e.target.value }))
                }
                // onChange={handleFilterChange}
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
                {columns?.map((col) => {
                  if (
                    col.field !== "updatedAt" &&
                    col.field !== "scheduledAt" &&
                    col.field !== "createdAt" &&
                    col.field !== "expectedAmount"
                  ) {
                    return (
                      <MenuItem key={col.field} value={col.field}>
                        {col.headerName}
                      </MenuItem>
                    );
                  }
                  return null;
                })}
                <MenuItem value="requiredType">Required Type</MenuItem>
                <MenuItem value="requiredUnit">Required Unit</MenuItem>
              </Select>
            </Grid>
            <Grid item sx={{ flex: 1 }}>
              <Select
                variant="standard"
                value={filterObj?.operator}
                onChange={(e) =>
                  setFilterObj((data) => ({
                    ...data,
                    operator: e.target.value,
                  }))
                }
                // onChange={handleFilterChange}
                displayEmpty
                fullWidth
                size="small"
                sx={{ width: "100%" }}
              >
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
                  setSearchValue(e.target.value);
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
                  setSearchQuery(searchValue);
                  handleFilterChange({
                    [filterObj?.column]: filterObj?.searchString,
                  });
                }}
              >
                <GridSearchIcon />
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Menu>
    </Toolbar>
  );
};

export default CustomToolbar;

// import React, { useState } from "react";
// import {
//   Box,
//   TextField,
//   IconButton,
//   Menu,
//   MenuItem,
//   Checkbox,
//   FormControlLabel,
//   Chip,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   FormGroup,
//   FormControl,
//   InputLabel,
//   Select,
//   OutlinedInput,
// } from "@mui/material";
// import {
//   Search as SearchIcon,
//   FilterList as FilterIcon,
//   ViewColumn as ViewColumnIcon,
//   Clear as ClearIcon,
// } from "@mui/icons-material";
// import { useTranslation } from "react-i18next";

// const CustomToolbar = ({
//   onSearch,
//   onFilterChange,
//   onColumnVisibilityChange,
//   columns = [],
//   searchPlaceholder = "Search...",
//   showColumnVisibility = true,
//   showFilters = true,
//   filters = {},
//   columnVisibilityModel = {},
// }) => {
//   const { t } = useTranslation();
//   const [searchValue, setSearchValue] = useState("");
//   const [filterAnchorEl, setFilterAnchorEl] = useState(null);
//   const [columnAnchorEl, setColumnAnchorEl] = useState(null);
//   const [filterDialogOpen, setFilterDialogOpen] = useState(false);
//   const [localFilters, setLocalFilters] = useState(filters);

//   const handleSearchChange = (event) => {
//     const value = event.target.value;
//     setSearchValue(value);
//     onSearch(value);
//   };

//   const handleSearchClear = () => {
//     setSearchValue("");
//     onSearch("");
//   };

//   const handleFilterClick = (event) => {
//     setFilterAnchorEl(event.currentTarget);
//   };

//   const handleFilterClose = () => {
//     setFilterAnchorEl(null);
//   };

//   const handleColumnClick = (event) => {
//     setColumnAnchorEl(event.currentTarget);
//   };

//   const handleColumnClose = () => {
//     setColumnAnchorEl(null);
//   };

//   const handleColumnVisibilityToggle = (field) => {
//     const newModel = {
//       ...columnVisibilityModel,
//       [field]: !columnVisibilityModel[field],
//     };
//     onColumnVisibilityChange(newModel);
//   };

//   const handleFilterDialogOpen = () => {
//     setLocalFilters(filters);
//     setFilterDialogOpen(true);
//     handleFilterClose();
//   };

//   const handleFilterDialogClose = () => {
//     setFilterDialogOpen(false);
//   };

//   const handleFilterApply = () => {
//     onFilterChange(localFilters);
//     handleFilterDialogClose();
//   };

//   const handleFilterClear = () => {
//     const clearedFilters = {};
//     Object.keys(localFilters).forEach(key => {
//       clearedFilters[key] = '';
//     });
//     setLocalFilters(clearedFilters);
//     onFilterChange(clearedFilters);
//   };

//   const handleFilterChangeLocal = (field, value) => {
//     setLocalFilters(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const availableFilters = columns.filter(col => col.filterable);

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         alignItems: "center",
//         gap: 2,
//         padding: 2,
//         backgroundColor: "background.paper",
//         borderBottom: 1,
//         borderColor: "divider",
//         flexWrap: "wrap",
//       }}
//     >
//       {/* Search Input */}
//       <TextField
//         variant="outlined"
//         size="small"
//         placeholder={searchPlaceholder}
//         value={searchValue}
//         onChange={handleSearchChange}
//         InputProps={{
//           startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
//           endAdornment: searchValue && (
//             <IconButton size="small" onClick={handleSearchClear}>
//               <ClearIcon />
//             </IconButton>
//           ),
//         }}
//         sx={{ minWidth: 300 }}
//       />

//       {/* Filter Button */}
//       {showFilters && (
//         <>
//           <IconButton onClick={handleFilterClick} size="small">
//             <FilterIcon />
//           </IconButton>
//           <Menu
//             anchorEl={filterAnchorEl}
//             open={Boolean(filterAnchorEl)}
//             onClose={handleFilterClose}
//           >
//             <MenuItem onClick={handleFilterDialogOpen}>
//               {t("Advanced Filters")}
//             </MenuItem>
//           </Menu>
//         </>
//       )}

//       {/* Column Visibility Button */}
//       {showColumnVisibility && columns.length > 0 && (
//         <>
//           <IconButton onClick={handleColumnClick} size="small">
//             <ViewColumnIcon />
//           </IconButton>
//           <Menu
//             anchorEl={columnAnchorEl}
//             open={Boolean(columnAnchorEl)}
//             onClose={handleColumnClose}
//           >
//             {columns.map((column) => (
//               <MenuItem
//                 key={column.field}
//                 onClick={() => handleColumnVisibilityToggle(column.field)}
//                 dense
//               >
//                 <Checkbox
//                   checked={!columnVisibilityModel[column.field]}
//                   onChange={() => handleColumnVisibilityToggle(column.field)}
//                 />
//                 {column.headerName}
//               </MenuItem>
//             ))}
//           </Menu>
//         </>
//       )}

//       {/* Active Filters Display */}
//       {showFilters && Object.values(filters).some(value => value) && (
//         <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
//           {Object.entries(filters).map(([key, value]) => {
//             if (!value) return null;
//             const column = columns.find(col => col.field === key);
//             return (
//               <Chip
//                 key={key}
//                 label={`${column?.headerName || key}: ${value}`}
//                 onDelete={() => onFilterChange({ ...filters, [key]: "" })}
//                 size="small"
//               />
//             );
//           })}
//           <Button
//             size="small"
//             onClick={handleFilterClear}
//             sx={{ minWidth: "auto" }}
//           >
//             {t("Clear All")}
//           </Button>
//         </Box>
//       )}

//       {/* Filter Dialog */}
//       <Dialog
//         open={filterDialogOpen}
//         onClose={handleFilterDialogClose}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>{t("Advanced Filters")}</DialogTitle>
//         <DialogContent>
//           <FormGroup sx={{ gap: 2, mt: 1 }}>
//             {availableFilters.map((column) => (
//               <FormControl key={column.field} size="small">
//                 <InputLabel>{column.headerName}</InputLabel>
//                 <Select
//                   value={localFilters[column.field] || ""}
//                   onChange={(e) =>
//                     handleFilterChangeLocal(column.field, e.target.value)
//                   }
//                   input={<OutlinedInput label={column.headerName} />}
//                 >
//                   <MenuItem value="">
//                     <em>{t("All")}</em>
//                   </MenuItem>
//                   {column.filterOptions?.map((option) => (
//                     <MenuItem key={option.value} value={option.value}>
//                       {option.label}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             ))}
//           </FormGroup>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleFilterClear}>{t("Clear All")}</Button>
//           <Button onClick={handleFilterDialogClose}>{t("Cancel")}</Button>
//           <Button onClick={handleFilterApply} variant="contained">
//             {t("Apply Filters")}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default CustomToolbar;
