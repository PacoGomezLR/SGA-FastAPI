export const container = {
  display: "flex",
  minHeight: "100vh",
  backgroundColor: "#f8fafc"
};

export const aside = {
  width: "240px",
  backgroundColor: "#0f172a",
  color: "white",
  padding: "24px 16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)"
};

export const asideMobile = {
  ...aside,
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 1100,
  transition: "transform 0.25s ease",
  overflowY: "auto"
};

export const asideMobileOpen = {
  ...asideMobile,
  transform: "translateX(0)"
};

export const asideMobileClosed = {
  ...asideMobile,
  transform: "translateX(-100%)"
};

export const overlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.5)",
  zIndex: 1050
};

export const menuButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  backgroundColor: "white",
  color: "#0f172a",
  cursor: "pointer",
  flexShrink: 0
};

export const logoWrapper = {
  marginBottom: "32px"
};

export const logoTitle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "0.5px"
};

export const logoSubtitle = {
  margin: "8px 0 0 0",
  fontSize: "14px",
  color: "#94a3b8"
};

export const nav = {
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

export const footerWrapper = {
  borderTop: "1px solid #334155",
  paddingTop: "16px"
};

export const logoutButton = {
  width: "100%",
  padding: "10px 12px",
  backgroundColor: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600"
};

export const main = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0
};

export const header = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #e2e8f0",
  padding: "16px 24px",
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

export const headerTitle = {
  margin: 0,
  fontSize: "20px",
  color: "#0f172a"
};

export const section = {
  flex: 1,
  padding: "24px"
};

export const sectionMobile = {
  ...section,
  padding: "16px"
};
