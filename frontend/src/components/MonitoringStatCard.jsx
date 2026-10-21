import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import axios from "axios";
import { api } from "../api";

export default function MonitoringStatCard() {
  const [monitors, setMonitors] = useState([]);
  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [monitorsLoading, setMonitorsLoading] = useState(false);

  const [rawItems, setRawItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMonitors = async () => {
      setMonitorsLoading(true);
      try {
        const response = await api.get("/api/v1/stats/monitors", {
          signal: controller.signal,
        });
        const items = response.data?.items || response.data || [];
        const parsed = items.map((item) => (typeof item === "object" ? item.name : item));
        setMonitors(parsed);
        if (parsed.length > 0) {
          setSelectedMonitor(parsed[0]);
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error loading monitors dropdown:", err);
      } finally {
        if (!controller.signal.aborted) {
          setMonitorsLoading(false);
        }
      }
    };

    fetchMonitors();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedMonitor) return;

    const controller = new AbortController();
    const fetchMonitoringStats = async () => {
      setStatsLoading(true);
      setError(null);
      try {
        const response = await api.get("/api/v1/stats/monitoring", {
          signal: controller.signal,
          params: { monitor_name: selectedMonitor },
        });

        const items = response.data?.items || [];
        setRawItems(items);

        const formattedChart = items.map((item, index) => ({
          id: index,
          value: item.count,
          label: item.name || "Unknown Status",
        }));
        setChartData(formattedChart);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("Error loading monitoring stats:", err);
        setError("Failed to load monitoring metrics.");
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      }
    };

    fetchMonitoringStats();
    return () => controller.abort();
  }, [selectedMonitor]);

  return (
    <Card sx={{ bgcolor: "background.paper", p: 1, height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Monitoring status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Status distribution across monitored target environments.
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="monitor-select-label">Monitor Name</InputLabel>
            <Select
              labelId="monitor-select-label"
              value={selectedMonitor}
              label="Monitor Name"
              onChange={(e) => setSelectedMonitor(e.target.value)}
              disabled={monitorsLoading || monitors.length === 0}
            >
              {monitors.map((mon) => (
                <MenuItem key={mon} value={mon}>
                  {mon}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {(monitorsLoading || statsLoading) && (
          <Box sx={{ width: "100%", py: 6 }}>
            <LinearProgress />
          </Box>
        )}

        {error && !statsLoading && (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}

        {!monitorsLoading && !statsLoading && !error && chartData.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No monitoring records found.
          </Typography>
        )}

        {!monitorsLoading && !statsLoading && !error && chartData.length > 0 && (
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5} sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ width: "100%", maxWidth: 280, height: 240 }}>
                <PieChart
                  series={[
                    {
                      data: chartData,
                      innerRadius: 40,
                      outerRadius: 90,
                      paddingAngle: 3,
                      cornerRadius: 5,
                      highlightScope: { faded: "blurred", highlighted: "onSeries" },
                    },
                  ]}
                  height={230}
                  slotProps={{
                    legend: { hidden: true },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280, overflow: "auto" }}>
                <Table stickyHeader size="small" aria-label="Monitoring status table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>
                        Status
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "action.hover", width: 100 }}>
                        Count
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rawItems.map((row, index) => (
                      <TableRow key={`${row.name || "status"}-${index}`} hover>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                          {row.name || "Unknown"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                          {row.count?.toLocaleString() || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
