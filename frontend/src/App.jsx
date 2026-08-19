import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ComputerIcon from "@mui/icons-material/Computer";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { DataGrid } from "@mui/x-data-grid";
import { PieChart } from "@mui/x-charts/PieChart";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "./api";

// ==========================================
// HELPER: Power State Visual Configuration
// ==========================================
const getPowerStateConfig = (state) => {
  const normalized = state?.toLowerCase() || "";
  if (normalized.includes("on")) {
    return { color: "success", label: "Powered On" };
  }
  if (normalized.includes("off")) {
    return { color: "error", label: "Powered Off" };
  }
  return { color: "default", label: "Unknown" };
};

// ==========================================
// COMPONENT: Detail Row (Helper)
// ==========================================
function DetailRow({ label, value }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1">{value || "-"}</Typography>
    </Box>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// ==========================================
// COMPONENT: Asset Details Modal
// ==========================================
function AssetDetailsModal({ assetId, open, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [softwareFilter, setSoftwareFilter] = useState("");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!open || !assetId) {
      setDetails(null);
      setError(null);
      setSoftwareFilter("");
      setTabValue(0);
      return;
    }

    const controller = new AbortController();

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/assets/${assetId}`, {
          signal: controller.signal,
        });
        setDetails(response.data);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error fetching asset details profile:", err);
        setError("Failed to load asset details. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDetails();
    return () => controller.abort();
  }, [assetId, open]);

  const filteredSoftware = useMemo(() => {
    if (!details?.software) return [];
    const pattern = softwareFilter.trim().toLowerCase();
    if (!pattern) return details.software;

    return details.software.filter((item) => {
      const name = item?.sw_name?.toLowerCase() || "";
      const version = item?.sw_version?.toLowerCase() || "";
      return name.includes(pattern) || version.includes(pattern);
    });
  }, [details, softwareFilter]);

  const powerConfig = useMemo(() => {
    return getPowerStateConfig(details?.power_state);
  }, [details?.power_state]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle 
        sx={{ 
          display: "flex", 
          alignItems: "flex-start", 
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Asset Details {assetId ? `#${assetId}` : ""}
          </Typography>
          
          {!loading && details && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
              <PowerSettingsNewIcon 
                color={powerConfig.color === "default" ? "disabled" : powerConfig.color} 
                sx={{ fontSize: "1rem" }} 
              />
              <Typography 
                variant="caption" 
                color={powerConfig.color === "default" ? "text.secondary" : `${powerConfig.color}.main`}
                sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                {powerConfig.label}
              </Typography>
            </Box>
          )}
        </Stack>

        {!loading && details && (
          <Stack spacing={1} alignItems="flex-end">
            {/* First Row of Bubbles */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
              {details.name && <Chip label={`Name: ${details.name}`} size="small" color="primary" variant="outlined" />}
              {details.tag && <Chip label={`Tag: ${details.tag}`} size="small" color="secondary" variant="outlined" />}
              {details.owner && <Chip label={`Owner: ${details.owner}`} size="small" variant="filled" sx={{ bgcolor: "action.selected" }} />}
            </Stack>

            {/* Second Row of Bubbles */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
              {details.location && (
                <Chip label={`Location: ${details.location}`} size="small" color="default" variant="outlined" />
              )}
              {details?.ilo && (
                <Chip 
                  label={`iLO: ${details.ilo}`} 
                  size="small" 
                  color="info" 
                  variant="outlined" 
                  component="a" 
                  href={`https://${details.ilo}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  clickable 
                />
              )}
            </Stack>
          </Stack>
        )}
      </DialogTitle>
      
      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", minHeight: 480 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Typography color="error" align="center" sx={{ py: 3 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && details && (
          <Stack spacing={3} sx={{ flex: 1 }}>
            {/* Base Header Section: Aliases always visible */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Aliases
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {details.aliases?.length ? (
                  details.aliases.map((alias) => <Chip key={alias} label={alias} variant="outlined" />)
                ) : (
                  <Typography color="text.secondary" variant="body2">No aliases available.</Typography>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Reorganized Tab Layout */}
            <Box sx={{ width: "100%" }}>
              <Tabs 
                value={tabValue} 
                onChange={(_, newValue) => setTabValue(newValue)} 
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
              >
                <Tab label="Machine" />
                <Tab label="Network" />
                <Tab label="Softwares" />
              </Tabs>

              {/* TAB 0: MACHINE PANELS */}
              {tabValue === 0 && (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Operating System
                    </Typography>
                    <Grid container spacing={2}>
                      {["Kernel", "OS Name", "OS Family", "Architecture", "Code Name", "CPE Name"].map((field) => {
                        const mappedKey = field.toLowerCase().replace(" ", "_");
                        return (
                          <Grid item xs={12} sm={6} md={4} key={field}>
                            <DetailRow label={field} value={details[mappedKey]} />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>

                  <Divider variant="dashed" />

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Hardware Vendor Profile
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                      <Box sx={{ minWidth: 180, flex: 1 }}>
                        <DetailRow label="Vendor" value={details.vendor} />
                      </Box>
                      <Box sx={{ minWidth: 180, flex: 1 }}>
                        <DetailRow label="Product Name" value={details.product_name} />
                      </Box>
                    </Stack>
                  </Box>

                  <Divider variant="dashed" />

                  {/* Added Section: User Access Metrics */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Registered Users
                    </Typography>
                    {details.user_info?.length ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Username</TableCell>
                              <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Last Login Timestamp</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {details.user_info.map((user, idx) => (
                              <TableRow key={`${user.username || "user"}-${idx}`} hover>
                                <TableCell sx={{ fontFamily: "monospace" }}>{user.username || "-"}</TableCell>
                                <TableCell>
                                  {user.last_login ? (
                                    user.last_login
                                  ) : (
                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                                      Never logged in / Null record
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary" variant="body2">No registered active workspace user logs metadata found.</Typography>
                    )}
                  </Box>
                </Stack>
              )}

              {/* TAB 1: NETWORK PANELS */}
              {tabValue === 1 && (
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Network Neighbours
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {details.neighbour_ports?.length ? (
                        details.neighbour_ports.map((item, index) => (
                          <Chip
                            key={`${item?.network_device || "device"}-${item?.local_port || "local"}-${item?.neighbour_port || index}`}
                            label={`${item?.network_device || "Unknown device"} · ${item?.local_port || "?"} → ${item?.neighbour_port || "?"}`}
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography color="text.secondary" variant="body2">No network neighbour discovery records available.</Typography>
                      )}
                    </Stack>
                  </Box>

                  <Divider variant="dashed" />

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      IP Addresses
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {details.ip_addresses?.length ? (
                        details.ip_addresses.map((ip) => <Chip key={ip} label={ip} variant="outlined" />)
                      ) : (
                        <Typography color="text.secondary" variant="body2">No active IP assignments bind profiles.</Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              )}

              {/* TAB 2: SOFTWARES PANEL */}
              {tabValue === 2 && (
                <Box>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Software Dependencies</Typography>
                    <TextField
                      size="small"
                      label="Filter software list"
                      value={softwareFilter}
                      onChange={(e) => setSoftwareFilter(e.target.value)}
                      sx={{ minWidth: { xs: "100%", sm: 260 } }}
                    />
                  </Stack>
                  {filteredSoftware.length ? (
                    <List dense sx={{ maxHeight: 300, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                      {filteredSoftware.map((item, index) => {
                        const uniqueSwKey = item?.sw_name && item?.sw_version 
                          ? `${item.sw_name}-${item.sw_version}` 
                          : `sw-${index}`;
                        return (
                          <ListItem key={uniqueSwKey} divider>
                            <ListItemText
                              primary={`${item?.sw_name || "-"} ${item?.sw_version ? `(${item.sw_version})` : ""}`.trim()}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      {details.software?.length ? "No software matching filters found." : "No explicit packages monitored."}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

AssetDetailsModal.propTypes = {
  assetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// Common Fancy Export Button Styling Configuration
const exportButtonSx = {
  borderRadius: 2,
  px: 2.5,
  py: 0.8,
  fontWeight: 600,
  letterSpacing: "0.2px",
  textTransform: "none",
  whiteSpace: "nowrap",
  borderColor: "action.disabledBackground",
  color: "text.primary",
  bgcolor: "action.hover",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    bgcolor: "primary.main",
    color: "primary.contrastText",
    borderColor: "primary.main",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transform: "translateY(-1px)",
  },
};

// ==========================================
// COMPONENT: Main App Layout & View Router
// ==========================================
export default function App({ mode, onToggleColorMode }) {
  const [currentView, setCurrentView] = useState("summary");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  const handleViewChange = (targetView) => {
    setSelectedAssetId(null);
    setCurrentView(targetView);
  };

  // ------------------------------------------
  // SUMMARY / STATS STATE & EFFECTS
  // ------------------------------------------
  const [osRawItems, setOsRawItems] = useState([]);
  const [osChartData, setOsChartData] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    if (currentView !== "summary") return;

    const controller = new AbortController();
    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const response = await api.get("/api/v1/stats/os");
        const items = response.data?.items || [];
        
        setOsRawItems(items);
        
        const formattedChartData = items.map((item, index) => ({
          id: index,
          value: item.count,
          label: item.name || "Unknown OS",
        }));
        setOsChartData(formattedChartData);
      } catch (error) {
        if (axios.isCancel(error) || error.name === "CanceledError") return;
        console.error("Error loading OS distribution statistics:", error);
        setStatsError("Failed to load metrics summaries.");
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      }
    };

    loadStats();
    return () => controller.abort();
  }, [currentView]);

  // ------------------------------------------
  // ASSETS VIEW STATE & EFFECTS
  // ------------------------------------------
  const [assetRows, setAssetRows] = useState([]);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetRowCount, setAssetRowCount] = useState(0);
  const [assetSearch, setAssetSearch] = useState("");
  const [debouncedAssetSearch, setDebouncedAssetSearch] = useState("");
  const [assetColumnFilters, setAssetColumnFilters] = useState({});
  const [debouncedAssetColumnFilters, setDebouncedAssetColumnFilters] = useState({});
  const [assetPaginationModel, setAssetPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [assetSortModel, setAssetSortModel] = useState([{ field: "id", sort: "asc" }]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedAssetSearch(assetSearch), 400);
    return () => clearTimeout(delayHandler);
  }, [assetSearch]);

  // Debounce individual column filters
  useEffect(() => {
    const delayHandler = setTimeout(() => {
      setDebouncedAssetColumnFilters(assetColumnFilters);
    }, 400);
    return () => clearTimeout(delayHandler);
  }, [assetColumnFilters]);

  const handleColumnFilterChange = (field, value) => {
    setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
    setAssetColumnFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const createHeaderWithFilter = (label, field) => {
    return () => (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.5, py: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {label}
        </Typography>
        <TextField
          size="small"
          placeholder="Filter..."
          variant="outlined"
          value={assetColumnFilters[field] || ""}
          onClick={(e) => e.stopPropagation()} // Stop column sorting click from firing when typing
          onChange={(e) => handleColumnFilterChange(field, e.target.value)}
          inputProps={{
            style: { padding: "2px 6px", fontSize: "0.75rem" },
          }}
          sx={{ bgcolor: "background.paper" }}
        />
      </Box>
    );
  };

  const assetColumns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.8, renderHeader: createHeaderWithFilter("ID", "id") },
      { field: "name", headerName: "Name", flex: 1.2, renderHeader: createHeaderWithFilter("Name", "name") },
      { field: "tag", headerName: "Tag", flex: 1, renderHeader: createHeaderWithFilter("Tag", "tag") },
      { field: "type", headerName: "Type", flex: 1, renderHeader: createHeaderWithFilter("Type", "type") },
      { field: "owner", headerName: "Owner", flex: 1.1, renderHeader: createHeaderWithFilter("Owner", "owner") },
      { field: "location", headerName: "Location", flex: 1.1, renderHeader: createHeaderWithFilter("Location", "location") },
      { field: "os", headerName: "OS", flex: 1.1, renderHeader: createHeaderWithFilter("OS", "os") },
      { field: "status", headerName: "Status", flex: 0.9, renderHeader: createHeaderWithFilter("Status", "status") },
      { 
        field: "power_state", 
        headerName: "Power State", 
        flex: 1.1,
        renderHeader: createHeaderWithFilter("Power State", "power_state"),
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
      { field: "ips", headerName: "IPs", flex: 1.3, renderHeader: createHeaderWithFilter("IPs", "ips") },
      { field: "alias", headerName: "Alias", flex: 1.2, renderHeader: createHeaderWithFilter("Alias", "alias") },
    ],
    [assetColumnFilters]
  );

  useEffect(() => {
    if (currentView !== "assets") return;

    const controller = new AbortController();
    const loadAssets = async () => {
      setAssetLoading(true);
      try {
        const sortBy = assetSortModel[0]?.field || "id";
        const sortDir = assetSortModel[0]?.sort || "asc";

        // Map column filters into params object formatted with `{field}_filter`
        const filterParams = {};
        Object.entries(debouncedAssetColumnFilters).forEach(([field, val]) => {
          if (val && val.trim() !== "") {
            filterParams[`${field}_filter`] = val.trim();
          }
        });

        const response = await api.get("/api/v1/assets", {
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
        console.error("Error loading master assets list:", error);
      } finally {
        if (!controller.signal.aborted) {
          setAssetLoading(false);
        }
      }
    };

    loadAssets();
    return () => controller.abort();
  }, [assetPaginationModel, assetSortModel, debouncedAssetSearch, debouncedAssetColumnFilters, currentView]);

  // Export current assets view set to Excel
  const handleExportAssetsExcel = () => {
    if (!assetRows || assetRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(assetRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    XLSX.writeFile(workbook, "assets_export.xlsx");
  };

  // ------------------------------------------
  // SOFTWARES VIEW STATE & EFFECTS
  // ------------------------------------------
  const [softwareRows, setSoftwareRows] = useState([]);
  const [softwareLoading, setSoftwareLoading] = useState(false);
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
    if (currentView !== "softwares") return;

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
  }, [softwarePaginationModel, softwareSortModel, debouncedSwFilters, currentView]);

  // Export current software view set to Excel
  const handleExportSoftwaresExcel = () => {
    if (!softwareRows || softwareRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(softwareRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Softwares");
    XLSX.writeFile(workbook, "softwares_export.xlsx");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      {/* Top App Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} aria-label="open navigation menu">
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {currentView === "summary" && "Infrastructure Metrics"}
            {currentView === "assets" && "Asset Master"}
            {currentView === "softwares" && "Softwares Inventory"}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {mode === "dark" ? "Dark mode" : "Light mode"}
          </Typography>
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton color="inherit" onClick={onToggleColorMode} aria-label="toggle color mode">
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer Menu */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: 600 }}>
            Navigation
          </Typography>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton selected={currentView === "summary"} onClick={() => handleViewChange("summary")}>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Summary" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentView === "assets"} onClick={() => handleViewChange("assets")}>
                <ListItemIcon><ComputerIcon /></ListItemIcon>
                <ListItemText primary="Assets" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentView === "softwares"} onClick={() => handleViewChange("softwares")}>
                <ListItemIcon><SettingsApplicationsIcon /></ListItemIcon>
                <ListItemText primary="Softwares" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Container */}
      <Container maxWidth={false} sx={{ py: 3 }}>
        
        {currentView === "summary" && (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={10}>
              <Card sx={{ bgcolor: "background.paper", p: 1 }}>
                <CardContent>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                    Operating Systems Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Live telemetry representation breakdown mapping infrastructure platform ratios.
                  </Typography>

                  {statsLoading && (
                    <Box sx={{ width: "100%", py: 6 }}>
                      <LinearProgress />
                    </Box>
                  )}

                  {statsError && !statsLoading && (
                    <Typography color="error" align="center" sx={{ py: 4 }}>
                      {statsError}
                    </Typography>
                  )}

                  {!statsLoading && !statsError && osChartData.length === 0 && (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                      No operating system metrics available.
                    </Typography>
                  )}

                  {!statsLoading && !statsError && osChartData.length > 0 && (
                    <Grid container spacing={4} alignItems="center">
                      <Grid item xs={12} md={5} sx={{ display: "flex", justifyContent: "center" }}>
                        <Box sx={{ width: "100%", maxWidth: 300, height: 260 }}>
                          <PieChart
                            series={[
                              {
                                data: osChartData,
                                innerRadius: 50,
                                outerRadius: 100,
                                paddingAngle: 3,
                                cornerRadius: 5,
                                highlightScope: { faded: 'blurred', highlighted: 'onSeries' },
                              },
                            ]}
                            height={250}
                            slotProps={{
                              legend: { hidden: true }
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={7}>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, overflow: "auto" }}>
                          <Table stickyHeader size="small" aria-label="Operating Systems inventory counts">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Operating System</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "action.hover", width: 120 }}>Count</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {osRawItems.map((row, index) => (
                                <TableRow key={`${row.name || "os"}-${index}`} hover>
                                  <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                    {row.name || "Unknown Operating System"}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.95rem" }}>
                                    {row.count.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {currentView === "assets" && (
          <>
            <Paper sx={{ p: 2, mb: 2, maxWidth: 580, display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                fullWidth
                size="small"
                label="Search Assets"
                value={assetSearch}
                onChange={(e) => {
                  setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
                  setAssetSearch(e.target.value);
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleExportAssetsExcel}
                disabled={!assetRows || assetRows.length === 0}
                sx={exportButtonSx}
              >
                Export Excel
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
                onRowClick={(params) => setSelectedAssetId(params.row.id)}
                sx={{
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  '& .MuiDataGrid-columnHeaders': { bgcolor: "background.paper" },
                }}
              />
            </Paper>
          </>
        )}

        {currentView === "softwares" && (
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
                  disabled={!softwareRows || softwareRows.length === 0}
                  sx={exportButtonSx}
                >
                  Export Excel
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
                onRowClick={(params) => setSelectedAssetId(params.row.asset)}
                sx={{
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  '& .MuiDataGrid-columnHeaders': { bgcolor: "background.paper" },
                }}
              />
            </Paper>
          </>
        )}
      </Container>

      <AssetDetailsModal
        assetId={selectedAssetId}
        open={Boolean(selectedAssetId)}
        onClose={() => setSelectedAssetId(null)}
      />
    </Box>
  );
}

App.propTypes = {
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggleColorMode: PropTypes.func.isRequired,
};
