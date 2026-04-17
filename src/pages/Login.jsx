import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, usuarioAutenticado } = useAuth();

  const [formulario, setFormulario] = useState({
    username: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (usuarioAutenticado) {
      navigate("/dashboard", { replace: true });
    }
  }, [usuarioAutenticado, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formulario.username.trim() || !formulario.password.trim()) {
      setError("Debes rellenar usuario y contraseña");
      return;
    }

    try {
      setCargando(true);
      setError("");

      await login({
        username: formulario.username.trim(),
        password: formulario.password
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 50%, #e2e8f0 100%)",
        padding: "20px"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1
            style={{
              margin: "0 0 8px 0",
              color: "#0f172a",
              fontSize: "28px"
            }}
          >
            Iniciar sesión
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "14px"
            }}
          >
            Accede al sistema de gestión de almacén
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              borderRadius: "10px",
              fontSize: "14px",
              border: "1px solid #fecaca"
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="username"
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#334155"
            }}
          >
            Usuario
          </label>

          <input
            type="text"
            id="username"
            name="username"
            value={formulario.username}
            onChange={handleChange}
            placeholder="Introduce tu usuario"
            autoComplete="username"
            disabled={cargando}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
              boxSizing: "border-box",
              backgroundColor: cargando ? "#f8fafc" : "white"
            }}
          />
        </div>

        <div style={{ marginBottom: "22px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#334155"
            }}
          >
            Contraseña
          </label>

          <input
            type="password"
            id="password"
            name="password"
            value={formulario.password}
            onChange={handleChange}
            placeholder="Introduce tu contraseña"
            autoComplete="current-password"
            disabled={cargando}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              outline: "none",
              fontSize: "14px",
              boxSizing: "border-box",
              backgroundColor: cargando ? "#f8fafc" : "white"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.75 : 1,
            fontWeight: "600",
            fontSize: "15px"
          }}
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default Login;