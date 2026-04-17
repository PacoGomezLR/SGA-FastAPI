import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

const ConfirmContext = createContext(null);

const initialConfirmState = {
  open: false,
  title: "Confirmar acción",
  message: "¿Estás seguro de que quieres continuar?",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  onConfirm: null
};

function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState(initialConfirmState);
  const [loading, setLoading] = useState(false);

  const closeConfirm = useCallback(() => {
    if (loading) return;
    setConfirmState(initialConfirmState);
  }, [loading]);

  const confirm = useCallback(
    ({
      title = "Confirmar acción",
      message = "¿Estás seguro de que quieres continuar?",
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      onConfirm
    }) => {
      setConfirmState({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: typeof onConfirm === "function" ? onConfirm : null
      });
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmState.onConfirm) {
      closeConfirm();
      return;
    }

    try {
      setLoading(true);
      await confirmState.onConfirm();
      setConfirmState(initialConfirmState);
    } finally {
      setLoading(false);
    }
  }, [confirmState.onConfirm, closeConfirm]);

  const value = useMemo(
    () => ({
      confirm,
      closeConfirm
    }),
    [confirm, closeConfirm]
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
        loading={loading}
      />
    </ConfirmContext.Provider>
  );
}

function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  }

  return context;
}

export { ConfirmProvider, useConfirm };