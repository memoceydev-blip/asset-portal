import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import axios from "axios";
import { api } from "../api";

export default function AdminPage() {
  const [targetType, setTargetType] = useState("user");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [assignedRoleIds, setAssignedRoleIds] = useState([]);
  const [targetFilter, setTargetFilter] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await api.get("/api/v1/security/roles", { signal: controller.signal });
        setRoles(response.data?.items || response.data?.roles || []);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error loading security roles:", err);
      } finally {
        if (!controller.signal.aborted) {
          setRolesLoading(false);
        }
      }
    };

    fetchRoles();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTargets = async () => {
      setLoading(true);
      setError(null);
      setSelectedTarget(null);
      setAssignedRoleIds([]);
      setTargetFilter("");
      try {
        const endpoint = targetType === "user" ? "/api/v1/security/users" : "/api/v1/security/groups";
        const response = await api.get(endpoint, { signal: controller.signal });
        if (targetType === "user") {
          setUsers(response.data?.items || response.data || []);
        } else {
          setGroups(response.data?.items || response.data || []);
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error(`Error loading ${targetType}s:`, err);
        setError(`Failed to fetch ${targetType}s list.`);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTargets();
    return () => controller.abort();
  }, [targetType]);

  useEffect(() => {
    if (!selectedTarget) return;

    const controller = new AbortController();
    const fetchAssignedRoles = async () => {
      setActionLoading(true);
      try {
        const endpoint = targetType === "user" 
          ? `/api/v1/security/users/${selectedTarget.id}/roles` 
          : `/api/v1/security/groups/${selectedTarget.id}/roles`;
        const response = await api.get(endpoint, { signal: controller.signal });
        const assigned = response.data?.items || response.data?.roles || response.data || [];
        setAssignedRoleIds(assigned.map((r) => r.id));
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error fetching assigned roles:", err);
      } finally {
        if (!controller.signal.aborted) {
          setActionLoading(false);
        }
      }
    };

    fetchAssignedRoles();
    return () => controller.abort();
  }, [selectedTarget, targetType]);

  const handleRoleToggle = async (roleId, isAssigned) => {
    if (!selectedTarget) return;
    setActionLoading(true);

    try {
      const endpoint = targetType === "user"
        ? `/api/v1/security/users/${selectedTarget.id}/roles/${roleId}`
        : `/api/v1/security/groups/${selectedTarget.id}/roles/${roleId}`;

      if (isAssigned) {
        await api.delete(endpoint);
        setAssignedRoleIds((prev) => prev.filter((id) => id !== roleId));
      } else {
        await api.post(endpoint);
        setAssignedRoleIds((prev) => [...prev, roleId]);
      }
    } catch (err) {
      console.error("Error updating role assignment:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const targetList = useMemo(() => {
    const rawList = targetType === "user" ? users : groups;
    const query = targetFilter.trim().toLowerCase();
    if (!query) return rawList;

    return rawList.filter((item) => {
      const name = (item.name || item.username || item.label || "").toLowerCase();
      const subLabel = (item.email || item.description || "").toLowerCase();
      const idStr = String(item.id || "");
      return name.includes(query) || subLabel.includes(query) || idStr.includes(query);
    });
  }, [targetType, users, groups, targetFilter]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          User & Permission Administration
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={targetType}
          exclusive
          onChange={(_, val) => val && setTargetType(val)}
        >
          <ToggleButton value="user">Users</ToggleButton>
          <ToggleButton value="group">Groups</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: 600, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
              Select {targetType === "user" ? "User" : "Group"}
            </Typography>

            <TextField
              size="small"
              placeholder={`Filter ${targetType === "user" ? "users" : "groups"}...`}
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              sx={{ mb: 2 }}
            />

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Typography color="error" variant="body2">{error}</Typography>}

            {!loading && !error && (
              <List dense sx={{ flex: 1, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                {targetList.length > 0 ? (
                  targetList.map((item) => {
                    const isSelected = selectedTarget?.id === item.id;
                    const label = item.name || item.username || item.label || `ID: ${item.id}`;
                    const subLabel = item.email || item.description || "";

                    return (
                      <ListItem key={item.id} disablePadding divider>
                        <ListItemButton 
                          selected={isSelected} 
                          onClick={() => setSelectedTarget(item)}
                        >
                          <ListItemText 
                            primary={label} 
                            secondary={subLabel || undefined} 
                            primaryTypographyProps={{ fontWeight: isSelected ? 700 : 400 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })
                ) : (
                  <Typography color="text.secondary" variant="body2" align="center" sx={{ p: 2 }}>
                    No {targetType}s match filter.
                  </Typography>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: 600, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Assigned Roles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedTarget 
                ? `Managing roles for ${targetType}: ${selectedTarget.name || selectedTarget.username || selectedTarget.id}`
                : `Select a ${targetType} on the left to assign or revoke permissions.`}
            </Typography>

            {actionLoading && <LinearProgress sx={{ mb: 2 }} />}

            {!selectedTarget ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No selection made.</Typography>
              </Box>
            ) : rolesLoading ? (
              <LinearProgress />
            ) : (
              <List sx={{ flex: 1, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
                {roles.map((role) => {
                  const isAssigned = assignedRoleIds.includes(role.id);
                  return (
                    <ListItem key={role.id} divider>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isAssigned}
                            disabled={actionLoading}
                            onChange={() => handleRoleToggle(role.id, isAssigned)}
                          />
                        }
                        label={
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {role.name || role.label}
                            </Typography>
                            {role.description && (
                              <Typography variant="caption" color="text.secondary">
                                {role.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ width: "100%", m: 0 }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
