import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const usuarioAutenticado = !!token;

  async function login({ username, password }) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    let response;
    let data = null;

    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || data?.message || "Credenciales incorrectas"
        );
      }

      const accessToken = data?.access_token;

      if (!accessToken) {
        throw new Error("Token no recibido");
      }

      setToken(accessToken);
      localStorage.setItem("token", accessToken);
    } catch (error) {
      setToken(null);
      localStorage.removeItem("token");

      throw error instanceof Error
        ? error
        : new Error("Error al iniciar sesión");
    }
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("token");
  }

  async function authFetch(endpoint, options = {}) {
    const headers = {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : ""
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      logout();
      throw new Error("Token inválido o expirado");
    }

    return response;
  }

  useEffect(() => {
    function syncToken() {
      const storedToken = localStorage.getItem("token") || null;
      setToken(storedToken);
    }

    window.addEventListener("storage", syncToken);

    return () => {
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        usuarioAutenticado,
        login,
        logout,
        authFetch
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