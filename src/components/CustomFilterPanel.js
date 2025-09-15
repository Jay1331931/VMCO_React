import { GridFilterPanel, useGridApiContext } from "@mui/x-data-grid-pro";
import { Box, Button } from "@mui/material";

export const CustomFilterPanel = (props) => {
  const apiRef = useGridApiContext();

  // ✅ Access filter model correctly
  const filterModel = apiRef.current.state.filter.filterModel;

  const handleApply = (filterItem) => {
    console.log("Applying filter:", filterItem);
    // Re-trigger data fetch or local filtering here
  };

  return (
    <GridFilterPanel {...props}>
      {filterModel.items.map((item, index) => (
        <Box key={index} sx={{ mt: 1, display: "flex", alignItems: "center" }}>
          {/* The built-in filter UI renders above. This just adds the button */}
          <Button
            variant="outlined"
            size="small"
            sx={{ ml: 2 }}
            onClick={() => handleApply(item)}
          >
            Apply
          </Button>
        </Box>
      ))}
    </GridFilterPanel>
  );
};
