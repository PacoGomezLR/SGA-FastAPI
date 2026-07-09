import { useIsMobile } from "../hooks/useMediaQuery";
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
  const esMobile = useIsMobile();

  return (
    <div>
      <h1 style={styles.pageTitle}>{title}</h1>

      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={esMobile ? styles.cardMobile : styles.card}>
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

      {tableContent && (
        <div style={styles.tableWrapper}>{tableContent}</div>
      )}
    </div>
  );
}

export default CrudPage;