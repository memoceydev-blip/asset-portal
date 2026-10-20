export const getPowerStateConfig = (state) => {
  const normalized = state?.toLowerCase() || "";
  if (normalized.includes("on")) {
    return { color: "success", label: "Powered On" };
  }
  if (normalized.includes("off")) {
    return { color: "error", label: "Powered Off" };
  }
  return { color: "default", label: "Unknown" };
};

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