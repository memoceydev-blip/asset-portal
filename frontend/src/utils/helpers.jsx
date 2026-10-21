import { Box, Typography, TextField } from "@mui/material";

export const getPowerStateConfig = (state) => {
  const normalized = state?.toLowerCase() || "";
  if (normalized.includes("on")) {
    return { color: "success", label: "Powered On" };
  }
  if (normalized.includes("off")) {
    return { color: "error", label: "Powered Off" };
  }
  return { color: "default", label: "Unknown" };
};

export const createHeaderWithFilter = (field, label, filterState, setFilterFn) => {
  return () => (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.5, py: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
        {label}
      </Typography>
      <TextField
        size="small"
        placeholder="Filter..."
        variant="outlined"
        value={filterState[field] || ""}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setFilterFn(field, e.target.value)}
        inputProps={{
          style: { padding: "2px 6px", fontSize: "0.75rem" },
        }}
        sx={{ bgcolor: "background.paper" }}
      />
    </Box>
  );
};
