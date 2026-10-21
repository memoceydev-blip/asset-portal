import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Box, Paper, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { api } from "../api";

export default function VolumesPage({ allowedPages }) {
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
    if (currentView !== "volumes" || !allowedPages.includes("volumes")) return;

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
  }, [volumePaginationModel, volumeSortModel, debouncedVolumeSearch, debouncedVolumeColumnFilters, currentView, allowedPages]);

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
}

VolumesPage.propTypes = {
  allowedPages: PropTypes.arrayOf(PropTypes.string).isRequired,
};
