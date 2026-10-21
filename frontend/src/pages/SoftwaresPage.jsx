import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Button, Paper, Stack, TextField } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "../api";
import { actionButtonSx } from "../config/constants";

export default function SoftwaresPage({ onSelectAsset }) {
  const [softwareRows, setSoftwareRows] = useState([]);
  const [softwareLoading, setSoftwareLoading] = useState(false);
  const [softwareExporting, setSoftwareExporting] = useState(false);
  const [softwareRowCount, setSoftwareRowCount] = useState(0);
  const [softwarePaginationModel, setSoftwarePaginationModel] = useState({ page: 0, pageSize: 50 });
  const [softwareSortModel, setSoftwareSortModel] = useState([{ field: "name", sort: "asc" }]);

  const [swSearchName, setSwSearchName] = useState("");
  const [swSearchVersion, setSwSearchVersion] = useState("");
  const [swSearchOS, setSwSearchOS] = useState("");
  const [swSearchOwner, setSwSearchOwner] = useState("");

  const [debouncedSwFilters, setDebouncedSwFilters] = useState({ name: "", version: "", os: "", owner: "" });

  useEffect(() => {
    const delayHandler = setTimeout(() => {
      setDebouncedSwFilters({
        name: swSearchName,
        version: swSearchVersion,
        os: swSearchOS,
        owner: swSearchOwner,
      });
    }, 400);
    return () => clearTimeout(delayHandler);
  }, [swSearchName, swSearchVersion, swSearchOS, swSearchOwner]);

  const softwareColumns = useMemo(
    () => [
      { field: "asset", headerName: "Asset ID", flex: 1 },
      { field: "name", headerName: "Name", flex: 1.5 },
      { field: "version", headerName: "Version", flex: 1 },
      { field: "os", headerName: "OS", flex: 1.2 },
      { field: "owner", headerName: "Owner", flex: 1.1 },
    ],
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadSoftwares = async () => {
      setSoftwareLoading(true);
      try {
        const sortBy = softwareSortModel[0]?.field || "name";
        const sortDir = softwareSortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/softwares", {
          signal: controller.signal,
          params: {
            page: softwarePaginationModel.page + 1,
            page_size: softwarePaginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            name: debouncedSwFilters.name || undefined,
            version: debouncedSwFilters.version || undefined,
            os: debouncedSwFilters.os || undefined,
            owner: debouncedSwFilters.owner || undefined,
          },
        });

        setSoftwareRows(response.data?.items || []);
        setSoftwareRowCount(response.data?.total || 0);
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError") return;
        console.error("Error loading master software profiles:", error);
      } finally {
        if (!controller.signal.aborted) {
          setSoftwareLoading(false);
        }
      }
    };

    loadSoftwares();
    return () => controller.abort();
  }, [softwarePaginationModel, softwareSortModel, debouncedSwFilters]);

  const handleExportSoftwaresExcel = async () => {
    setSoftwareExporting(true);
    try {
      const sortBy = softwareSortModel[0]?.field || "name";
      const sortDir = softwareSortModel[0]?.sort || "asc";

      const response = await api.get("/api/v1/softwares", {
        params: {
          page: 1,
          page_size: 100000,
          sort_by: sortBy,
          sort_dir: sortDir,
          name: debouncedSwFilters.name || undefined,
          version: debouncedSwFilters.version || undefined,
          os: debouncedSwFilters.os || undefined,
          owner: debouncedSwFilters.owner || undefined,
        },
      });

      const fullItems = response.data?.items || [];
      if (fullItems.length === 0) return;

      const worksheet = XLSX.utils.json_to_sheet(fullItems);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Softwares");
      XLSX.writeFile(workbook, "softwares_full_export.xlsx");
    } catch (error) {
      console.error("Error fetching full software set for export:", error);
    } finally {
      setSoftwareExporting(false);
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Search Name"
            value={swSearchName}
            onChange={(e) => {
              setSoftwarePaginationModel((prev) => ({ ...prev, page: 0 }));
              setSwSearchName(e.target.value);
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Search Version"
            value={swSearchVersion}
            onChange={(e) => {
              setSoftwarePaginationModel((prev) => ({ ...prev, page: 0 }));
              setSwSearchVersion(e.target.value);
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Search OS"
            value={swSearchOS}
            onChange={(e) => {
              setSoftwarePaginationModel((prev) => ({ ...prev, page: 0 }));
              setSwSearchOS(e.target.value);
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Search Owner"
            value={swSearchOwner}
            onChange={(e) => {
              setSoftwarePaginationModel((prev) => ({ ...prev, page: 0 }));
              setSwSearchOwner(e.target.value);
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExportSoftwaresExcel}
            disabled={softwareExporting || softwareRowCount === 0}
            sx={actionButtonSx}
          >
            {softwareExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ height: 700, width: "100%", overflow: "hidden" }}>
        <DataGrid
          rows={softwareRows}
          columns={softwareColumns}
          loading={softwareLoading}
          rowCount={softwareRowCount}
          pagination
          paginationMode="server"
          sortingMode="server"
          paginationModel={softwarePaginationModel}
          onPaginationModelChange={setSoftwarePaginationModel}
          sortModel={softwareSortModel}
          onSortModelChange={setSoftwareSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || `${row.asset}-${row.name}`}
          onRowClick={(params) => onSelectAsset(params.row.asset)}
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

SoftwaresPage.propTypes = {
  onSelectAsset: PropTypes.func.isRequired,
};
