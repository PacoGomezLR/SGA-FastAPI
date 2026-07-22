import SectionMap from "../components/SectionMap/SectionMap";
import * as styles from "./SeccionMapa.styles";

function SeccionMapa() {
  return (
    <div>
      <h1 style={styles.pageTitle}>Mapa 2D de secciones</h1>

      <p style={styles.subtitle}>
        Explora el layout de todas las secciones: haz zoom para ver las
        ubicaciones y haz clic en una para consultar su stock.
      </p>

      <SectionMap height={720} />
    </div>
  );
}

export default SeccionMapa;
