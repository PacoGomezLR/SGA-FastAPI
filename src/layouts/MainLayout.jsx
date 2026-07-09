import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import * as styles from "./MainLayout.styles";

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
    <div style={styles.container}>
      <aside style={styles.aside}>
        <div>
          <div style={styles.logoWrapper}>
            <h2 style={styles.logoTitle}>
              SGA
            </h2>

            <p style={styles.logoSubtitle}>
              Sistema de gestión de almacén
            </p>
          </div>

          <nav style={styles.nav}>
            <NavLink to="/dashboard" style={getLinkStyle}>
              Resumen Almacén
            </NavLink>

            <NavLink to="/productos" style={getLinkStyle}>
              Productos
            </NavLink>

            <NavLink to="/categorias" style={getLinkStyle}>
              Categorías
            </NavLink>

            <NavLink to="/almacenes" style={getLinkStyle}>
              Almacenes
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

        <div style={styles.footerWrapper}>
          <button
            type="button"
            onClick={solicitarCerrarSesion}
            style={styles.logoutButton}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>
            Panel de gestión
          </h1>
        </header>

        <section style={styles.section}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default MainLayout;