// src/components/NavBar.jsx
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <div
      style={{
        backgroundColor: "#222",
        color: "white",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link
        to="/"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "1.1rem",
        }}
      >
        CIS 5500 Health Risk App
      </Link>

      <div>
        <Link
          to="/top-disease"
          style={{
            color: "white",
            textDecoration: "none",
            marginLeft: "1.5rem",
          }}
        >
          Top Disease
        </Link>
      </div>
    </div>
  );
}
