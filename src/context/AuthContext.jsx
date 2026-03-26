import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const authGuardada = localStorage.getItem("usuarioAutenticado");
    return authGuardada === "true";
  });

  function login() {
    setUsuarioAutenticado(true);
    localStorage.setItem("usuarioAutenticado", "true");
  }

  function logout() {
    setUsuarioAutenticado(false);
    localStorage.removeItem("usuarioAutenticado");
  }

  return (
    <AuthContext.Provider
      value={{
        usuarioAutenticado,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

export { AuthProvider, useAuth };