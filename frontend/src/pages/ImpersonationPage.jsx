import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { api } from "../api";

export default function ImpersonationPage({ allowedPages }) {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!allowedPages.includes("impersonation")) return;

    const controller = new AbortController();
    const fetchOwners = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/api/v1/assets/owners", {
          signal: controller.signal,
        });
        const items = response.data?.items || response.data || [];
        setOwners(items);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error loading owners for impersonation:", err);
        setError("Failed to load owners dropdown list.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOwners();
    return () => controller.abort();
  }, [allowedPages]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Impersonation Control
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select an asset owner below to view context, impersonate, or inspect assigned node resources.
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Autocomplete
          options={owners}
          getOptionLabel={(option) => option.owner_name || `Owner #${option.owner_id}`}
          value={selectedOwner}
          onChange={(_, newValue) => setSelectedOwner(newValue)}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Owner to Impersonate"
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 4 }}
        />

        {selectedOwner && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Active Target: {selectedOwner.owner_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Owner ID: {selectedOwner.owner_id}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
}

ImpersonationPage.propTypes = {
  allowedPages: PropTypes.arrayOf(PropTypes.string).isRequired,
};
