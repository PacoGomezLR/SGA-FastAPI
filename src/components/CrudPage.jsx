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
      <h1 style={pageTitle}>{title}</h1>

      {message && <div style={successBox}>{message}</div>}
      {error && <div style={errorBox}>{error}</div>}

      <div style={card}>
        <h2 style={cardTitleStyle}>{cardTitle}</h2>

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
        <p style={infoText}>Cargando...</p>
      ) : !tableContent ? (
        <p style={infoText}>{emptyMessage}</p>
      ) : null}

      {tableContent}
    </div>
  );
}

const pageTitle = {
  marginBottom: "24px"
};

const card = {
  padding: "28px",
  backgroundColor: "white",
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  marginBottom: "24px"
};

const cardTitleStyle = {
  marginTop: 0,
  marginBottom: "20px"
};

const formGrid = {
  display: "grid",
  gap: "14px",
  maxWidth: "720px"
};

const successBox = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "14px",
  border: "1px solid #bbf7d0"
};

const errorBox = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "14px",
  border: "1px solid #fecaca"
};

const searchInput = {
  marginBottom: "18px",
  padding: "12px 14px",
  width: "100%",
  maxWidth: "400px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "white"
};

const infoText = {
  color: "#64748b",
  marginBottom: "16px"
};

export default CrudPage;