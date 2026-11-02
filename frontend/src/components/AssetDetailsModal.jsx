import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
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
  Typography,
} from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import StorageIcon from "@mui/icons-material/Storage";
import axios from "axios";
import { api } from "../api";
import { getPowerStateConfig } from "../utils/helpers";

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

export default function AssetDetailsModal({ assetId, open, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use explicit string tab keys instead of numeric indexes
  const [tabValue, setTabValue] = useState("machine");
  const [selectedMount, setSelectedMount] = useState(null);

  // Lazy-loaded data states
  const [networksData, setNetworksData] = useState(null);
  const [networksLoading, setNetworksLoading] = useState(false);

  const [softwaresData, setSoftwaresData] = useState(null);
  const [softwaresLoading, setSoftwaresLoading] = useState(false);
  const [softwareFilter, setSoftwareFilter] = useState("");

  const [mountsData, setMountsData] = useState(null);
  const [mountsLoading, setMountsLoading] = useState(false);

  // Initial load: Fetch base asset details
  useEffect(() => {
    if (!open || !assetId) {
      setDetails(null);
      setError(null);
      setSoftwareFilter("");
      setTabValue("machine");
      setSelectedMount(null);
      setNetworksData(null);
      setSoftwaresData(null);
      setMountsData(null);
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

  const isStorage = useMemo(() => {
    return details?.type?.toLowerCase() === "storage";
  }, [details?.type]);

  // Ensure active tab falls back to "machine" if a hidden tab was selected for storage
  useEffect(() => {
    if (isStorage && (tabValue === "softwares" || tabValue === "mounts")) {
      setTabValue("machine");
    }
  }, [isStorage, tabValue]);

  // Lazy loading effect triggered when switching tabs (using stable dependency array)
  useEffect(() => {
    if (!open || !assetId) return;

    const controller = new AbortController();

    // Fetch Networks (/api/v1/assets/{id}/networks)
    if (tabValue === "network" && !networksData) {
      setNetworksLoading(true);
      api.get(`/api/v1/assets/${assetId}/networks`, { signal: controller.signal })
        .then((res) => setNetworksData(res.data))
        .catch((err) => {
          if (!axios.isCancel(err) && err.name !== "CanceledError") {
            console.error("Error loading networks data:", err);
          }
        })
        .finally(() => setNetworksLoading(false));
    }

    // Fetch Softwares (/api/v1/assets/{id}/softwares)
    if (tabValue === "softwares" && !softwaresData) {
      setSoftwaresLoading(true);
      api.get(`/api/v1/assets/${assetId}/softwares`, { signal: controller.signal })
        .then((res) => setSoftwaresData(res.data?.items || res.data || []))
        .catch((err) => {
          if (!axios.isCancel(err) && err.name !== "CanceledError") {
            console.error("Error loading softwares data:", err);
          }
        })
        .finally(() => setSoftwaresLoading(false));
    }

    // Fetch Mounts (/api/v1/assets/{id}/mounts)
    if (tabValue === "mounts" && !mountsData) {
      setMountsLoading(true);
      api.get(`/api/v1/assets/${assetId}/mounts`, { signal: controller.signal })
        .then((res) => setMountsData(res.data?.items || res.data || []))
        .catch((err) => {
          if (!axios.isCancel(err) && err.name !== "CanceledError") {
            console.error("Error loading mounts data:", err);
          }
        })
        .finally(() => setMountsLoading(false));
    }

    return () => controller.abort();
  }, [open, assetId, tabValue]);

  const filteredSoftware = useMemo(() => {
    const list = softwaresData || details?.software || [];
    const pattern = softwareFilter.trim().toLowerCase();
    if (!pattern) return list;

    return list.filter((item) => {
      const name = item?.sw_name?.toLowerCase() || "";
      const version = item?.sw_version?.toLowerCase() || "";
      return name.includes(pattern) || version.includes(pattern);
    });
  }, [softwaresData, details?.software, softwareFilter]);

  const powerConfig = useMemo(() => {
    return getPowerStateConfig(details?.power_state);
  }, [details?.power_state]);

  const neighbourPorts = networksData?.neighbour_ports || details?.neighbour_ports || [];
  const ipAddresses = networksData?.ip_addresses || details?.ip_addresses || [];
  const mountsList = mountsData || details?.mounts || [];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Stack spacing={0.5}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Asset Details {assetId ? `#${assetId}` : ""}
            </Typography>

            {!loading && details && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <PowerSettingsNewIcon color={powerConfig.color === "default" ? "disabled" : powerConfig.color} sx={{ fontSize: "1rem" }} />
                <Typography variant="caption" color={powerConfig.color === "default" ? "text.secondary" : `${powerConfig.color}.main`} sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                {details.location && <Chip label={`Location: ${details.location}`} size="small" color="default" variant="outlined" />}
                {details?.ilo && (
                  <Chip label={`iLO: ${details.ilo}`} size="small" color="info" variant="outlined" component="a" href={`https://${details.ilo}`} target="_blank" rel="noopener noreferrer" clickable />
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
                <Typography variant="h6" gutterBottom>Aliases</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {details.aliases?.length ? details.aliases.map((alias) => <Chip key={alias} label={alias} variant="outlined" />) : <Typography color="text.secondary" variant="body2">No aliases available.</Typography>}
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ width: "100%" }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                  <Tab value="machine" label="Machine" />
                  <Tab value="network" label="Network" />
                  {!isStorage && <Tab value="softwares" label="Softwares" />}
                  {!isStorage && <Tab value="mounts" label="Mounts" />}
                  <Tab value="agents" label="Agent Status" />
                </Tabs>

                {tabValue === "machine" && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Operating System</Typography>
                      <Grid container spacing={2}>
                        {["Kernel", "OS Name", "OS Family", "Architecture", "Code Name", "CPE Name"].map((field) => (
                          <Grid item xs={12} sm={6} md={4} key={field}>
                            <DetailRow label={field} value={details[field.toLowerCase().replace(" ", "_")]} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                    <Divider variant="dashed" />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Hardware Vendor Profile</Typography>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                        <Box sx={{ minWidth: 180, flex: 1 }}><DetailRow label="Vendor" value={details.vendor} /></Box>
                        <Box sx={{ minWidth: 180, flex: 1 }}><DetailRow label="Product Name" value={details.product_name} /></Box>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {tabValue === "network" && (
                  <Stack spacing={3}>
                    {networksLoading && <LinearProgress sx={{ mb: 2 }} />}
                    {!networksLoading && (
                      <>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Network Neighbours</Typography>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {neighbourPorts?.length ? neighbourPorts.map((item, index) => (
                              <Chip key={`${item?.network_device || "device"}-${index}`} label={`${item?.network_device || "Unknown"} · ${item?.local_port || "?"} → ${item?.neighbour_port || "?"}`} variant="outlined" />
                            )) : <Typography color="text.secondary" variant="body2">No network neighbour records available.</Typography>}
                          </Stack>
                        </Box>
                        <Divider variant="dashed" />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>IP Addresses</Typography>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {ipAddresses?.length ? ipAddresses.map((ip) => <Chip key={ip} label={ip} variant="outlined" />) : <Typography color="text.secondary" variant="body2">No active IP assignments.</Typography>}
                          </Stack>
                        </Box>
                      </>
                    )}
                  </Stack>
                )}

                {tabValue === "softwares" && !isStorage && (
                  <Box>
                    {softwaresLoading && <LinearProgress sx={{ mb: 2 }} />}
                    {!softwaresLoading && (
                      <>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Software Dependencies</Typography>
                          <TextField size="small" label="Filter software list" value={softwareFilter} onChange={(e) => setSoftwareFilter(e.target.value)} sx={{ minWidth: { xs: "100%", sm: 260 } }} />
                        </Stack>
                        {filteredSoftware.length ? (
                          <List dense sx={{ maxHeight: 300, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                            {filteredSoftware.map((item, index) => (
                              <ListItem key={item?.sw_name ? `${item.sw_name}-${index}` : index} divider>
                                <ListItemText primary={`${item?.sw_name || "-"} ${item?.sw_version ? `(${item.sw_version})` : ""}`.trim()} />
                              </ListItem>
                            ))}
                          </List>
                        ) : <Typography color="text.secondary" variant="body2">No software matching filters found.</Typography>}
                      </>
                    )}
                  </Box>
                )}

                {tabValue === "mounts" && !isStorage && (
                  <Box>
                    {mountsLoading && <LinearProgress sx={{ mb: 2 }} />}
                    {!mountsLoading && (
                      <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Storage Mount Points</Typography>
                        {mountsList?.length ? (
                          <List dense sx={{ maxHeight: 320, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                            {mountsList.map((mount, index) => (
                              <ListItem key={mount.id || index} disablePadding divider>
                                <ListItemButton onClick={() => setSelectedMount(mount)}>
                                  <ListItemIcon sx={{ minWidth: 36 }}><StorageIcon fontSize="small" color="primary" /></ListItemIcon>
                                  <ListItemText primary={mount.mount_source || "Unknown Source"} secondary={mount.mount_path ? `Mounted on ${mount.mount_path}` : undefined} />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        ) : <Typography color="text.secondary" variant="body2">No mount point details available.</Typography>}
                      </>
                    )}
                  </Box>
                )}

                {tabValue === "agents" && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Info Agent Status
                      </Typography>
                      {details.agents?.length ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, overflow: "auto" }}>
                          <Table size="small" stickyHeader aria-label="Info agent status list">
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

                    <Divider variant="dashed" />

                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Monitoring Status
                      </Typography>
                      {details.monitoring?.length ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, overflow: "auto" }}>
                          <Table size="small" stickyHeader aria-label="Monitoring status list">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Monitor Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Monitor Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>Monitor URL</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {details.monitoring.map((item, index) => (
                                <TableRow key={`${item.monitor_name || "monitor"}-${index}`} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>{item.monitor_name || "-"}</TableCell>
                                  <TableCell>{item.monitor_status || "-"}</TableCell>
                                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                                    {item.monitor_url ? (
                                      <Chip
                                        label={item.monitor_url}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        component="a"
                                        href={item.monitor_url.startsWith("http") ? item.monitor_url : `https://${item.monitor_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        clickable
                                      />
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          No monitoring status information available.
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedMount)} onClose={() => setSelectedMount(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
          <StorageIcon color="primary" /> Mount Point Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedMount && (
            <Stack spacing={2}>
              <DetailRow label="Source" value={selectedMount.mount_source} />
              <DetailRow label="Path" value={selectedMount.mount_path} />
              <DetailRow label="Type" value={selectedMount.mount_type} />
              <DetailRow label="Options" value={selectedMount.mount_opts} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMount(null)} variant="contained" size="small">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

AssetDetailsModal.propTypes = {
  assetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
