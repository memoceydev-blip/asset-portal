import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import { initAuth } from "./auth";

const STORAGE_KEY = "asset-portal-theme-mode";

function getPreferredMode() {
  const savedMode = window.localStorage.getItem(STORAGE_KEY);
  if (savedMode === "light" || savedMode === "dark") {
    return savedMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function Root() {
  const [mode, setMode] = React.useState(getPreferredMode);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                background: {
                  default: "#0f172a",
                  paper: "#111827",
                },
              }
            : {
                background: {
                  default: "#f8fafc",
                  paper: "#ffffff",
                },
              }),
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiDataGrid: {
            styleOverrides: {
              root: {
                border: 0,
              },
            },
          },
        },
      }),
    [mode]
  );

  const toggleColorMode = () => {
    setMode((currentMode) => (currentMode === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App mode={mode} onToggleColorMode={toggleColorMode} />
    </ThemeProvider>
  );
}

async function bootstrap() {
  await initAuth();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}

bootstrap();
