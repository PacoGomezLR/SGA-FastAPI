import { useState } from "react";

function Inventarios() {
  const [form, setForm] = useState({
    producto_id: "",
    ubicacion_id: "",
    cantidad_real: ""
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    console.log("Ajuste de inventario:", form);

    // aquí luego conectaremos con backend
  }

  return (
    <div>
      <h1>Inventarios</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "400px"
        }}
      >
        <input
          type="text"
          name="producto_id"
          placeholder="ID Producto"
          value={form.producto_id}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="ubicacion_id"
          placeholder="Ubicación"
          value={form.ubicacion_id}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="cantidad_real"
          placeholder="Cantidad real"
          value={form.cantidad_real}
          onChange={handleChange}
          required
        />

        <button type="submit">Ajustar inventario</button>
      </form>
    </div>
  );
}

export default Inventarios;