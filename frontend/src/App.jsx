import { useEffect, useMemo, useState } from "react";
import { Box, Container, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "./api";

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 50,
  });

  const [sortModel, setSortModel] = useState([{ field: "id", sort: "asc" }]);
  const [search, setSearch] = useState("");

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", flex: 0.7 },
      { field: "tag", headerName: "Tag", flex: 1.2 },
      { field: "status", headerName: "Status", flex: 1 },
      { field: "owner", headerName: "Owner", flex: 1.2 },
      { field: "location", headerName: "Location", flex: 1.2 },
      { field: "os", headerName: "OS", flex: 1.2 },
      { field: "type", headerName: "Type", flex: 1.1 },
    ],
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const sortBy = sortModel[0]?.field || "id";
        const sortDir = sortModel[0]?.sort || "asc";

        const response = await api.get("/api/v1/assets", {
          params: {
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            sort_by: sortBy,
            sort_dir: sortDir,
            search: search || undefined,
          },
        });

        setRows(response.data.items);
        setRowCount(response.data.total);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paginationModel, sortModel, search]);

  return (
    <Container maxWidth={false} sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asset Master
      </Typography>

      <Box sx={{ mb: 2, maxWidth: 400 }}>
        <TextField
          fullWidth
          label="Search"
          value={search}
          onChange={(e) => {
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
            setSearch(e.target.value);
          }}
        />
      </Box>

      <Box sx={{ height: 700, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          pagination
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
        />
      </Box>
    </Container>
  );
}
