import type { ReactNode, MouseEvent } from "react";
import { createPortal } from "react-dom";

interface BaseDialogProps {
  isOpen: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  closeAriaLabel?: string;
}

export function BaseDialog({
  isOpen,
  title,
  onClose,
  children,
  footer,
  contentClassName,
  closeAriaLabel = "Close",
}: BaseDialogProps) {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const classes = ["dialog-content", contentClassName].filter(Boolean).join(" ");

  return createPortal(
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className={classes}>
        <div className="dialog-header">
          <h2>{title}</h2>
          <button className="dialog-close" onClick={onClose} aria-label={closeAriaLabel}>
            ×
          </button>
        </div>

        <div className="dialog-body">{children}</div>

        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
