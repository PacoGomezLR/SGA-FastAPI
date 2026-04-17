import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { usuarioAutenticado, token } = useAuth();
  const location = useLocation();

  // doble validación por seguridad
  if (!usuarioAutenticado || !token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default PrivateRoute;