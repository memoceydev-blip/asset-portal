import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Paper,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "./api";

export default function App({ mode, onToggleColorMode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const [sortModel, setSortModel] = useState([{ field: "id", sort: "asc" }]);
  const [search, setSearch] = useState("");

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.7 },
      { field: "tag", headerName: "Tag", flex: 1.2 },
      { field: "status", headerName: "Status", flex: 1 },
      { field: "owner", headerName: "Owner", flex: 1.2 },
      { field: "location", headerName: "Location", flex: 1.2 },
      { field: "os", headerName: "OS", flex: 1.2 },
      { field: "type", headerName: "Type", flex: 1.1 },
    ],
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sortBy = sortModel[0]?.field || "id";
        const sortDir = sortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/assets", {
          params: {
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: search || undefined,
          },
        });

        setRows(response.data.items);
        setRowCount(response.data.total);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paginationModel, sortModel, search]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Asset Master
          </Typography>
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton color="inherit" onClick={onToggleColorMode} aria-label="toggle color mode">
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 3 }}>
        <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
          <TextField
            fullWidth
            label="Search"
            value={search}
            onChange={(e) => {
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
              setSearch(e.target.value);
            }}
          />
        </Paper>

        <Paper sx={{ height: 700, width: "100%", overflow: "hidden" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={rowCount}
            pagination
            paginationMode="server"
            sortingMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            sx={{
              bgcolor: "background.paper",
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: "background.paper",
              },
            }}
          />
        </Paper>
      </Container>
    </Box>
  );
}

App.propTypes = {
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggleColorMode: PropTypes.func.isRequired,
};
