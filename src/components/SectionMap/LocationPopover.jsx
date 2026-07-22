import * as styles from "./SectionMap.styles";

function LocationPopover({ ubicacion, stockUbicacion, onClose }) {
  if (!ubicacion) return null;

  return (
    <div style={styles.popoverOverlay} onClick={onClose}>
      <div style={styles.popoverBox} onClick={(e) => e.stopPropagation()}>
        <div style={styles.popoverHeader}>
          <h3 style={styles.popoverTitle}>{ubicacion.codigo}</h3>
          <button type="button" style={styles.popoverCloseButton} onClick={onClose}>
            ×
          </button>
        </div>

        {stockUbicacion.length === 0 ? (
          <p style={styles.popoverEmpty}>Esta ubicación está vacía.</p>
        ) : (
          <div style={styles.popoverList}>
            {stockUbicacion.map((linea) => (
              <div key={linea.producto_id} style={styles.popoverItem}>
                <span>{linea.producto_nombre || `Producto ${linea.producto_id}`}</span>
                <span
                  style={{
                    ...styles.popoverQuantity,
                    color: linea.bajo_stock ? "#b91c1c" : "#166534"
                  }}
                >
                  {linea.cantidad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationPopover;
