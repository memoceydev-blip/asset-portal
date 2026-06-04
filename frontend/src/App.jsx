import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Alert,
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
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "./api";

const DRAWER_WIDTH = 240;

function normalizeAssetDetails(data) {
  return {
    asset_id: data?.asset_id ?? null,
    alias: data?.alias ?? "",
    kernel: data?.kernel ?? "",
    os_name: data?.os_name ?? "",
    os_family: data?.os_family ?? "",
    os_arch: data?.os_arch ?? "",
    code_name: data?.code_name ?? "",
    cn_name: data?.cn_name ?? "",
    vendor: data?.vendor ?? "",
    product_name: data?.product_name ?? "",
    software: Array.isArray(data?.software) ? data.software : [],
    neighbour_ports: Array.isArray(data?.neighbour_ports) ? data.neighbour_ports : [],
    ip_addresses: Array.isArray(data?.ip_addresses) ? data.ip_addresses : [],
  };
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary">
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

function AssetDetailsModal({ assetRecord, open, onClose }) {
  const [details, setDetails] = useState(normalizeAssetDetails());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !assetRecord?.id) {
      setDetails(normalizeAssetDetails());
      setError("");
      return;
    }

    const loadDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/api/v1/assets/${assetRecord.id}`);
        setDetails(normalizeAssetDetails(response.data));
      } catch (loadError) {
        setDetails(normalizeAssetDetails());
        setError(loadError?.response?.data?.detail || "Failed to load asset details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [assetRecord, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack spacing={1.5}>
          <Typography variant="h6">
            Asset Details {assetRecord?.id ? `#${assetRecord.id}` : ""}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {assetRecord?.name ? <Chip label={`Name: ${assetRecord.name}`} color="primary" /> : null}
            {assetRecord?.tag ? <Chip label={`Tag: ${assetRecord.tag}`} variant="outlined" /> : null}
            {assetRecord?.owner ? <Chip label={`Owner: ${assetRecord.owner}`} variant="outlined" /> : null}
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        {!loading && !error && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Hostname
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="Name" value={assetRecord?.name} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="Tag" value={assetRecord?.tag} />
                </Box>
                <Box sx={{ minWidth: 180, flex: 1 }}>
                  <DetailRow label="Alias" value={details.alias} />
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Ownership
              </Typography>
              <DetailRow label="Owner" value={assetRecord?.owner} />
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
                  <DetailRow label="Common Name" value={details.cn_name} />
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
              <Typography variant="h6" gutterBottom>
                Software
              </Typography>
              {details.software.length ? (
                <List dense sx={{ maxHeight: 240, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                  {details.software.map((item, index) => (
                    <ListItem key={`${item?.sw_name || "software"}-${index}`} divider>
                      <ListItemText
                        primary={item?.sw_name || "-"}
                        secondary={item?.sw_version || "Version unknown"}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No software information available.</Typography>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Network Neighbour Ports
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {details.neighbour_ports.length ? (
                  details.neighbour_ports.map((port, index) => (
                    <Chip key={`${port || "port"}-${index}`} label={port || "-"} variant="outlined" />
                  ))
                ) : (
                  <Typography color="text.secondary">No neighbour ports available.</Typography>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                IP Addresses
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {details.ip_addresses.length ? (
                  details.ip_addresses.map((ip, index) => (
                    <Chip key={`${ip || "ip"}-${index}`} label={ip || "-"} variant="outlined" />
                  ))
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
  assetRecord: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    tag: PropTypes.string,
    owner: PropTypes.string,
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function AssetsPage({ onSelectAsset }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });
  const [sortModel, setSortModel] = useState([{ field: "id", sort: "asc" }]);
  const [search, setSearch] = useState("");

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.6 },
      { field: "name", headerName: "Name", flex: 1.2 },
      { field: "tag", headerName: "Tag", flex: 1 },
      { field: "type", headerName: "Type", flex: 1 },
      { field: "owner", headerName: "Owner", flex: 1.2 },
      { field: "location", headerName: "Location", flex: 1.2 },
      { field: "os", headerName: "OS", flex: 1.1 },
      { field: "status", headerName: "Status", flex: 0.9 },
      { field: "ips", headerName: "IPs", flex: 1.3 },
      { field: "alias", headerName: "Alias", flex: 1.1 },
    ],
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sortBy = sortModel[0]?.field || "id";
        const sortDir = sortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/assets", {
          params: {
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: search || undefined,
          },
        });

        setRows(Array.isArray(response.data?.items) ? response.data.items : []);
        setRowCount(Number(response.data?.total) || 0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paginationModel, sortModel, search]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
        <TextField
          fullWidth
          label="Search assets"
          value={search}
          onChange={(e) => {
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
            setSearch(e.target.value);
          }}
        />
      </Paper>

      <Paper sx={{ height: 700, width: "100%", overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          pagination
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(params) => onSelectAsset(params.row)}
          sx={{
            bgcolor: "background.paper",
            cursor: "pointer",
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: "background.paper",
            },
          }}
        />
      </Paper>
    </>
  );
}

AssetsPage.propTypes = {
  onSelectAsset: PropTypes.func.isRequired,
};

function SoftwaresPage({ onSelectAsset }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const columns = useMemo(
    () => [
      { field: "asset_id", headerName: "Asset ID", flex: 0.7 },
      { field: "sw_name", headerName: "Software", flex: 1.4 },
      { field: "sw_version", headerName: "Version", flex: 1.1 },
      { field: "os_name", headerName: "OS Name", flex: 1.2 },
    ],
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/v1/software", {
          params: {
            search: search || undefined,
          },
        });

        const items = Array.isArray(response.data?.items)
          ? response.data.items
          : Array.isArray(response.data)
            ? response.data
            : [];

        setRows(
          items.map((item, index) => ({
            id: `${item?.asset_id || "asset"}-${item?.sw_name || index}`,
            ...item,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
        <TextField
          fullWidth
          label="Search softwares"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Paper>

      <Paper sx={{ height: 700, width: "100%", overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          onRowClick={async (params) => {
            try {
              const response = await api.get(`/api/v1/assets/${params.row.asset_id}/summary`);
              onSelectAsset(response.data);
            } catch {
              onSelectAsset({ id: params.row.asset_id, name: "", tag: "", owner: "" });
            }
          }}
          sx={{
            bgcolor: "background.paper",
            cursor: "pointer",
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: "background.paper",
            },
          }}
        />
      </Paper>
    </>
  );
}

SoftwaresPage.propTypes = {
  onSelectAsset: PropTypes.func.isRequired,
};

export default function App({ mode, onToggleColorMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("assets");
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setMobileOpen(false);
  };

  const navigation = (
    <Box sx={{ width: DRAWER_WIDTH }} role="presentation">
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Navigation
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button selected={currentPage === "assets"} onClick={() => handleNavigate("assets")}>
          <ListItemText primary="Assets" />
        </ListItem>
        <ListItem button selected={currentPage === "softwares"} onClick={() => handleNavigate("softwares")}>
          <ListItemText primary="Softwares" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
      }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          '& .MuiDrawer-paper': { boxSizing: "border-box", width: DRAWER_WIDTH },
        }}
      >
        {navigation}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          '& .MuiDrawer-paper': {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
            position: "relative",
          },
        }}
        open
      >
        {navigation}
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="sticky"
          color="default"
          elevation={1}
          sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
              aria-label="open navigation"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              {currentPage === "assets" ? "Assets" : "Softwares"}
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

        <Container maxWidth={false} sx={{ py: 3 }}>
          {currentPage === "assets" ? (
            <AssetsPage onSelectAsset={setSelectedAsset} />
          ) : (
            <SoftwaresPage onSelectAsset={setSelectedAsset} />
          )}
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

App.propTypes = {
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggleColorMode: PropTypes.func.isRequired,
};
