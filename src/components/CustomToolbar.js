import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewColumn as ViewColumnIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

const CustomToolbar = ({
  onSearch,
  onFilterChange,
  onColumnVisibilityChange,
  columns = [],
  searchPlaceholder = "Search...",
  showColumnVisibility = true,
  showFilters = true,
  filters = {},
  columnVisibilityModel = {},
}) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [columnAnchorEl, setColumnAnchorEl] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleSearchClear = () => {
    setSearchValue("");
    onSearch("");
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleColumnClick = (event) => {
    setColumnAnchorEl(event.currentTarget);
  };

  const handleColumnClose = () => {
    setColumnAnchorEl(null);
  };

  const handleColumnVisibilityToggle = (field) => {
    const newModel = {
      ...columnVisibilityModel,
      [field]: !columnVisibilityModel[field],
    };
    onColumnVisibilityChange(newModel);
  };

  const handleFilterDialogOpen = () => {
    setLocalFilters(filters);
    setFilterDialogOpen(true);
    handleFilterClose();
  };

  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
  };

  const handleFilterApply = () => {
    onFilterChange(localFilters);
    handleFilterDialogClose();
  };

  const handleFilterClear = () => {
    const clearedFilters = {};
    Object.keys(localFilters).forEach(key => {
      clearedFilters[key] = '';
    });
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const handleFilterChangeLocal = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const availableFilters = columns.filter(col => col.filterable);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        backgroundColor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        flexWrap: "wrap",
      }}
    >
      {/* Search Input */}
      <TextField
        variant="outlined"
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
          endAdornment: searchValue && (
            <IconButton size="small" onClick={handleSearchClear}>
              <ClearIcon />
            </IconButton>
          ),
        }}
        sx={{ minWidth: 300 }}
      />

      {/* Filter Button */}
      {showFilters && (
        <>
          <IconButton onClick={handleFilterClick} size="small">
            <FilterIcon />
          </IconButton>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={handleFilterDialogOpen}>
              {t("Advanced Filters")}
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Column Visibility Button */}
      {showColumnVisibility && columns.length > 0 && (
        <>
          <IconButton onClick={handleColumnClick} size="small">
            <ViewColumnIcon />
          </IconButton>
          <Menu
            anchorEl={columnAnchorEl}
            open={Boolean(columnAnchorEl)}
            onClose={handleColumnClose}
          >
            {columns.map((column) => (
              <MenuItem
                key={column.field}
                onClick={() => handleColumnVisibilityToggle(column.field)}
                dense
              >
                <Checkbox
                  checked={!columnVisibilityModel[column.field]}
                  onChange={() => handleColumnVisibilityToggle(column.field)}
                />
                {column.headerName}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Active Filters Display */}
      {showFilters && Object.values(filters).some(value => value) && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            const column = columns.find(col => col.field === key);
            return (
              <Chip
                key={key}
                label={`${column?.headerName || key}: ${value}`}
                onDelete={() => onFilterChange({ ...filters, [key]: "" })}
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
      )}

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={handleFilterDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("Advanced Filters")}</DialogTitle>
        <DialogContent>
          <FormGroup sx={{ gap: 2, mt: 1 }}>
            {availableFilters.map((column) => (
              <FormControl key={column.field} size="small">
                <InputLabel>{column.headerName}</InputLabel>
                <Select
                  value={localFilters[column.field] || ""}
                  onChange={(e) =>
                    handleFilterChangeLocal(column.field, e.target.value)
                  }
                  input={<OutlinedInput label={column.headerName} />}
                >
                  <MenuItem value="">
                    <em>{t("All")}</em>
                  </MenuItem>
                  {column.filterOptions?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFilterClear}>{t("Clear All")}</Button>
          <Button onClick={handleFilterDialogClose}>{t("Cancel")}</Button>
          <Button onClick={handleFilterApply} variant="contained">
            {t("Apply Filters")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomToolbar;