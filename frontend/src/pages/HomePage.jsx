// src/pages/HomePage.jsx
export default function HomePage() {
  return (
    <div
      style={{
        padding: "2rem",
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
      }}
    >
      <h2>Welcome to the CIS 5500 Health Risk App</h2>
      <p style={{ marginTop: "1rem" }}>
        Use the navigation bar above and click <strong>Top Disease</strong>.
      </p>
    </div>
  );
}
