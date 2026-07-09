export const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "20px",
  flexWrap: "wrap"
};

export const subtitle = {
  margin: "6px 0 0 0",
  color: "#64748b"
};

export const successBox = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "16px",
  fontWeight: "500"
};

export const errorBox = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "16px",
  fontWeight: "500"
};

export const topGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  alignItems: "stretch",
  marginBottom: "20px"
};

export const card = {
  position: "relative",
  backgroundColor: "white",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "28px 24px 24px",
  border: "1px solid #e2e8f0"
};

export const summaryCard = {
  position: "relative",
  backgroundColor: "white",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  padding: "28px 24px 24px",
  border: "1px solid #e2e8f0",
  minHeight: "230px"
};

export const stepBadge = {
  position: "absolute",
  top: "-14px",
  left: "20px",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  backgroundColor: "#0f172a",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  boxShadow: "0 6px 14px rgba(15, 23, 42, 0.22)"
};

export const cardTitle = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "24px",
  color: "#0f172a"
};

export const fieldGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "16px"
};

export const label = {
  fontWeight: "700",
  color: "#334155"
};

export const input = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "#fff",
  color: "#0f172a"
};

export const textarea = {
  ...input,
  resize: "vertical",
  minHeight: "108px"
};

export const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "22px"
};

export const summaryItem = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

export const summaryLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "700"
};

export const summaryValue = {
  color: "#0f172a",
  fontSize: "17px"
};

export const actions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

export const primaryButton = {
  padding: "11px 16px",
  border: "none",
  borderRadius: "9px",
  color: "white",
  fontWeight: "700"
};

export const secondaryButton = {
  padding: "11px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  backgroundColor: "white",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: "700"
};

export const ubicacionButton = {
  ...input,
  textAlign: "left",
  cursor: "pointer"
};

export const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px"
};

export const modalBox = {
  width: "100%",
  maxWidth: "440px",
  maxHeight: "80vh",
  overflowY: "auto",
  backgroundColor: "white",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.20)"
};

export const modalTitle = {
  margin: "0 0 6px 0",
  color: "#0f172a"
};

export const modalSubtitle = {
  margin: "0 0 18px 0",
  color: "#64748b"
};

export const locationsList = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

export const locationItem = {
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "12px"
};

export const locationItemButton = {
  ...locationItem,
  width: "100%",
  textAlign: "left",
  backgroundColor: "white",
  cursor: "pointer",
  font: "inherit"
};

export const locationCode = {
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: "4px"
};

export const locationText = {
  color: "#64748b",
  fontSize: "14px"
};

export const modalActions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "16px"
};
