import { useEffect, useRef } from "react";
import * as styles from "./ConfirmModal.styles";

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
    <div style={styles.overlayStyle} onClick={handleOverlayClick}>
      <div
        style={styles.modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h3 id="confirm-modal-title" style={styles.titleStyle}>
          {title}
        </h3>

        <p style={styles.messageStyle}>{message}</p>

        <div style={styles.actionsStyle}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              ...styles.cancelButtonStyle,
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
              ...styles.confirmButtonStyle,
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

export default ConfirmModal;