import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
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
import axios from "axios";
import { api } from "../api";
import DetailRow from "./DetailRow";
import { getPowerStateConfig } from "../utils/helpers";

export default function AssetDetailsModal({ assetId, open, onClose }) {
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

                  {/* Registered Users Table */}
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
                <Stack spacing={3}>
                  {/* Section 1: Info Agents Status */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Info Agents Status
                    </Typography>
                    {details.agents?.length ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, overflow: "auto" }}>
                        <Table size="small" stickyHeader aria-label="Info agents status list">
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

                  {/* Section 2: Monitoring Status */}
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
  );
}

AssetDetailsModal.propTypes = {
  assetId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};