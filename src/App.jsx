import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Secciones from "./pages/Secciones";
import SeccionDetalle from "./pages/SeccionDetalle";
import SeccionMapa from "./pages/SeccionMapa";
import Stock from "./pages/Stock";
import Recepciones from "./pages/Recepciones";
import Movimientos from "./pages/Movimientos";
import Salidas from "./pages/Salidas";
import Inventarios from "./pages/Inventarios";
import Auditoria from "./pages/Auditoria";
import Categorias from "./pages/Categorias";
import Ubicaciones from "./pages/Ubicaciones";

import MainLayout from "./layouts/MainLayout";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  const { usuarioAutenticado } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            usuarioAutenticado ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            usuarioAutenticado ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/secciones" element={<Secciones />} />
          <Route path="/secciones/mapa" element={<SeccionMapa />} />
          <Route path="/secciones/:id" element={<SeccionDetalle />} />
          <Route path="/ubicaciones" element={<Ubicaciones />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/recepciones" element={<Recepciones />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/inventarios" element={<Inventarios />} />
          <Route path="/auditoria" element={<Auditoria />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;