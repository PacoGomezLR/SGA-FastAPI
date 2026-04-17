import { useEffect, useRef } from "react";

function ConfirmModal({
  open,
  title = "Confirmar acción",
  message = "¿Estás seguro de que quieres continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  loading = false
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }

      if (event.key === "Enter" && !loading) {
        onConfirm();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 0);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel, onConfirm]);

  if (!open) return null;

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && !loading) {
      onCancel();
    }
  }

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h3 id="confirm-modal-title" style={titleStyle}>
          {title}
        </h3>

        <p style={messageStyle}>{message}</p>

        <div style={actionsStyle}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              ...cancelButtonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...confirmButtonStyle,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 9999
};

const modalStyle = {
  width: "100%",
  maxWidth: "420px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.18)",
  border: "1px solid #e2e8f0"
};

const titleStyle = {
  margin: "0 0 12px 0",
  fontSize: "20px",
  color: "#0f172a"
};

const messageStyle = {
  margin: "0 0 24px 0",
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#475569"
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px"
};

const cancelButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#334155",
  fontWeight: "600"
};

const confirmButtonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  fontWeight: "600"
};

export default ConfirmModal;