import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, Button, Paper, TextField, Typography } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "../api";
import { actionButtonSx } from "../config/constants";
import { createHeaderWithFilter, getPowerStateConfig } from "../utils/helpers";

export default function ImpersonationPage({ onSelectAsset }) {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownersLoading, setOwnersLoading] = useState(false);

  const [assetRows, setAssetRows] = useState([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetExporting, setAssetExporting] = useState(false);
  const [assetRowCount, setAssetRowCount] = useState(0);
  const [assetSearch, setAssetSearch] = useState("");
  const [debouncedAssetSearch, setDebouncedAssetSearch] = useState("");
  const [assetColumnFilters, setAssetColumnFilters] = useState({});
  const [debouncedAssetColumnFilters, setDebouncedAssetColumnFilters] = useState({});
  const [assetPaginationModel, setAssetPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [assetSortModel, setAssetSortModel] = useState([{ field: "id", sort: "asc" }]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchOwners = async () => {
      setOwnersLoading(true);
      try {
        const response = await api.get("/api/v1/assets/owners", { signal: controller.signal });
        setOwners(response.data?.items || response.data || []);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error fetching owners list:", err);
      } finally {
        if (!controller.signal.aborted) {
          setOwnersLoading(false);
        }
      }
    };

    fetchOwners();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedAssetSearch(assetSearch), 400);
    return () => clearTimeout(delayHandler);
  }, [assetSearch]);

  useEffect(() => {
    const delayHandler = setTimeout(() => {
      setDebouncedAssetColumnFilters(assetColumnFilters);
    }, 400);
    return () => clearTimeout(assetColumnFilters);
  }, [assetColumnFilters]);

  const handleColumnFilterChange = (field, value) => {
    setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
    setAssetColumnFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearAssetFilters = () => {
    setAssetSearch("");
    setAssetColumnFilters({});
    setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const assetColumns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.8, renderHeader: createHeaderWithFilter("id", "ID", assetColumnFilters, handleColumnFilterChange) },
      { field: "name", headerName: "Name", flex: 1.2, renderHeader: createHeaderWithFilter("name", "Name", assetColumnFilters, handleColumnFilterChange) },
      { field: "tag", headerName: "Tag", flex: 1, renderHeader: createHeaderWithFilter("tag", "Tag", assetColumnFilters, handleColumnFilterChange) },
      { field: "type", headerName: "Type", flex: 1, renderHeader: createHeaderWithFilter("type", "Type", assetColumnFilters, handleColumnFilterChange) },
      { field: "owner", headerName: "Owner", flex: 1.1, renderHeader: createHeaderWithFilter("owner", "Owner", assetColumnFilters, handleColumnFilterChange) },
      { field: "location", headerName: "Location", flex: 1.1, renderHeader: createHeaderWithFilter("location", "Location", assetColumnFilters, handleColumnFilterChange) },
      { field: "os", headerName: "OS", flex: 1.1, renderHeader: createHeaderWithFilter("os", "OS", assetColumnFilters, handleColumnFilterChange) },
      { field: "status", headerName: "Status", flex: 0.9, renderHeader: createHeaderWithFilter("status", "Status", assetColumnFilters, handleColumnFilterChange) },
      { 
        field: "power_state", 
        headerName: "Power State", 
        flex: 1.1,
        renderHeader: createHeaderWithFilter("power_state", "Power State", assetColumnFilters, handleColumnFilterChange),
        renderCell: (params) => {
          const cfg = getPowerStateConfig(params.value);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cfg.color === "default" ? "text.disabled" : `${cfg.color}.main` }} />
              <Typography variant="body2">{cfg.label}</Typography>
            </Box>
          );
        }
      },
      { field: "ips", headerName: "IPs", flex: 1.3, renderHeader: createHeaderWithFilter("ips", "IPs", assetColumnFilters, handleColumnFilterChange) },
      { field: "alias", headerName: "Alias", flex: 1.2, renderHeader: createHeaderWithFilter("alias", "Alias", assetColumnFilters, handleColumnFilterChange) },
    ],
    [assetColumnFilters]
  );

  useEffect(() => {
    if (!selectedOwner?.owner_id) {
      setAssetRows([]);
      setAssetRowCount(0);
      return;
    }

    const controller = new AbortController();
    const loadOwnerAssets = async () => {
      setAssetLoading(true);
      try {
        const sortBy = assetSortModel[0]?.field || "id";
        const sortDir = assetSortModel[0]?.sort || "asc";

        const filterParams = {};
        Object.entries(debouncedAssetColumnFilters).forEach(([field, val]) => {
          if (val && val.trim() !== "") {
            filterParams[`${field}_filter`] = val.trim();
          }
        });

        const response = await api.get(`/api/v1/assets/owners/${selectedOwner.owner_id}`, {
          signal: controller.signal,
          params: {
            page: assetPaginationModel.page + 1,
            page_size: assetPaginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: debouncedAssetSearch || undefined,
            ...filterParams,
          },
        });

        setAssetRows(response.data?.items || []);
        setAssetRowCount(response.data?.total || 0);
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError") return;
        console.error("Error loading owner assets list:", error);
      } finally {
        if (!controller.signal.aborted) {
          setAssetLoading(false);
        }
      }
    };

    loadOwnerAssets();
    return () => controller.abort();
  }, [selectedOwner, assetPaginationModel, assetSortModel, debouncedAssetSearch, debouncedAssetColumnFilters]);

  const handleExportAssetsExcel = async () => {
    if (!selectedOwner?.owner_id) return;

    setAssetExporting(true);
    try {
      const sortBy = assetSortModel[0]?.field || "id";
      const sortDir = assetSortModel[0]?.sort || "asc";

      const filterParams = {};
      Object.entries(debouncedAssetColumnFilters).forEach(([field, val]) => {
        if (val && val.trim() !== "") {
          filterParams[`${field}_filter`] = val.trim();
        }
      });

      const response = await api.get(`/api/v1/assets/owners/${selectedOwner.owner_id}`, {
        params: {
          page: 1,
          page_size: 100000,
          sort_by: sortBy,
          sort_dir: sortDir,
          search: debouncedAssetSearch || undefined,
          ...filterParams,
        },
      });

      const fullItems = response.data?.items || [];
      if (fullItems.length === 0) return;

      const worksheet = XLSX.utils.json_to_sheet(fullItems);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Impersonated_Assets");
      XLSX.writeFile(workbook, `impersonated_assets_${selectedOwner.owner_name || selectedOwner.owner_id}.xlsx`);
    } catch (error) {
      console.error("Error exporting impersonated assets set:", error);
    } finally {
      setAssetExporting(false);
    }
  };

  const hasActiveAssetFilters = useMemo(() => {
    if (assetSearch.trim() !== "") return true;
    return Object.values(assetColumnFilters).some((val) => val && val.trim() !== "");
  }, [assetSearch, assetColumnFilters]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <Autocomplete
          size="small"
          options={owners}
          loading={ownersLoading}
          getOptionLabel={(option) => option.owner_name || String(option.owner_id || "")}
          isOptionEqualToValue={(option, value) => option.owner_id === value.owner_id}
          value={selectedOwner}
          onChange={(_, newValue) => {
            setSelectedOwner(newValue);
            setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          sx={{ minWidth: 280, flex: 1 }}
          renderInput={(params) => (
            <TextField {...params} label="Select Asset Owner (Impersonate)" placeholder="Choose owner..." />
          )}
        />

        <TextField
          size="small"
          label="Search Assets"
          value={assetSearch}
          disabled={!selectedOwner}
          onChange={(e) => {
            setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
            setAssetSearch(e.target.value);
          }}
          sx={{ flex: 1.5, minWidth: 220 }}
        />

        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportAssetsExcel}
          disabled={!selectedOwner || assetExporting || assetRowCount === 0}
          sx={actionButtonSx}
        >
          {assetExporting ? "Exporting..." : "Export Excel"}
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<FilterAltOffOutlinedIcon />}
          onClick={handleClearAssetFilters}
          disabled={!selectedOwner || !hasActiveAssetFilters}
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
          rows={assetRows}
          columns={assetColumns}
          loading={assetLoading}
          rowCount={assetRowCount}
          pagination
          paginationMode="server"
          sortingMode="server"
          paginationModel={assetPaginationModel}
          onPaginationModelChange={setAssetPaginationModel}
          sortModel={assetSortModel}
          onSortModelChange={setAssetSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(params) => onSelectAsset(params.row.id)}
          sx={{
            bgcolor: "background.paper",
            cursor: selectedOwner ? "pointer" : "default",
            '& .MuiDataGrid-columnHeaders': { bgcolor: "background.paper" },
          }}
        />
      </Paper>
    </Box>
  );
}

ImpersonationPage.propTypes = {
  onSelectAsset: PropTypes.func.isRequired,
};
