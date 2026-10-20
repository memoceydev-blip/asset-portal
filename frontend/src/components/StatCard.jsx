import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import axios from "axios";
import { api } from "../api";

export default function StatCard({
  title,
  subtitle,
  url,
  defaultLabel,
  groupOptions,
  initialGroup,
  extraParams = {},
}) {
  const [selectedGroup, setSelectedGroup] = useState(initialGroup || "");
  const [rawItems, setRawItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = { ...extraParams };
        if (selectedGroup) {
          params.group_by = selectedGroup;
        }

        const response = await api.get(url, {
          signal: controller.signal,
          params,
        });

        const items = response.data?.items || [];
        setRawItems(items);

        const formattedChart = items.map((item, index) => ({
          id: index,
          value: item.count,
          label: item.name || defaultLabel,
        }));
        setChartData(formattedChart);
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error(`Error loading stat metrics from ${url}:`, err);
        setError("Failed to load metrics summary.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadMetrics();
    return () => controller.abort();
  }, [url, selectedGroup, JSON.stringify(extraParams)]);

  const tableHeaderLabel = useMemo(() => {
    if (!groupOptions) return defaultLabel;
    const currentOption = groupOptions.find((opt) => opt.value === selectedGroup);
    return currentOption ? currentOption.label : defaultLabel;
  }, [groupOptions, selectedGroup, defaultLabel]);

  return (
    <Card sx={{ bgcolor: "background.paper", p: 1, height: "100%" }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 0.5 }}
        >
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          </Box>

          {groupOptions && groupOptions.length > 0 && (
            <ToggleButtonGroup
              size="small"
              value={selectedGroup}
              exclusive
              onChange={(_, val) => val && setSelectedGroup(val)}
              aria-label={`Group ${title} By`}
            >
              {groupOptions.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Stack>

        {loading && (
          <Box sx={{ width: "100%", py: 6 }}>
            <LinearProgress />
          </Box>
        )}

        {error && !loading && (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && chartData.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No telemetry records found.
          </Typography>
        )}

        {!loading && !error && chartData.length > 0 && (
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
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 280, overflow: "auto" }}
              >
                <Table stickyHeader size="small" aria-label={`${title} counts table`}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "action.hover" }}>
                        {tableHeaderLabel}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, bgcolor: "action.hover", width: 100 }}
                      >
                        Count
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rawItems.map((row, index) => (
                      <TableRow key={`${row.name || "item"}-${index}`} hover>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                          {row.name || "Unknown"}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                        >
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

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  defaultLabel: PropTypes.string.isRequired,
  groupOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  initialGroup: PropTypes.string,
  extraParams: PropTypes.object,
};