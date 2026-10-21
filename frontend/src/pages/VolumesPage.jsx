import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Box, Paper, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { api } from "../api";

export default function VolumesPage({ allowedPages }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [sortModel, setSortModel] = useState([{ field: "id", sort: "asc" }]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(delayHandler);
  }, [search]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.8 },
      { field: "volume_name", headerName: "Volume Name", flex: 1.5 },
      { field: "asset_id", headerName: "Asset ID", flex: 1 },
      { field: "capacity_gb", headerName: "Capacity (GB)", flex: 1 },
      { field: "used_gb", headerName: "Used (GB)", flex: 1 },
      { field: "status", headerName: "Status", flex: 1 },
    ],
    []
  );

  useEffect(() => {
    if (!allowedPages.includes("volumes")) return;

    const controller = new AbortController();
    const loadVolumes = async () => {
      setLoading(true);
      try {
        const sortBy = sortModel[0]?.field || "id";
        const sortDir = sortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/assets/volumes", {
          signal: controller.signal,
          params: {
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: debouncedSearch || undefined,
          },
        });

        setRows(response.data?.items || []);
        setRowCount(response.data?.total || 0);
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError") return;
        console.error("Error loading volumes data:", error);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadVolumes();
    return () => controller.abort();
  }, [paginationModel, sortModel, debouncedSearch, allowedPages]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
        <TextField
          fullWidth
          size="small"
          label="Search Volumes"
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
            '& .MuiDataGrid-columnHeaders': { bgcolor: "background.paper" },
          }}
        />
      </Paper>
    </Box>
  );
}

VolumesPage.propTypes = {
  allowedPages: PropTypes.arrayOf(PropTypes.string).isRequired,
};
