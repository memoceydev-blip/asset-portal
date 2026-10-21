import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "../api";
import { actionButtonSx } from "../config/constants";
import { createHeaderWithFilter } from "../utils/helpers";

export default function VolumeDetailsModal({ volumeId, open, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});

  useEffect(() => {
    if (!open || !volumeId) {
      setDetails(null);
      setError(null);
      setColumnFilters({});
      return;
    }

    const controller = new AbortController();

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/volumes/${volumeId}`, {
          signal: controller.signal,
        });
        setDetails(response.data);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error fetching volume details:", err);
        setError("Failed to load volume details. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDetails();
    return () => controller.abort();
  }, [volumeId, open]);

  const handleFilterChange = (field, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const columns = useMemo(
    () => [
      {
        field: "server_name",
        headerName: "Server Name",
        flex: 1.2,
        renderHeader: createHeaderWithFilter("server_name", "Server Name", columnFilters, handleFilterChange),
      },
      {
        field: "server_owner",
        headerName: "Server Owner",
        flex: 1.2,
        renderHeader: createHeaderWithFilter("server_owner", "Server Owner", columnFilters, handleFilterChange),
      },
      {
        field: "mount_path",
        headerName: "Mount Path",
        flex: 1.5,
        renderHeader: createHeaderWithFilter("mount_path", "Mount Path", columnFilters, handleFilterChange),
      },
      {
        field: "mount_type",
        headerName: "Mount Type",
        flex: 1,
        renderHeader: createHeaderWithFilter("mount_type", "Mount Type", columnFilters, handleFilterChange),
      },
    ],
    [columnFilters]
  );

  const filteredServers = useMemo(() => {
    const servers = details?.servers || details?.items || (Array.isArray(details) ? details : []);
    return servers.filter((server) => {
      return Object.entries(columnFilters).every(([field, query]) => {
        if (!query || query.trim() === "") return true;
        const val = String(server[field] || "").toLowerCase();
        return val.includes(query.trim().toLowerCase());
      });
    });
  }, [details, columnFilters]);

  const handleExportVolumeDetailsExcel = async () => {
    setExporting(true);
    try {
      if (!filteredServers || filteredServers.length === 0) return;

      const exportData = filteredServers.map((srv) => ({
        "Volume ID": volumeId,
        "Volume Name": details?.volume_name || "",
        "Storage Name": details?.storage_name || "",
        "Volume Owner": details?.owner || "",
        "Server Name": srv.server_name || "",
        "Server Owner": srv.server_owner || "",
        "Mount Path": srv.mount_path || "",
        "Mount Type": srv.mount_type || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Volume Details");

      const fileName = details?.volume_name
        ? `volume_${details.volume_name}_details.xlsx`
        : `volume_${volumeId}_details.xlsx`;

      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error exporting volume details to Excel:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Volume Details {volumeId ? `#${volumeId}` : ""}
        </Typography>

        {!loading && details && (
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
            {details.volume_name && (
              <Chip label={`Volume: ${details.volume_name}`} size="small" color="primary" variant="outlined" />
            )}
            {details.storage_name && (
              <Chip label={`Storage: ${details.storage_name}`} size="small" color="secondary" variant="outlined" />
            )}
            {details.owner && (
              <Chip label={`Owner: ${details.owner}`} size="small" variant="filled" sx={{ bgcolor: "action.selected" }} />
            )}
          </Stack>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 400, display: "flex", flexDirection: "column" }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Typography color="error" align="center" sx={{ py: 3 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && details && (
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Attached Servers & Mounts
            </Typography>

            <Paper sx={{ height: 340, width: "100%", overflow: "hidden" }}>
              <DataGrid
                columnHeaderHeight={70}
                rows={filteredServers}
                columns={columns}
                getRowId={(row) => row.id || `${row.server_name}-${row.mount_path}`}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{
                  bgcolor: "background.paper",
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "background.paper" },
                }}
              />
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExportVolumeDetailsExcel}
          disabled={loading || exporting || !filteredServers.length}
          sx={actionButtonSx}
        >
          {exporting ? "Exporting..." : "Export Excel"}
        </Button>
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

VolumeDetailsModal.propTypes = {
  volumeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
