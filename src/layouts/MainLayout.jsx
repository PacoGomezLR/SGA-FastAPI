import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { useIsTabletDown } from "../hooks/useMediaQuery";
import * as styles from "./MainLayout.styles";

function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirm();

  const esTabletODown = useIsTabletDown();
  const [sidebarAbierta, setSidebarAbierta] = useState(false);
  const [rutaPrevia, setRutaPrevia] = useState(location.pathname);

  if (location.pathname !== rutaPrevia) {
    setRutaPrevia(location.pathname);
    if (sidebarAbierta) {
      setSidebarAbierta(false);
    }
  }

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

  const mostrarSidebarFija = !esTabletODown;

  const asideStyle = mostrarSidebarFija
    ? styles.aside
    : sidebarAbierta
      ? styles.asideMobileOpen
      : styles.asideMobileClosed;

  return (
    <div style={styles.container}>
      {!mostrarSidebarFija && sidebarAbierta && (
        <div style={styles.overlay} onClick={() => setSidebarAbierta(false)} />
      )}

      <aside style={asideStyle}>
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

            <NavLink to="/secciones" style={getLinkStyle}>
              Secciones
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
          {!mostrarSidebarFija && (
            <button
              type="button"
              aria-label={sidebarAbierta ? "Cerrar menú" : "Abrir menú"}
              style={styles.menuButton}
              onClick={() => setSidebarAbierta((abierta) => !abierta)}
            >
              {sidebarAbierta ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <h1 style={styles.headerTitle}>
            Panel de gestión
          </h1>
        </header>

        <section style={mostrarSidebarFija ? styles.section : styles.sectionMobile}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default MainLayout;
