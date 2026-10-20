import ComputerIcon from "@mui/icons-material/Computer";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageIcon from "@mui/icons-material/Storage";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export const NAV_ITEMS = [
  { key: "summary", label: "Summary", icon: <DashboardIcon /> },
  { key: "assets", label: "Assets", icon: <ComputerIcon /> },
  { key: "volumes", label: "Volumes", icon: <StorageIcon /> },
  { key: "softwares", label: "Softwares", icon: <SettingsApplicationsIcon /> },
  { key: "impersonation", label: "Impersonation", icon: <GroupIcon /> },
  { key: "archived", label: "Archived", icon: <InventoryIcon /> },
  { key: "admin", label: "Admin Users", icon: <AdminPanelSettingsIcon /> },
];