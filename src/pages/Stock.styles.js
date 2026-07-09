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

export const filtersCard = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  alignItems: "center",
  backgroundColor: "white",
  borderRadius: "14px",
  padding: "16px",
  marginBottom: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 5px 15px rgba(15, 23, 42, 0.05)"
};

export const checkboxFilter = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "700",
  color: "#0f172a"
};

export const filterGroup = {
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

export const filterLabel = {
  fontWeight: "700",
  color: "#334155"
};

export const select = {
  padding: "9px 10px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  color: "#0f172a",
  outline: "none"
};

export const searchInput = {
  minWidth: "330px",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "white"
};

export const searchInputMobile = {
  ...searchInput,
  minWidth: "0",
  width: "100%",
  boxSizing: "border-box"
};

export const errorBox = {
  marginBottom: "16px",
  padding: "12px 14px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  borderRadius: "10px",
  fontWeight: "600"
};

export const tableCard = {
  backgroundColor: "white",
  borderRadius: "14px",
  boxShadow: "0 5px 15px rgba(15, 23, 42, 0.05)",
  border: "1px solid #e2e8f0",
  overflow: "hidden"
};

export const tableWrapper = {
  overflowX: "auto"
};

export const emptyBox = {
  padding: "20px",
  color: "#64748b",
  fontWeight: "600"
};

export const table = {
  width: "100%",
  borderCollapse: "collapse"
};

export const th = {
  textAlign: "left",
  padding: "14px 12px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
  fontWeight: "800"
};

export const td = {
  padding: "13px 12px",
  borderBottom: "1px solid #f1f5f9",
  color: "#0f172a"
};

export const tdCantidad = {
  ...td,
  whiteSpace: "nowrap"
};

export const cantidadTexto = {
  display: "inline-block",
  width: "40px",
  fontFamily: "monospace",
  fontWeight: "800",
  letterSpacing: "1px",
  textAlign: "right"
};

export const badgeWrapper = {
  display: "inline-block",
  width: "60px",
  marginLeft: "10px"
};

export const badgeBajo = {
  display: "inline-block",
  padding: "3px 7px",
  fontSize: "11px",
  backgroundColor: "#dc2626",
  color: "white",
  borderRadius: "999px",
  fontWeight: "800"
};
