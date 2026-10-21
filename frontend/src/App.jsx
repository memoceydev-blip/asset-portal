import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import axios from "axios";
import { api } from "./api";
import { NAV_ITEMS } from "./config/constants";

import SummaryPage from "./pages/SummaryPage";
import AssetsPage from "./pages/AssetsPage";
import VolumesPage from "./pages/VolumesPage";
import SoftwaresPage from "./pages/SoftwaresPage";
import ImpersonationPage from "./pages/ImpersonationPage";
import ArchivedPage from "./pages/ArchivedPage";
import AdminPage from "./pages/AdminPage";

import AssetDetailsModal from "./components/AssetDetailsModal";
import VolumeDetailsModal from "./components/VolumeDetailsModal";

export default function App({ mode, onToggleColorMode }) {
  const [currentView, setCurrentView] = useState("summary");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedVolumeId, setSelectedVolumeId] = useState(null);

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

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => allowedPages.includes(item.key));
  }, [allowedPages]);

  const handleViewChange = (targetView) => {
    setSelectedAssetId(null);
    setSelectedVolumeId(null);
    setCurrentView(targetView);
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
            {currentView === "volumes" && "Storage Volumes"}
            {currentView === "softwares" && "Softwares Inventory"}
            {currentView === "impersonation" && "Impersonation View"}
            {currentView === "archived" && "Archived Assets"}
            {currentView === "admin" && "User Administration"}
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
              <SummaryPage />
            )}
            {currentView === "assets" && allowedPages.includes("assets") && (
              <AssetsPage onSelectAsset={(id) => setSelectedAssetId(id)} />
            )}
            {currentView === "volumes" && allowedPages.includes("volumes") && (
              <VolumesPage onSelectVolume={(id) => setSelectedVolumeId(id)} />
            )}
            {currentView === "softwares" && allowedPages.includes("softwares") && (
              <SoftwaresPage onSelectAsset={(id) => setSelectedAssetId(id)} />
            )}
            {currentView === "impersonation" && allowedPages.includes("impersonation") && (
              <ImpersonationPage onSelectAsset={(id) => setSelectedAssetId(id)} />
            )}
            {currentView === "archived" && allowedPages.includes("archived") && (
              <ArchivedPage onSelectAsset={(id) => setSelectedAssetId(id)} />
            )}
            {currentView === "admin" && allowedPages.includes("admin") && (
              <AdminPage />
            )}
          </>
        )}
      </Container>

      <AssetDetailsModal
        assetId={selectedAssetId}
        open={Boolean(selectedAssetId)}
        onClose={() => setSelectedAssetId(null)}
      />

      <VolumeDetailsModal
        volumeId={selectedVolumeId}
        open={Boolean(selectedVolumeId)}
        onClose={() => setSelectedVolumeId(null)}
      />
    </Box>
  );
}

App.propTypes = {
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggleColorMode: PropTypes.func.isRequired,
};
