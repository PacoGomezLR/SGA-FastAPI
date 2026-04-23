import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";

function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  function solicitarCerrarSesion() {
    confirm({
      title: "Cerrar sesión",
      message: "¿Seguro que quieres cerrar sesión?",
      confirmText: "Cerrar sesión",
      cancelText: "Cancelar",
      onConfirm: () => {
        logout();
        navigate("/");
      }
    });
  }

  function getLinkStyle({ isActive }) {
    return {
      display: "block",
      color: isActive ? "#ffffff" : "#cbd5e1",
      textDecoration: "none",
      padding: "10px 12px",
      borderRadius: "8px",
      backgroundColor: isActive ? "#334155" : "transparent",
      fontWeight: isActive ? "600" : "400",
      transition: "all 0.2s ease"
    };
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f8fafc"
      }}
    >
      <aside
        style={{
          width: "240px",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)"
        }}
      >
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "0.5px"
              }}
            >
              SGA
            </h2>

            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "14px",
                color: "#94a3b8"
              }}
            >
              Sistema de gestión de almacén
            </p>
          </div>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <NavLink to="/dashboard" style={getLinkStyle}>
              Resumen Almacén
            </NavLink>

            <NavLink to="/productos" style={getLinkStyle}>
              Productos
            </NavLink>

            <NavLink to="/almacenes" style={getLinkStyle}>
              Almacenes
            </NavLink>

            <NavLink to="/zonas" style={getLinkStyle}>
              Zonas
            </NavLink>

            <NavLink to="/stock" style={getLinkStyle}>
              Stock
            </NavLink>

            <NavLink to="/recepciones" style={getLinkStyle}>
              Recepciones
            </NavLink>

            <NavLink to="/movimientos" style={getLinkStyle}>
              Movimientos
            </NavLink>

            <NavLink to="/salidas" style={getLinkStyle}>
              Salidas
            </NavLink>

            <NavLink to="/inventarios" style={getLinkStyle}>
              Inventarios
            </NavLink>

            <NavLink to="/auditoria" style={getLinkStyle}>
              Auditoría
            </NavLink>
          </nav>
        </div>

        <div style={{ borderTop: "1px solid #334155", paddingTop: "16px" }}>
          <button
            type="button"
            onClick={solicitarCerrarSesion}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0
        }}
      >
        <header
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "16px 24px"
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              color: "#0f172a"
            }}
          >
            Panel de gestión
          </h1>
        </header>

        <section
          style={{
            flex: 1,
            padding: "24px"
          }}
        >
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default MainLayout;