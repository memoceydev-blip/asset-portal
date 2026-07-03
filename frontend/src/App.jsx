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
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "./api";

const DRAWER_WIDTH = 240;

function DetailRow({ label, value }) {
  return (
    <Box sx={{ py: 1, display: "flex", justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary" align="right">
        {value || "-"}
      </Typography>
    </Box>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

function AssetDetailsModal({ assetRecord, open, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && assetRecord?.id) {
      setLoading(true);
      setActiveTab(0); // Reset tab on open
      api.assets
        .getDetails(assetRecord.id)
        .then((data) => setDetails(data))
        .catch((err) => console.error("Failed to load asset details:", err))
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [open, assetRecord]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Asset Details #{assetRecord?.id || ""}
      </DialogTitle>
      <DialogContent dividers>
        {loading && <LinearProgress sx={{ my: 2 }} />}
        
        {details && (
          <Stack spacing={3}>
            {/* Top Overview Section */}
            <Paper variant="outlined" sx={{ p: 2, bg: "background.neutral" }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Overview
              </Typography>
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                <DetailRow label="Host Name" value={details.hostname} />
                <DetailRow label="Serial Number" value={details.serial_number} />
                <DetailRow label="Model" value={details.model} />
                <DetailRow label="Vendor" value={details.vendor} />
                <DetailRow label="State" value={details.state} />
                <DetailRow label="ILO Address" value={details.ilo} />
              </Box>
            </Paper>

            {/* Aliases Metadata */}
            {details.aliases && details.aliases.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Aliases
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {details.aliases.map((alias, idx) => (
                    <Chip key={idx} label={alias} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />

            {/* Tab Navigation System */}
            <Box sx={{ width: '100%' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="asset details tabs"
                textColor="primary"
                indicatorColor="primary"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Machine" />
                <Tab label="SW" />
                <Tab label="Network" />
                <Tab label="Users" />
              </Tabs>

              {/* Tab 0: Machine Panel (OS, HW) */}
              {activeTab === 0 && (
                <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                      Operating System
                    </Typography>
                    <DetailRow label="OS Name" value={details.extra_info?.os_name} />
                    <DetailRow label="OS Version" value={details.extra_info?.os_version} />
                    <DetailRow label="Kernel" value={details.extra_info?.kernel} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                      Hardware Metadata
                    </Typography>
                    <DetailRow label="CPU Model" value={details.extra_info?.cpu_model} />
                    <DetailRow label="CPU Cores" value={details.extra_info?.cpu_cores?.toString()} />
                    <DetailRow label="RAM Size" value={details.extra_info?.ram_size} />
                  </Box>
                </Box>
              )}

              {/* Tab 1: SW (Software details) */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                    Installed Software Packages
                  </Typography>
                  {details.extra_info?.packages && details.extra_info.packages.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Version</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {details.extra_info.packages.map((pkg, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{pkg.name}</TableCell>
                              <TableCell>{pkg.version}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No software packages found.</Typography>
                  )}
                </Box>
              )}

              {/* Tab 2: Network Panel (IP Addresses, Neighbours) */}
              {activeTab === 2 && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                      IP Addresses
                    </Typography>
                    {details.extra_info?.ip_addresses && details.extra_info.ip_addresses.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {details.extra_info.ip_addresses.map((ip, idx) => (
                          <Chip key={idx} label={ip} size="small" color="info" variant="soft" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No IP addresses recorded.</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                      Network Neighbours
                    </Typography>
                    {details.extra_info?.neighbours && details.extra_info.neighbours.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {details.extra_info.neighbours.map((nb, idx) => (
                          <Chip key={idx} label={nb} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No network neighbours configured.</Typography>
                    )}
                  </Box>
                </Stack>
              )}

              {/* Tab 3: Users Panel (Crowd reduction implementation) */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: "bold" }}>
                    User Connection Info
                  </Typography>
                  {details.users_info && details.users_info.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Last Login</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {details.users_info.map((user, idx) => (
                            <TableRow key={idx}>
                              <TableCell style={{ fontWeight: 500 }}>{user.Username}</TableCell>
                              <TableCell>{user["last login"] || "Never"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No interactive user logins tracked.</Typography>
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
  assetRecord: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function AssetManager() {
  const [themeMode, setThemeMode] = useState("light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Fetch standard core listing information
  useEffect(() => {
    setLoading(true);
    api.assets
      .list()
      .then((data) => setAssets(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    if (!globalSearch) return assets;
    const cleanSearch = globalSearch.toLowerCase();
    return assets.filter(
      (row) =>
        row.hostname?.toLowerCase().includes(cleanSearch) ||
        row.serial_number?.toLowerCase().includes(cleanSearch) ||
        row.vendor?.toLowerCase().includes(cleanSearch)
    );
  }, [assets, globalSearch]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "hostname", headerName: "Hostname", width: 180 },
      { field: "serial_number", headerName: "Serial Number", width: 180 },
      { field: "vendor", headerName: "Vendor", width: 130 },
      { field: "model", headerName: "Model", width: 150 },
      { field: "state", headerName: "Status", width: 120 },
      {
        field: "power_state",
        headerName: "Power State",
        width: 140,
        renderCell: (params) => {
          const val = params.value || "unknown";
          let color = "default";
          if (val === "powered on") color = "success";
          if (val === "powered off") color = "error";
          return (
            <Chip 
              label={val} 
              size="small" 
              color={color} 
              variant="flat" 
              sx={{ textTransform: "capitalize" }} 
            />
          );
        },
      },
    ],
    []
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Asset Portal Inventory
          </Typography>
          <IconButton color="inherit" onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}>
            {themeMode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", p: 1 }}>
          <List>
            <ListItemButton selected>
              <ListItemText primary="All Infrastructure" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        <Toolbar />
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight="bold">
                Assets Matrix
              </Typography>
              <TextField
                size="small"
                placeholder="Global Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                sx={{ width: 300 }}
              />
            </Box>

            <Paper sx={{ height: 600, width: "100%" }} variant="outlined">
              <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                onRowClick={(params) => setSelectedAsset(params.row)}
                sx={{ border: 0 }}
              />
            </Paper>
          </Stack>
        </Container>
      </Box>

      <AssetDetailsModal
        assetRecord={selectedAsset}
        open={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
      />
    </Box>
  );
}
