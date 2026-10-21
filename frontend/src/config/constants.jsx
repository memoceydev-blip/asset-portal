import ComputerIcon from "@mui/icons-material/Computer";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorageIcon from "@mui/icons-material/Storage";
import GroupIcon from "@mui/icons-material/Group";

export const NAV_ITEMS = [
  { key: "summary", label: "Summary", icon: <DashboardIcon /> },
  { key: "assets", label: "Assets", icon: <ComputerIcon /> },
  { key: "volumes", label: "Volumes", icon: <StorageIcon /> },
  { key: "softwares", label: "Softwares", icon: <SettingsApplicationsIcon /> },
  { key: "impersonation", label: "Impersonation View", icon: <GroupIcon /> },
  { key: "archived", label: "Archived", icon: <InventoryIcon /> },
  { key: "admin", label: "Admin Users", icon: <AdminPanelSettingsIcon /> },
];

export const actionButtonSx = {
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
