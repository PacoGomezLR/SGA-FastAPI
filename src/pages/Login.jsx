import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formulario, setFormulario] = useState({
    email: "",
    password: ""
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    console.log("Datos del login:", formulario);

    login();
    navigate("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f1f5f9"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
        }}
      >
        <h1 style={{ marginBottom: "20px", textAlign: "center" }}>
          Iniciar sesión
        </h1>

        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formulario.email}
            onChange={handleChange}
            placeholder="Introduce tu email"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "6px" }}>
            Contraseña
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formulario.password}
            onChange={handleChange}
            placeholder="Introduce tu contraseña"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px"
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#1e293b",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;