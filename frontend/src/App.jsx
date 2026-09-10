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
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ComputerIcon from "@mui/icons-material/Computer";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
import { DataGrid } from "@mui/x-data-grid";
import { PieChart } from "@mui/x-charts/PieChart";
import axios from "axios";
import * as XLSX from "xlsx";
import { api } from "./api";

// ==========================================
// NAVIGATION CONFIGURATION
// ==========================================
const NAV_ITEMS = [
  { key: "summary", label: "Summary", icon: <DashboardIcon /> },
  { key: "assets", label: "Assets", icon: <ComputerIcon /> },
  { key: "softwares", label: "Softwares", icon: <SettingsApplicationsIcon /> },
  { key: "archived", label: "Archived", icon: <InventoryIcon /> },
];

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
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
              {details.name && <Chip label={`Name: ${details.name}`} size="small" color="primary" variant="outlined" />}
              {details.tag && <Chip label={`Tag: ${details.tag}`} size="small" color="secondary" variant="outlined" />}
              {details.owner && <Chip label={`Owner: ${details.owner}`} size="small" variant="filled" sx={{ bgcolor: "action.selected" }} />}
            </Stack>

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
                <Tab label="Agent Status" />
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

              {/* TAB 3: AGENT STATUS PANEL */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Monitored Agents
                  </Typography>
                  {details.agents?.length ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320, overflow: "auto" }}>
                      <Table size="small" stickyHeader aria-label="Agent status list">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Agent Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Agent Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Last Update</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {details.agents.map((agent, index) => (
                            <TableRow key={`${agent.agent_name || "agent"}-${index}`} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{agent.agent_name || "-"}</TableCell>
                              <TableCell>{agent.agent_status || "-"}</TableCell>
                              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                                {agent.agent_last || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      No agent status information available.
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

// Common Action Button Styling Configuration
const actionButtonSx = {
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

  // ------------------------------------------
  // PERMISSIONS / SECURITY STATE & EFFECTS
  // ------------------------------------------
  const [allowedPages, setAllowedPages] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPermissions = async () => {
      setPermissionsLoading(true);
      setPermissionsError(null);
      try {
        const response = await api.get("/api/v1/security/permissions", {
          signal: controller.signal,
        });
        const pages = response.data?.pages || [];
        setAllowedPages(pages);

        // Redirect to first allowed page if the current default view is prohibited
        if (pages.length > 0 && !pages.includes(currentView)) {
          setCurrentView(pages[0]);
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error fetching permissions:", err);
        setPermissionsError("Failed to load user permissions.");
      } finally {
        if (!controller.signal.aborted) {
          setPermissionsLoading(false);
        }
      }
    };

    fetchPermissions();
    return () => controller.abort();
  }, []);

  // Filter navigation items based on backend permissions
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => allowedPages.includes(item.key));
  }, [allowedPages]);

  const handleViewChange = (targetView) => {
    setSelectedAssetId(null);
    setCurrentView(targetView);
  };

  // ------------------------------------------
  // SUMMARY / STATS STATE & EFFECTS
  // ------------------------------------------
  // 1. OS Stats
  const [osRawItems, setOsRawItems] = useState([]);
  const [osChartData, setOsChartData] = useState([]);
  const [osLoading, setOsLoading] = useState(false);
  const [osError, setOsError] = useState(null);

  // 2. Vendor Stats
  const [vendorRawItems, setVendorRawItems] = useState([]);
  const [vendorChartData, setVendorChartData] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState(null);

  // 3. Product Stats
  const [productRawItems, setProductRawItems] = useState([]);
  const [productChartData, setProductChartData] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  // 4. Asset Types Stats
  const [assetTypeRawItems, setAssetTypeRawItems] = useState([]);
  const [assetTypeChartData, setAssetTypeChartData] = useState([]);
  const [assetTypeLoading, setAssetTypeLoading] = useState(false);
  const [assetTypeError, setAssetTypeError] = useState(null);

  // 5. VM Location Stats
  const [vmGroup, setVmGroup] = useState("vcenter");
  const [vmLocationRawItems, setVmLocationRawItems] = useState([]);
  const [vmLocationChartData, setVmLocationChartData] = useState([]);
  const [vmLocationLoading, setVmLocationLoading] = useState(false);
  const [vmLocationError, setVmLocationError] = useState(null);

  // 6. Bare Metal (BM) Location Stats
  const [bmGroup, setBmGroup] = useState("pod");
  const [bmLocationRawItems, setBmLocationRawItems] = useState([]);
  const [bmLocationChartData, setBmLocationChartData] = useState([]);
  const [bmLocationLoading, setBmLocationLoading] = useState(false);
  const [bmLocationError, setBmLocationError] = useState(null);

  useEffect(() => {
    if (currentView !== "summary" || !allowedPages.includes("summary")) return;

    const controller = new AbortController();

    const fetchStat = async (url, setRaw, setChart, setLoading, setError, defaultLabel, extraParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(url, { signal: controller.signal, params: extraParams });
        const items = response.data?.items || [];
        setRaw(items);
        
        const formattedChart = items.map((item, index) => ({
          id: index,
          value: item.count,
          label: item.name || defaultLabel,
        }));
        setChart(formattedChart);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error(`Error loading stat metrics from ${url}:`, err);
        setError("Failed to load metrics summary.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStat("/api/v1/stats/os", setOsRawItems, setOsChartData, setOsLoading, setOsError, "Unknown OS");
    fetchStat("/api/v1/stats/vendor", setVendorRawItems, setVendorChartData, setVendorLoading, setVendorError, "Unknown Vendor");
    fetchStat("/api/v1/stats/product", setProductRawItems, setProductChartData, setProductLoading, setProductError, "Unknown Product");
    fetchStat("/api/v1/stats/asset_types", setAssetTypeRawItems, setAssetTypeChartData, setAssetTypeLoading, setAssetTypeError, "Unknown Asset Type");
    fetchStat("/api/v1/stats/locations", setVmLocationRawItems, setVmLocationChartData, setVmLocationLoading, setVmLocationError, "Unknown Location", {
      asset_type: "vm",
      group_by: vmGroup,
    });
    fetchStat("/api/v1/stats/locations", setBmLocationRawItems, setBmLocationChartData, setBmLocationLoading, setBmLocationError, "Unknown Location", {
      asset_type: "bm",
      group_by: bmGroup,
    });

    return () => controller.abort();
  }, [currentView, vmGroup, bmGroup, allowedPages]);

  // ------------------------------------------
  // ASSETS VIEW STATE & EFFECTS
  // ------------------------------------------
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
      { field: "ips", headerName: "IPs", flex: 1.3, renderHeader: createHeaderWithFilter("ips", "IPs", assetColumnFilters, handleColumnFilterChange) },
      { field: "alias", headerName: "Alias", flex: 1.2, renderHeader: createHeaderWithFilter("alias", "Alias", assetColumnFilters, handleColumnFilterChange) },
    ],
    [assetColumnFilters]
  );

  useEffect(() => {
    if (currentView !== "assets" || !allowedPages.includes("assets")) return;

    const controller = new AbortController();
    const loadAssets = async () => {
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
  }, [assetPaginationModel, assetSortModel, debouncedAssetSearch, debouncedAssetColumnFilters, currentView, allowedPages]);

  const handleExportAssetsExcel = async () => {
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

      const response = await api.get("/api/v1/assets", {
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
      XLSX.writeFile(workbook, "assets_full_export.xlsx");
    } catch (error) {
      console.error("Error fetching full assets set for export:", error);
    } finally {
      setAssetExporting(false);
    }
  };

  const hasActiveAssetFilters = useMemo(() => {
    if (assetSearch.trim() !== "") return true;
    return Object.values(assetColumnFilters).some((val) => val && val.trim() !== "");
  }, [assetSearch, assetColumnFilters]);

  // ------------------------------------------
  // ARCHIVED VIEW STATE & EFFECTS
  // ------------------------------------------
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
    if (currentView !== "archived" || !allowedPages.includes("archived")) return;

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
  }, [archivedPaginationModel, archivedSortModel, debouncedArchivedSearch, debouncedArchivedColumnFilters, currentView, allowedPages]);

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

  // ------------------------------------------
  // SOFTWARES VIEW STATE & EFFECTS
  // ------------------------------------------
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
    if (currentView !== "softwares" || !allowedPages.includes("softwares")) return;

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
  }, [softwarePaginationModel, softwareSortModel, debouncedSwFilters, currentView, allowedPages]);

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

  // Helper render for Summary Card Items
  const renderStatCard = (title, subtitle, tableHeader, loading, error, chartData, rawItems, headerAction = null) => (
    <Card sx={{ bgcolor: "background.paper", p: 1, height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          </Box>
          {headerAction}
        </Stack>

        {loading && (
          <Box sx={{ width: "100%", py: 6 }}>
            <LinearProgress />
          </Box>
        )}

        {error && !loading && (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && chartData.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No telemetry records found.
          </Typography>
        )}

        {!loading && !error && chartData.length > 0 && (
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5} sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 280, height: 240 }}>
                <PieChart
                  series={[
                    {
                      data: chartData,
                      innerRadius: 40,
                      outerRadius: 90,
                      paddingAngle: 3,
                      cornerRadius: 5,
                      highlightScope: { faded: "blurred", highlighted: "onSeries" },
                    },
                  ]}
                  height={230}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280, overflow: "auto" }}>
                <Table stickyHeader size="small" aria-label={`${title} counts table`}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>{tableHeader}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "action.hover", width: 100 }}>
                        Count
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rawItems.map((row, index) => (
                      <TableRow key={`${row.name || "item"}-${index}`} hover>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                          {row.name || "Unknown"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                          {row.count?.toLocaleString() || 0}
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
  );

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
            {currentView === "archived" && "Archived Assets"}
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

          {permissionsLoading && <LinearProgress />}

          {permissionsError && (
            <Typography color="error" variant="caption" align="center" sx={{ display: "block", p: 2 }}>
              {permissionsError}
            </Typography>
          )}

          {!permissionsLoading && !permissionsError && (
            <List>
              {visibleNavItems.length > 0 ? (
                visibleNavItems.map((item) => (
                  <ListItem key={item.key} disablePadding>
                    <ListItemButton selected={currentView === item.key} onClick={() => handleViewChange(item.key)}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <Typography color="text.secondary" variant="body2" align="center" sx={{ p: 2 }}>
                  No pages permitted.
                </Typography>
              )}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Main Container */}
      <Container maxWidth={false} sx={{ py: 3 }}>
        {permissionsLoading ? (
          <Box sx={{ width: "100%", py: 6 }}>
            <LinearProgress />
          </Box>
        ) : permissionsError ? (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {permissionsError}
          </Typography>
        ) : (
          <>
            {currentView === "summary" && allowedPages.includes("summary") && (
              <Grid container spacing={3}>
                {/* ROW 1 - Card 1: Operating Systems */}
                <Grid item xs={12} md={6}>
                  {renderStatCard(
                    "Operating Systems Distribution",
                    "Breakdown of operating system distribution metrics across infrastructure.",
                    "Operating System",
                    osLoading,
                    osError,
                    osChartData,
                    osRawItems
                  )}
                </Grid>

                {/* ROW 1 - Card 2: Server Manufacturer / Vendor */}
                <Grid item xs={12} md={6}>
                  {renderStatCard(
                    "Vendor / Manufacturer Breakdown",
                    "Hardware manufacturer distribution across server nodes.",
                    "Vendor / Manufacturer",
                    vendorLoading,
                    vendorError,
                    vendorChartData,
                    vendorRawItems
                  )}
                </Grid>

                {/* ROW 2 - Card 3: Server Product Model */}
                <Grid item xs={12} md={6}>
                  {renderStatCard(
                    "Product Model Breakdown",
                    "Distribution across deployed hardware product lines.",
                    "Product Model",
                    productLoading,
                    productError,
                    productChartData,
                    productRawItems
                  )}
                </Grid>

                {/* ROW 2 - Card 4: Asset Types */}
                <Grid item xs={12} md={6}>
                  {renderStatCard(
                    "Asset Types Breakdown",
                    "Distribution across registered asset classification types.",
                    "Asset Type",
                    assetTypeLoading,
                    assetTypeError,
                    assetTypeChartData,
                    assetTypeRawItems
                  )}
                </Grid>

                {/* ROW 3 - Card 5: VM Locations */}
                <Grid item xs={12} md={6}>
                  {renderStatCard(
                    "VM Location Distribution",
                    `Virtual machine counts grouped by ${vmGroup === "vcenter" ? "vCenter Server" : "Cluster"}.`,
                    vmGroup === "vcenter" ? "vCenter" : "Cluster",
                    vmLocationLoading,
                    vmLocationError,
                    vmLocationChartData,
                    vmLocationRawItems,
                    <ToggleButtonGroup
                      size="small"
                      value={vmGroup}
                      exclusive
                      onChange={(_, val) => val && setVmGroup(val)}
                      aria-label="Group VM Location By"
                    >
                      <ToggleButton value="vcenter">vCenter</ToggleButton>
                      <ToggleButton value="cluster">Cluster</ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </Grid>

                {/* ROW 3 - Card 6: Bare Metal (BM) Locations */}
                <Grid item xs={12} md={6}>
                  {renderStatCard(
                    "Bare Metal Location Distribution",
                    `Bare metal counts grouped by ${bmGroup === "pod" ? "Pod" : bmGroup === "cabinet" ? "Cabinet" : "Site"}.`,
                    bmGroup === "pod" ? "Pod" : bmGroup === "cabinet" ? "Cabinet" : "Site",
                    bmLocationLoading,
                    bmLocationError,
                    bmLocationChartData,
                    bmLocationRawItems,
                    <ToggleButtonGroup
                      size="small"
                      value={bmGroup}
                      exclusive
                      onChange={(_, val) => val && setBmGroup(val)}
                      aria-label="Group Bare Metal Location By"
                    >
                      <ToggleButton value="pod">Pod</ToggleButton>
                      <ToggleButton value="cabinet">Cabinet</ToggleButton>
                      <ToggleButton value="site">Site</ToggleButton>
                    </ToggleButtonGroup>
                  )}
                </Grid>
              </Grid>
            )}
            
            {currentView === "assets" && allowedPages.includes("assets") && (
              <>
                <Paper sx={{ p: 2, mb: 2, maxWidth: 780, display: "flex", gap: 2, alignItems: "center" }}>
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
                    disabled={assetExporting || assetRowCount === 0}
                    sx={actionButtonSx}
                  >
                    {assetExporting ? "Exporting..." : "Export Excel"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<FilterAltOffOutlinedIcon />}
                    onClick={handleClearAssetFilters}
                    disabled={!hasActiveAssetFilters}
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

            {currentView === "archived" && allowedPages.includes("archived") && (
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

            {currentView === "softwares" && allowedPages.includes("softwares") && (
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
