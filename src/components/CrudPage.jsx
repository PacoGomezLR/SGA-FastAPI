function CrudPage({
  title,
  message,
  error,
  cardTitle,
  onSubmit,
  searchValue,
  onSearchChange,
  loading,
  emptyMessage,
  formContent,
  tableContent
}) {
  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>{title}</h1>

      {message && <div style={successBox}>{message}</div>}
      {error && <div style={errorBox}>{error}</div>}

      <div style={card}>
        <h2 style={{ marginTop: 0 }}>{cardTitle}</h2>

        <form onSubmit={onSubmit}>
          <div style={formGrid}>
            {formContent}
          </div>
        </form>
      </div>

      <input
        type="text"
        placeholder="Buscar..."
        value={searchValue}
        onChange={onSearchChange}
        style={searchInput}
      />

      {loading ? (
        <p>Cargando...</p>
      ) : !tableContent ? (
        <p>{emptyMessage}</p>
      ) : null}

      {tableContent}
    </div>
  );
}

const card = {
  padding: "20px",
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  marginBottom: "20px"
};

const formGrid = {
  display: "grid",
  gap: "12px",
  maxWidth: "600px"
};

const successBox = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: "10px",
  borderRadius: "8px",
  marginBottom: "12px"
};

const errorBox = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  padding: "10px",
  borderRadius: "8px",
  marginBottom: "12px"
};

const searchInput = {
  marginBottom: "16px",
  padding: "10px",
  width: "100%",
  maxWidth: "400px",
  borderRadius: "8px",
  border: "1px solid #ccc"
};

export default CrudPage;