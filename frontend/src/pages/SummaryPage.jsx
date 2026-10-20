import PropTypes from "prop-types";
import { Grid } from "@mui/material";
import StatCard from "../components/StatCard";

export default function SummaryPage({ allowedPages }) {
  if (!allowedPages.includes("summary")) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <StatCard
          title="Operating Systems Distribution"
          subtitle="Breakdown of operating system distribution metrics across infrastructure."
          url="/api/v1/stats/os"
          defaultLabel="Unknown OS"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <StatCard
          title="Vendor / Manufacturer Breakdown"
          subtitle="Hardware manufacturer distribution across server nodes."
          url="/api/v1/stats/vendor"
          defaultLabel="Unknown Vendor"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <StatCard
          title="Product Model Breakdown"
          subtitle="Distribution across deployed hardware product lines."
          url="/api/v1/stats/product"
          defaultLabel="Unknown Product"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <StatCard
          title="Asset Types Breakdown"
          subtitle="Distribution across registered asset classification types."
          url="/api/v1/stats/asset_types"
          defaultLabel="Unknown Asset Type"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <StatCard
          title="Virtual Machine Location Distribution"
          subtitle="Virtual machine counts grouped by selected boundary."
          url="/api/v1/stats/locations"
          defaultLabel="Unknown Location"
          initialGroup="vcenter"
          extraParams={{ asset_type: "vm" }}
          groupOptions={[
            { value: "vcenter", label: "vCenter" },
            { value: "cluster", label: "Cluster" },
          ]}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <StatCard
          title="Bare Metal Location Distribution"
          subtitle="Bare metal counts grouped by selected boundary."
          url="/api/v1/stats/locations"
          defaultLabel="Unknown Location"
          initialGroup="pod"
          extraParams={{ asset_type: "bm" }}
          groupOptions={[
            { value: "pod", label: "Pod" },
            { value: "cabinet", label: "Cabinet" },
            { value: "site", label: "Site" },
          ]}
        />
      </Grid>
    </Grid>
  );
}

SummaryPage.propTypes = {
  allowedPages: PropTypes.arrayOf(PropTypes.string).isRequired,
};