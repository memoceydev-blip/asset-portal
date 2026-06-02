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
import { DataGrid } from "@mui/x-data-grid";
import { api } from "./api";

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
  value: PropTypes.string,
};

function AssetDetailsModal({ assetId, open, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [softwareFilter, setSoftwareFilter] = useState("");

  useEffect(() => {
    if (!open || !assetId) {
      setDetails(null);
      setSoftwareFilter("");
      return;
    }

    const loadDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/v1/assets/${assetId}`);
        setDetails(response.data);
        setSoftwareFilter("");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [assetId, open]);

  const filteredSoftware = useMemo(() => {
    if (!details?.software) {
      return [];
    }

    const pattern = softwareFilter.trim().toLowerCase();
    if (!pattern) {
      return details.software;
    }

    return details.software.filter((item) => {
      const name = item.sw_name?.toLowerCase() || "";
      const version = item.sw_version?.toLowerCase() || "";
      return name.includes(pattern) || version.includes(pattern);
    });
  }, [details, softwareFilter]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Asset Details {assetId ? `#${assetId}` : ""}</DialogTitle>
      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {!loading && details && (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Aliases
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {details.aliases.length ? (
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
                    <ListItem key={`${item.sw_name || "software"}-${index}`} divider>
                      <ListItemText
                        primary={`${item.sw_name || "-"} ${item.sw_version ? `(${item.sw_version})` : ""}`.trim()}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  {details.software.length
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
                {details.neighbour_ports.length ? (
                  details.neighbour_ports.map((item, index) => (
                    <Chip
                      key={`${item.network_device || "device"}-${item.local_port || "local"}-${item.neighbour_port || index}`}
                      label={`${item.network_device || "Unknown device"} · ${item.local_port || "?"} → ${item.neighbour_port || "?"}`}
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
                {details.ip_addresses.length ? (
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
  assetId: PropTypes.number,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default function App({ mode, onToggleColorMode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [selectedAssetId, setSelectedAssetId] = useState(null);

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

        setRows(response.data.items);
        setRowCount(response.data.total);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paginationModel, sortModel, search]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Asset Master
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
        <Paper sx={{ p: 2, mb: 2, maxWidth: 420 }}>
          <TextField
            fullWidth
            label="Search"
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
            onRowClick={(params) => setSelectedAssetId(params.row.id)}
            sx={{
              bgcolor: "background.paper",
              cursor: "pointer",
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: "background.paper",
              },
            }}
          />
        </Paper>
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
