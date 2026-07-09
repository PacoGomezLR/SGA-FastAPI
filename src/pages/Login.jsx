import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as styles from "./Login.styles";

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
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.headerWrapper}>
          <h1 style={styles.title}>Iniciar sesión</h1>

          <p style={styles.subtitle}>
            Accede al sistema de gestión de almacén
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.fieldWrapper}>
          <label htmlFor="username" style={styles.fieldLabel}>
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
            style={styles.fieldInput(cargando)}
          />
        </div>

        <div style={styles.fieldWrapperLast}>
          <label htmlFor="password" style={styles.fieldLabel}>
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
            style={styles.fieldInput(cargando)}
          />
        </div>

        <button type="submit" disabled={cargando} style={styles.submitButton(cargando)}>
          {cargando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default Login;
