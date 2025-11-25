// src/pages/TopDisease.jsx
import LazyTable from "../components/LazyTable.jsx";

// temporary: hard-code backend base URL
const BACKEND_BASE = "http://localhost:3000";

// columns we expect the backend to return for /disease
// you can rename/adjust these once the SQL is final
const diseaseColumns = [
  { field: "disease_name", headerName: "Disease" },
  { field: "state_name", headerName: "State" },
  { field: "total_cases", headerName: "Total Cases" },
  { field: "per_capita_rate", headerName: "Per-Capita Rate" },
];

export default function TopDisease() {
  return (
    <div
      style={{
        padding: "2rem",
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
      }}
    >
      <h2>Top Diseases in the USA</h2>
      <p style={{ marginTop: "0.75rem", marginBottom: "1.5rem" }}>
        Below is a table of the top diseases. This table is backed by the
        <code> /disease</code> API.
      </p>

      <LazyTable
        route={`${BACKEND_BASE}/disease`}
        columns={diseaseColumns}
        defaultPageSize={10}       // show 10 rows initially
        rowsPerPageOptions={[5,10,25]}
      />
    </div>
  );
}
