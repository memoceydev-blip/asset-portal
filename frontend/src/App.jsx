import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
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
import { DataGrid } from "@mui/x-data-grid";
import { PieChart } from "@mui/x-charts/PieChart";
import axios from "axios";
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

  useEffect(() => {
    if (!open || !assetId) {
      setDetails(null);
      setError(null);
      setSoftwareFilter("");
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
        setSoftwareFilter("");
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

  // Generate fancy styling properties for the power state subtitle badge
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
        {/* Left Side: Title and Subtitle Power State Section directly underneath */}
        <Stack spacing={0.5}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
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

        {/* Right Side: Identity Bubble Rows */}
        {!loading && details && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {details.name && <Chip label={`Name: ${details.name}`} size="small" color="primary" variant="outlined" />}
            {details.tag && <Chip label={`Tag: ${details.tag}`} size="small" color="secondary" variant="outlined" />}
            {details.owner && <Chip label={`Owner: ${details.owner}`} size="small" variant="filled" sx={{ bgcolor: "action.selected" }} />}
            {details?.extra_info?.ilo && (
              <Chip label={`iLO: ${details.extra_info.ilo}`} size="small" color="info" variant="outlined" />
            )}
          </Stack>
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Typography color="error" align="center" sx={{ py: 3 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && details && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Aliases
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {details.aliases?.length ? (
                  details.aliases.map((alias) => <Chip key={alias} label={alias} variant="outlined" />)
                ) : (
                  <Typography color="text.secondary">No aliases available.</Typography>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Operating System
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} useFlexGap flexWrap="wrap">
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="Kernel" value={details.kernel} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="OS Name" value={details.os_name} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="OS Family" value={details.os_family} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="Architecture" value={details.os_arch} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="Code Name" value={details.code_name} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="CPE Name" value={details.cpe_name} />
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Hardware
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

            <Divider />

            <Box>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="h6">Software</Typography>
                <TextField
                  size="small"
                  label="Filter software"
                  value={softwareFilter}
                  onChange={(e) => setSoftwareFilter(e.target.value)}
                  sx={{ minWidth: { xs: "100%", sm: 260 } }}
                />
              </Stack>
              {filteredSoftware.length ? (
                <List dense sx={{ maxHeight: 240, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                  {filteredSoftware.map((item, index) => (
                    <ListItem key={`${item?.sw_name || "software"}-${index}`} divider>
                      <ListItemText
                        primary={`${item?.sw_name || "-"} ${item?.sw_version ? `(${item.sw_version})` : ""}`.trim()}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  {details.software?.length ? "No software matches the current filter." : "No software information available."}
                </Typography>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
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
                  <Typography color="text.secondary">No network neighbour information available.</Typography>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                IP Addresses
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {details.ip_addresses?.length ? (
                  details.ip_addresses.map((ip) => <Chip key={ip} label={ip} variant="outlined" />)
                ) : (
                  <Typography color="text.secondary">No IP addresses available.</Typography>
                )}
              </Stack>
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

// ==========================================
// COMPONENT: Main App Layout & View Router
// ==========================================
export default function App({ mode, onToggleColorMode }) {
  const [currentView, setCurrentView] = useState("summary");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);

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
  const [assetPaginationModel, setAssetPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [assetSortModel, setAssetSortModel] = useState([{ field: "id", sort: "asc" }]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedAssetSearch(assetSearch), 400);
    return () => clearTimeout(delayHandler);
  }, [assetSearch]);

  // Appending Power State right next to Status with an explicit inline layout dot renderer
  const assetColumns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.6 },
      { field: "name", headerName: "Name", flex: 1.2 },
      { field: "tag", headerName: "Tag", flex: 1 },
      { field: "type", headerName: "Type", flex: 1 },
      { field: "owner", headerName: "Owner", flex: 1.1 },
      { field: "location", headerName: "Location", flex: 1.1 },
      { field: "os", headerName: "OS", flex: 1.1 },
      { field: "status", headerName: "Status", flex: 0.9 },
      { 
        field: "power_state", 
        headerName: "Power State", 
        flex: 1.1,
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
      { field: "ips", headerName: "IPs", flex: 1.3 },
      { field: "alias", headerName: "Alias", flex: 1.2 },
    ],
    []
  );

  useEffect(() => {
    if (currentView !== "assets") return;

    const controller = new AbortController();
    const loadAssets = async () => {
      setAssetLoading(true);
      try {
        const sortBy = assetSortModel[0]?.field || "id";
        const sortDir = assetSortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/assets", {
          signal: controller.signal,
          params: {
            page: assetPaginationModel.page + 1,
            page_size: assetPaginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: debouncedAssetSearch || undefined,
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
  }, [assetPaginationModel, assetSortModel, debouncedAssetSearch, currentView]);

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
      { field: "asset", headerName: "Asset", flex: 1 },
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
              <ListItemButton selected={currentView === "summary"} onClick={() => setCurrentView("summary")}>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Summary" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentView === "assets"} onClick={() => setCurrentView("assets")}>
                <ListItemIcon><ComputerIcon /></ListItemIcon>
                <ListItemText primary="Assets" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentView === "softwares"} onClick={() => setCurrentView("softwares")}>
                <ListItemIcon><SettingsApplicationsIcon /></ListItemIcon>
                <ListItemText primary="Softwares" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Container */}
      <Container maxWidth={false} sx={{ py: 3 }}>
        
        {/* VIEW 0: DASHBOARD SUMMARY PANEL */}
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
        
        {/* VIEW 1: ASSETS */}
        {currentView === "assets" && (
          <>
            <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
              <TextField
                fullWidth
                label="Search Assets"
                value={assetSearch}
                onChange={(e) => {
                  setAssetPaginationModel((prev) => ({ ...prev, page: 0 }));
                  setAssetSearch(e.target.value);
                }}
              />
            </Paper>

            <Paper sx={{ height: 700, width: "100%", overflow: "hidden" }}>
              <DataGrid
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

        {/* VIEW 2: SOFTWARES */}
        {currentView === "softwares" && (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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

      {/* Shared Asset Details Modal */}
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
