import * as styles from "./CrudPage.styles";

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
      <h1 style={styles.pageTitle}>{title}</h1>

      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.card}>
        <h2 style={styles.cardTitleStyle}>{cardTitle}</h2>

        <form onSubmit={onSubmit}>
          <div style={styles.formGrid}>
            {formContent}
          </div>
        </form>
      </div>

      <input
        type="text"
        placeholder="Buscar..."
        value={searchValue}
        onChange={onSearchChange}
        style={styles.searchInput}
      />

      {loading ? (
        <p style={styles.infoText}>Cargando...</p>
      ) : !tableContent ? (
        <p style={styles.infoText}>{emptyMessage}</p>
      ) : null}

      {tableContent}
    </div>
  );
}

export default CrudPage;