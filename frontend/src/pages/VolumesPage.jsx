import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Button, Paper, TextField } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "../api";
import { actionButtonSx } from "../config/constants";
import { createHeaderWithFilter } from "../utils/helpers";

export default function VolumesPage({ onSelectVolume }) {
  const [volumeRows, setVolumeRows] = useState([]);
  const [volumeLoading, setVolumeLoading] = useState(false);
  const [volumeExporting, setVolumeExporting] = useState(false);
  const [volumeRowCount, setVolumeRowCount] = useState(0);
  const [volumeSearch, setVolumeSearch] = useState("");
  const [debouncedVolumeSearch, setDebouncedVolumeSearch] = useState("");
  const [volumeColumnFilters, setVolumeColumnFilters] = useState({});
  const [debouncedVolumeColumnFilters, setDebouncedVolumeColumnFilters] = useState({});
  const [volumePaginationModel, setVolumePaginationModel] = useState({ page: 0, pageSize: 50 });
  const [volumeSortModel, setVolumeSortModel] = useState([{ field: "id", sort: "asc" }]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedVolumeSearch(volumeSearch), 400);
    return () => clearTimeout(delayHandler);
  }, [volumeSearch]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedVolumeColumnFilters(volumeColumnFilters), 400);
    return () => clearTimeout(volumeColumnFilters);
  }, [volumeColumnFilters]);

  const handleVolumeColumnFilterChange = (field, value) => {
    setVolumePaginationModel((prev) => ({ ...prev, page: 0 }));
    setVolumeColumnFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearVolumeFilters = () => {
    setVolumeSearch("");
    setVolumeColumnFilters({});
    setVolumePaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const volumeColumns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.8, renderHeader: createHeaderWithFilter("id", "ID", volumeColumnFilters, handleVolumeColumnFilterChange) },
      { field: "volume_name", headerName: "Volume Name", flex: 1.4, renderHeader: createHeaderWithFilter("volume_name", "Volume Name", volumeColumnFilters, handleVolumeColumnFilterChange) },
      { field: "storage_name", headerName: "Storage Name", flex: 1.4, renderHeader: createHeaderWithFilter("storage_name", "Storage Name", volumeColumnFilters, handleVolumeColumnFilterChange) },
      { field: "owner", headerName: "Owner", flex: 1.1, renderHeader: createHeaderWithFilter("owner", "Owner", volumeColumnFilters, handleVolumeColumnFilterChange) },
    ],
    [volumeColumnFilters]
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadVolumes = async () => {
      setVolumeLoading(true);
      try {
        const sortBy = volumeSortModel[0]?.field || "id";
        const sortDir = volumeSortModel[0]?.sort || "asc";

        const filterParams = {};
        Object.entries(debouncedVolumeColumnFilters).forEach(([field, val]) => {
          if (val && val.trim() !== "") {
            filterParams[`${field}_filter`] = val.trim();
          }
        });

        const response = await api.get("/api/v1/volumes", {
          signal: controller.signal,
          params: {
            page: volumePaginationModel.page + 1,
            page_size: volumePaginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: debouncedVolumeSearch || undefined,
            ...filterParams,
          },
        });

        setVolumeRows(response.data?.items || []);
        setVolumeRowCount(response.data?.total || 0);
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError") return;
        console.error("Error loading volumes list:", error);
      } finally {
        if (!controller.signal.aborted) {
          setVolumeLoading(false);
        }
      }
    };

    loadVolumes();
    return () => controller.abort();
  }, [volumePaginationModel, volumeSortModel, debouncedVolumeSearch, debouncedVolumeColumnFilters]);

  const handleExportVolumesExcel = async () => {
    setVolumeExporting(true);
    try {
      const sortBy = volumeSortModel[0]?.field || "id";
      const sortDir = volumeSortModel[0]?.sort || "asc";

      const filterParams = {};
      Object.entries(debouncedVolumeColumnFilters).forEach(([field, val]) => {
        if (val && val.trim() !== "") {
          filterParams[`${field}_filter`] = val.trim();
        }
      });

      const response = await api.get("/api/v1/volumes", {
        params: {
          page: 1,
          page_size: 100000,
          sort_by: sortBy,
          sort_dir: sortDir,
          search: debouncedVolumeSearch || undefined,
          ...filterParams,
        },
      });

      const fullItems = response.data?.items || [];
      if (fullItems.length === 0) return;

      const worksheet = XLSX.utils.json_to_sheet(fullItems);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Volumes");
      XLSX.writeFile(workbook, "volumes_full_export.xlsx");
    } catch (error) {
      console.error("Error fetching full volumes set for export:", error);
    } finally {
      setVolumeExporting(false);
    }
  };

  const hasActiveVolumeFilters = useMemo(() => {
    if (volumeSearch.trim() !== "") return true;
    return Object.values(volumeColumnFilters).some((val) => val && val.trim() !== "");
  }, [volumeSearch, volumeColumnFilters]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 780, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          fullWidth
          size="small"
          label="Search Volumes"
          value={volumeSearch}
          onChange={(e) => {
            setVolumePaginationModel((prev) => ({ ...prev, page: 0 }));
            setVolumeSearch(e.target.value);
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportVolumesExcel}
          disabled={volumeExporting || volumeRowCount === 0}
          sx={actionButtonSx}
        >
          {volumeExporting ? "Exporting..." : "Export Excel"}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<FilterAltOffOutlinedIcon />}
          onClick={handleClearVolumeFilters}
          disabled={!hasActiveVolumeFilters}
          sx={{
            ...actionButtonSx,
            "&:hover": {
              bgcolor: "error.main",
              color: "error.contrastText",
              borderColor: "error.main",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Clear Filters
        </Button>
      </Paper>

      <Paper sx={{ height: 700, width: "100%", overflow: "hidden" }}>
        <DataGrid
          columnHeaderHeight={70}
          rows={volumeRows}
          columns={volumeColumns}
          loading={volumeLoading}
          rowCount={volumeRowCount}
          pagination
          paginationMode="server"
          sortingMode="server"
          paginationModel={volumePaginationModel}
          onPaginationModelChange={setVolumePaginationModel}
          sortModel={volumeSortModel}
          onSortModelChange={setVolumeSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(params) => onSelectVolume(params.row.id)}
          sx={{
            bgcolor: "background.paper",
            cursor: "pointer",
            '& .MuiDataGrid-columnHeaders': { bgcolor: "background.paper" },
          }}
        />
      </Paper>
    </>
  );
}

VolumesPage.propTypes = {
  onSelectVolume: PropTypes.func.isRequired,
};
