import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate("/");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: "220px",
          backgroundColor: "#1e293b",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div>
          <h2>SGA</h2>

          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              to="/dashboard"
              style={{ color: "white", textDecoration: "none" }}
            >
              Dashboard
            </Link>

            <Link
              to="/productos"
              style={{ color: "white", textDecoration: "none" }}
            >
              Productos
            </Link>
          </nav>
        </div>

        <button
          onClick={cerrarSesion}
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;