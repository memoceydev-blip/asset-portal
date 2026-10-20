import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "../api";
import { getPowerStateConfig, actionButtonSx } from "../utils/helpers";

export default function ArchivedPage({ onSelectAsset, allowedPages }) {
  const [archivedRows, setArchivedRows] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedExporting, setArchivedExporting] = useState(false);
  const [archivedRowCount, setArchivedRowCount] = useState(0);
  const [archivedSearch, setArchivedSearch] = useState("");
  const [debouncedArchivedSearch, setDebouncedArchivedSearch] = useState("");
  const [archivedColumnFilters, setArchivedColumnFilters] = useState({});
  const [debouncedArchivedColumnFilters, setDebouncedArchivedColumnFilters] = useState({});
  const [archivedPaginationModel, setArchivedPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [archivedSortModel, setArchivedSortModel] = useState([{ field: "id", sort: "asc" }]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedArchivedSearch(archivedSearch), 400);
    return () => clearTimeout(delayHandler);
  }, [archivedSearch]);

  useEffect(() => {
    const delayHandler = setTimeout(() => {
      setDebouncedArchivedColumnFilters(archivedColumnFilters);
    }, 400);
    return () => clearTimeout(archivedColumnFilters);
  }, [archivedColumnFilters]);

  const handleArchivedColumnFilterChange = (field, value) => {
    setArchivedPaginationModel((prev) => ({ ...prev, page: 0 }));
    setArchivedColumnFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearArchivedFilters = () => {
    setArchivedSearch("");
    setArchivedColumnFilters({});
    setArchivedPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const createHeaderWithFilter = (field, label, filterState, setFilterFn) => {
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

  const archivedColumns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.8, renderHeader: createHeaderWithFilter("id", "ID", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "name", headerName: "Name", flex: 1.2, renderHeader: createHeaderWithFilter("name", "Name", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "tag", headerName: "Tag", flex: 1, renderHeader: createHeaderWithFilter("tag", "Tag", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "type", headerName: "Type", flex: 1, renderHeader: createHeaderWithFilter("type", "Type", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "owner", headerName: "Owner", flex: 1.1, renderHeader: createHeaderWithFilter("owner", "Owner", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "location", headerName: "Location", flex: 1.1, renderHeader: createHeaderWithFilter("location", "Location", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "os", headerName: "OS", flex: 1.1, renderHeader: createHeaderWithFilter("os", "OS", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "status", headerName: "Status", flex: 0.9, renderHeader: createHeaderWithFilter("status", "Status", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { 
        field: "power_state", 
        headerName: "Power State", 
        flex: 1.1,
        renderHeader: createHeaderWithFilter("power_state", "Power State", archivedColumnFilters, handleArchivedColumnFilterChange),
        renderCell: (params) => {
          const cfg = getPowerStateConfig(params.value);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: "50%", 
                  bgcolor: cfg.color === "default" ? "text.disabled" : `${cfg.color}.main` 
                }} 
              />
              <Typography variant="body2">{cfg.label}</Typography>
            </Box>
          );
        }
      },
      { field: "ips", headerName: "IPs", flex: 1.3, renderHeader: createHeaderWithFilter("ips", "IPs", archivedColumnFilters, handleArchivedColumnFilterChange) },
      { field: "alias", headerName: "Alias", flex: 1.2, renderHeader: createHeaderWithFilter("alias", "Alias", archivedColumnFilters, handleArchivedColumnFilterChange) },
    ],
    [archivedColumnFilters]
  );

  useEffect(() => {
    if (!allowedPages.includes("archived")) return;

    const controller = new AbortController();
    const loadArchived = async () => {
      setArchivedLoading(true);
      try {
        const sortBy = archivedSortModel[0]?.field || "id";
        const sortDir = archivedSortModel[0]?.sort || "asc";

        const filterParams = {};
        Object.entries(debouncedArchivedColumnFilters).forEach(([field, val]) => {
          if (val && val.trim() !== "") {
            filterParams[`${field}_filter`] = val.trim();
          }
        });

        const response = await api.get("/api/v1/assets/archive", {
          signal: controller.signal,
          params: {
            page: archivedPaginationModel.page + 1,
            page_size: archivedPaginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: debouncedArchivedSearch || undefined,
            ...filterParams,
          },
        });

        setArchivedRows(response.data?.items || []);
        setArchivedRowCount(response.data?.total || 0);
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError") return;
        console.error("Error loading archived assets list:", error);
      } finally {
        if (!controller.signal.aborted) {
          setArchivedLoading(false);
        }
      }
    };

    loadArchived();
    return () => controller.abort();
  }, [archivedPaginationModel, archivedSortModel, debouncedArchivedSearch, debouncedArchivedColumnFilters, allowedPages]);

  const handleExportArchivedExcel = async () => {
    setArchivedExporting(true);
    try {
      const sortBy = archivedSortModel[0]?.field || "id";
      const sortDir = archivedSortModel[0]?.sort || "asc";

      const filterParams = {};
      Object.entries(debouncedArchivedColumnFilters).forEach(([field, val]) => {
        if (val && val.trim() !== "") {
          filterParams[`${field}_filter`] = val.trim();
        }
      });

      const response = await api.get("/api/v1/assets/archive", {
        params: {
          page: 1,
          page_size: 100000,
          sort_by: sortBy,
          sort_dir: sortDir,
          search: debouncedArchivedSearch || undefined,
          ...filterParams,
        },
      });

      const fullItems = response.data?.items || [];
      if (fullItems.length === 0) return;

      const worksheet = XLSX.utils.json_to_sheet(fullItems);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Archived_Assets");
      XLSX.writeFile(workbook, "archived_assets_full_export.xlsx");
    } catch (error) {
      console.error("Error fetching full archived assets set for export:", error);
    } finally {
      setArchivedExporting(false);
    }
  };

  const hasActiveArchivedFilters = useMemo(() => {
    if (archivedSearch.trim() !== "") return true;
    return Object.values(archivedColumnFilters).some((val) => val && val.trim() !== "");
  }, [archivedSearch, archivedColumnFilters]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 780, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          fullWidth
          size="small"
          label="Search Archived Assets"
          value={archivedSearch}
          onChange={(e) => {
            setArchivedPaginationModel((prev) => ({ ...prev, page: 0 }));
            setArchivedSearch(e.target.value);
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportArchivedExcel}
          disabled={archivedExporting || archivedRowCount === 0}
          sx={actionButtonSx}
        >
          {archivedExporting ? "Exporting..." : "Export Excel"}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<FilterAltOffOutlinedIcon />}
          onClick={handleClearArchivedFilters}
          disabled={!hasActiveArchivedFilters}
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
          rows={archivedRows}
          columns={archivedColumns}
          loading={archivedLoading}
          rowCount={archivedRowCount}
          pagination
          paginationMode="server"
          sortingMode="server"
          paginationModel={archivedPaginationModel}
          onPaginationModelChange={setArchivedPaginationModel}
          sortModel={archivedSortModel}
          onSortModelChange={setArchivedSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(params) => onSelectAsset(params.row.id)}
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

ArchivedPage.propTypes = {
  onSelectAsset: PropTypes.func.isRequired,
  allowedPages: PropTypes.arrayOf(PropTypes.string).isRequired,
};