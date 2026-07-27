// Textura de suelo de almacén: rejilla de losetas de hormigón. Dos
// gradientes lineales (uno por eje) repetidos cada 40px sobre el color base,
// con una línea ligeramente más oscura marcando cada junta.
const suelo = (colorBase, colorJunta) => ({
  backgroundColor: colorBase,
  backgroundImage: `
    linear-gradient(90deg, ${colorJunta} 1px, transparent 1px),
    linear-gradient(${colorJunta} 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px"
});

export const wrapper = {
  position: "relative",
  width: "100%",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  ...suelo("#f8fafc", "#e7ebf1"),
  overflow: "hidden"
};

export const wrapperFullscreen = {
  position: "fixed",
  inset: "8px",
  boxSizing: "border-box",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  ...suelo("#e2e8f0", "#cbd5e1"),
  overflow: "hidden",
  zIndex: 1000,
  isolation: "isolate",
  transform: "translateZ(0)",
  touchAction: "none"
};

export const toolbarFullscreen = {
  position: "fixed",
  top: "8px",
  left: "8px",
  right: "8px",
  zIndex: 1001,
  padding: "14px 20px",
  backgroundColor: "white",
  borderRadius: "10px 10px 0 0",
  border: "1px solid #d1d5db",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

export const svg = {
  display: "block"
};

export const mensajeCentro = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px",
  color: "#6b7280",
  textAlign: "center"
};

export const legend = {
  position: "absolute",
  bottom: "10px",
  left: "10px",
  display: "flex",
  gap: "14px",
  padding: "8px 12px",
  backgroundColor: "rgba(255,255,255,0.92)",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  fontSize: "12px",
  color: "#334155",
  pointerEvents: "none"
};

export const legendItem = {
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

export const legendDot = {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  display: "inline-block"
};

export const popoverOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px"
};

export const popoverBox = {
  width: "100%",
  maxWidth: "360px",
  backgroundColor: "white",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.20)"
};

export const popoverHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px"
};

export const popoverTitle = {
  margin: 0,
  fontSize: "18px",
  color: "#0f172a"
};

export const popoverCloseButton = {
  border: "none",
  background: "none",
  fontSize: "22px",
  lineHeight: 1,
  cursor: "pointer",
  color: "#6b7280"
};

export const popoverEmpty = {
  color: "#6b7280",
  margin: 0
};

export const popoverList = {
  display: "grid",
  gap: "8px"
};

export const popoverItem = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 10px",
  borderRadius: "8px",
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0"
};

export const popoverQuantity = {
  fontWeight: "700"
};

export const toolbar = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px"
};

export const primaryButton = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#0f172a",
  color: "white",
  fontWeight: "600",
  cursor: "pointer"
};

export const secondaryButton = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  color: "#0f172a",
  fontWeight: "600",
  cursor: "pointer"
};

export const editHint = {
  fontSize: "13px",
  color: "#6b7280"
};

export const buscadorWrapper = {
  position: "relative",
  flex: "1 1 260px",
  minWidth: "220px"
};

export const buscadorInput = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  outline: "none",
  boxSizing: "border-box"
};

export const sugerenciasLista = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 20,
  backgroundColor: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
  overflow: "hidden",
  maxHeight: "260px",
  overflowY: "auto"
};

export const sugerenciaItem = {
  padding: "10px 14px",
  cursor: "pointer",
  fontSize: "14px",
  color: "#0f172a",
  borderBottom: "1px solid #f1f5f9"
};

export const buscadorContador = {
  fontSize: "13px",
  color: "#6b7280",
  whiteSpace: "nowrap"
};

export const hoverCard = {
  position: "fixed",
  zIndex: 1100,
  maxWidth: "260px",
  padding: "10px 14px",
  backgroundColor: "rgba(15, 23, 42, 0.94)",
  borderRadius: "8px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  pointerEvents: "none"
};

export const hoverCardTitle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "white",
  marginBottom: "4px"
};

export const hoverCardDescripcion = {
  fontSize: "12px",
  color: "#e2e8f0",
  lineHeight: 1.4
};

