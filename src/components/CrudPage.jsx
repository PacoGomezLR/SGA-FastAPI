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
  tableContent,
  showForm = true,
  onShowForm,
  showFormButtonText,
  extraToolbarContent,
  headerAction
}) {
  const esMobile = useIsMobile();

  return (
    <div>
      <div style={styles.headerRow}>
        <h1 style={styles.pageTitle}>{title}</h1>
        {headerAction}
      </div>

      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {!showForm && onShowForm ? (
        <div style={styles.toolbar}>
          <button
            type="button"
            onClick={onShowForm}
            style={styles.toggleFormButton}
          >
            {showFormButtonText || cardTitle}
          </button>

          <input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={onSearchChange}
            style={styles.searchInputInToolbar}
          />

          {extraToolbarContent}
        </div>
      ) : extraToolbarContent ? (
        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={onSearchChange}
            style={styles.searchInputInToolbar}
          />

          {extraToolbarContent}
        </div>
      ) : (
        <input
          type="text"
          placeholder="Buscar..."
          value={searchValue}
          onChange={onSearchChange}
          style={styles.searchInput}
        />
      )}

      {showForm && (
        <div style={esMobile ? styles.cardMobile : styles.card}>
          <h2 style={styles.cardTitleStyle}>{cardTitle}</h2>

          <form onSubmit={onSubmit}>
            <div style={styles.formGrid}>
              {formContent}
            </div>
          </form>
        </div>
      )}

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