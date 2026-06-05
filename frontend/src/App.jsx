import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ComputerIcon from "@mui/icons-material/Computer";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "./api";

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

    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/assets/${assetId}`);
        setDetails(response.data);
        setSoftwareFilter("");
      } catch (err) {
        console.error("Error fetching asset details profile:", err);
        setError("Failed to load asset details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Asset Details {assetId ? `#${assetId}` : ""}</DialogTitle>
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
                  {details.software?.length
                    ? "No software matches the current filter."
                    : "No software information available."}
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
  // Navigation State
  const [currentView, setCurrentView] = useState("assets"); // "assets" or "softwares"
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Shared Modals State
  const [selectedAssetId, setSelectedAssetId] = useState(null);

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
      { field: "ips", headerName: "IPs", flex: 1.3 },
      { field: "alias", headerName: "Alias", flex: 1.2 },
    ],
    []
  );

  useEffect(() => {
    if (currentView !== "assets") return;

    const loadAssets = async () => {
      setAssetLoading(true);
      try {
        const sortBy = assetSortModel[0]?.field || "id";
        const sortDir = assetSortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/assets", {
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
        console.error("Error loading master assets list:", error);
      } finally {
        setAssetLoading(false);
      }
    };

    loadAssets();
  }, [assetPaginationModel, assetSortModel, debouncedAssetSearch, currentView]);

  // ------------------------------------------
  // SOFTWARES VIEW STATE & EFFECTS
  // ------------------------------------------
  const [softwareRows, setSoftwareRows] = useState([]);
  const [softwareLoading, setSoftwareLoading] = useState(false);
  const [softwareRowCount, setSoftwareRowCount] = useState(0);
  const [softwareSearch, setSoftwareSearch] = useState("");
  const [debouncedSoftwareSearch, setDebouncedSoftwareSearch] = useState("");
  const [softwarePaginationModel, setSoftwarePaginationModel] = useState({ page: 0, pageSize: 50 });
  const [softwareSortModel, setSoftwareSortModel] = useState([{ field: "name", sort: "asc" }]);

  useEffect(() => {
    const delayHandler = setTimeout(() => setDebouncedSoftwareSearch(softwareSearch), 400);
    return () => clearTimeout(delayHandler);
  }, [softwareSearch]);

  const softwareColumns = useMemo(
    () => [
      { field: "asset", headerName: "Asset", flex: 1 },
      { field: "name", headerName: "Name", flex: 1.5 },
      { field: "version", headerName: "Version", flex: 1 },
      { field: "os", headerName: "OS", flex: 1.2 },
    ],
    []
  );

  useEffect(() => {
    if (currentView !== "softwares") return;

    const loadSoftwares = async () => {
      setSoftwareLoading(true);
      try {
        const sortBy = softwareSortModel[0]?.field || "name";
        const sortDir = softwareSortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/softwares", {
          params: {
            page: softwarePaginationModel.page + 1,
            page_size: softwarePaginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: debouncedSoftwareSearch || undefined,
          },
        });

        // Mapping software items to have a safe ID required by DataGrid layout patterns
        const itemsWithIds = (response.data?.items || []).map((item, index) => ({
          id: item.id || `sw-${index}-${item.name}`,
          ...item,
        }));

        setSoftwareRows(itemsWithIds);
        setSoftwareRowCount(response.data?.total || 0);
      } catch (error) {
        console.error("Error loading master software profiles:", error);
      } finally {
        setSoftwareLoading(false);
      }
    };

    loadSoftwares();
  }, [softwarePaginationModel, softwareSortModel, debouncedSoftwareSearch, currentView]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      {/* Top App Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            aria-label="open navigation menu"
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {currentView === "assets" ? "Asset Master" : "Softwares Inventory"}
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

      {/* Navigation Modal / Drawer Component (Top-Left Stack) */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <Typography variant="h6" sx={{ p: 2, fontWeight: 600 }}>
            Navigation
          </Typography>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                selected={currentView === "assets"} 
                onClick={() => setCurrentView("assets")}
              >
                <ListItemIcon>
                  <ComputerIcon />
                </ListItemIcon>
                <ListItemText primary="Assets" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                selected={currentView === "softwares"} 
                onClick={() => setCurrentView("softwares")}
              >
                <ListItemIcon>
                  <SettingsApplicationsIcon />
                </ListItemIcon>
                <ListItemText primary="Softwares" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Primary Dashboard Content Panel Container */}
      <Container maxWidth={false} sx={{ py: 3 }}>
        
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
            <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
              <TextField
                fullWidth
                label="Search Softwares"
                value={softwareSearch}
                onChange={(e) => {
                  setSoftwarePaginationModel((prev) => ({ ...prev, page: 0 }));
                  setSoftwareSearch(e.target.value);
                }}
              />
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
                sx={{
                  bgcolor: "background.paper",
                  '& .MuiDataGrid-columnHeaders': { bgcolor: "background.paper" },
                }}
              />
            </Paper>
          </>
        )}
      </Container>

      {/* Asset Global Profile View Inspector Overlay */}
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
