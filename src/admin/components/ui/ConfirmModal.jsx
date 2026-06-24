function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-50

        flex
        items-center
        justify-center

        bg-black/50

        p-4
      "
    >
      <div
        className="
          card

          w-full
          max-w-md
        "
      >
        <h3 className="text-title mb-3">
          {title}
        </h3>

        <p className="text-body mb-6">
          {message}
        </p>

        <div
          className="
            flex
            justify-end
            gap-3
          "
        >
          <button
            onClick={onCancel}
            disabled={loading}
            className="
              h-control
              px-5

              rounded-control

              border
              border-border
            "
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="
              h-control
              px-5

              rounded-control

              bg-red-500

              text-white
            "
          >
            {loading
              ? "Deleting..."
              : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;