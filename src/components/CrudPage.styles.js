export const headerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap"
};

export const pageTitle = {
  marginBottom: "24px"
};

export const card = {
  padding: "28px",
  backgroundColor: "white",
  borderRadius: "16px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  marginBottom: "24px"
};

export const cardMobile = {
  ...card,
  padding: "18px"
};

export const toolbar = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "24px"
};

export const toggleFormButton = {
  padding: "12px 20px",
  backgroundColor: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  whiteSpace: "nowrap"
};

export const cardTitleStyle = {
  marginTop: 0,
  marginBottom: "20px"
};

export const formGrid = {
  display: "grid",
  gap: "14px",
  maxWidth: "720px"
};

export const successBox = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "14px",
  border: "1px solid #bbf7d0"
};

export const errorBox = {
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  padding: "12px 14px",
  borderRadius: "10px",
  marginBottom: "14px",
  border: "1px solid #fecaca"
};

export const searchInput = {
  marginBottom: "18px",
  padding: "12px 14px",
  width: "100%",
  maxWidth: "400px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  outline: "none",
  backgroundColor: "white",
  boxSizing: "border-box"
};

export const searchInputInToolbar = {
  ...searchInput,
  margin: 0,
  flex: "1 1 260px"
};

export const infoText = {
  color: "#64748b",
  marginBottom: "16px"
};

export const tableWrapper = {
  overflowX: "auto"
};
