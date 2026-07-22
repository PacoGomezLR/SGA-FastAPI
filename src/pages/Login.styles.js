export const page = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 50%, #e2e8f0 100%)",
  padding: "20px"
};

export const form = {
  backgroundColor: "white",
  padding: "32px",
  borderRadius: "16px",
  width: "100%",
  maxWidth: "420px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
  border: "1px solid #e2e8f0"
};

export const headerWrapper = {
  marginBottom: "24px",
  textAlign: "center"
};

export const title = {
  margin: "0 0 8px 0",
  color: "#0f172a",
  fontSize: "28px"
};

export const subtitle = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px"
};

export const demoBox = {
  marginBottom: "16px",
  padding: "12px",
  backgroundColor: "#eff6ff",
  color: "#1e40af",
  borderRadius: "10px",
  fontSize: "13px",
  border: "1px solid #bfdbfe",
  textAlign: "center"
};

export const errorBox = {
  marginBottom: "16px",
  padding: "12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "10px",
  fontSize: "14px",
  border: "1px solid #fecaca"
};

export const fieldWrapper = {
  marginBottom: "16px"
};

export const fieldWrapperLast = {
  marginBottom: "22px"
};

export const fieldLabel = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
  color: "#334155"
};

export function fieldInput(cargando) {
  return {
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: cargando ? "#f8fafc" : "white"
  };
}

export function submitButton(cargando) {
  return {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: cargando ? "not-allowed" : "pointer",
    opacity: cargando ? 0.75 : 1,
    fontWeight: "600",
    fontSize: "15px"
  };
}
