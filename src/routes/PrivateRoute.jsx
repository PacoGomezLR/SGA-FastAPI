import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children }) {
  const { usuarioAutenticado } = useAuth();

  if (!usuarioAutenticado) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;