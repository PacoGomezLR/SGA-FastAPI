import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Almacenes from "./pages/Almacenes";
import AlmacenDetalle from "./pages/AlmacenDetalle";
import Zonas from "./pages/Zonas";
import Stock from "./pages/Stock";
import Recepciones from "./pages/Recepciones";
import Movimientos from "./pages/Movimientos";
import Salidas from "./pages/Salidas";
import Inventarios from "./pages/Inventarios";
import Auditoria from "./pages/Auditoria";

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
          <Route path="/almacenes" element={<Almacenes />} />
          <Route path="/almacenes/:id" element={<AlmacenDetalle />} />
          <Route path="/zonas" element={<Zonas />} />
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