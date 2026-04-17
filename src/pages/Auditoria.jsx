function Auditoria() {
  return (
    <div>
      <h1>Auditoría</h1>

      <p style={{ marginTop: "20px" }}>
        Aquí se mostrará el historial de acciones importantes del sistema.
      </p>

      <ul style={{ marginTop: "16px", paddingLeft: "20px" }}>
        <li>Recepciones confirmadas</li>
        <li>Movimientos realizados</li>
        <li>Salidas registradas</li>
        <li>Ajustes de inventario</li>
        <li>Acciones de usuarios</li>
      </ul>
    </div>
  );
}

export default Auditoria;