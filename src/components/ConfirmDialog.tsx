interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-overlay" />
      <div className="confirm-dialog">
        <h3>Clear All Data?</h3>
        <p>This action cannot be undone.</p>
        <div className="confirm-dialog-buttons">
          <button className="confirm" onClick={onConfirm}>
            Clear
          </button>
          <button className="cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
