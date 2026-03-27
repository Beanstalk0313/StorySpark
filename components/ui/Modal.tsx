import React from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  onCancel,
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  // Use a different button variant for deletion confirmation
  const confirmButtonVariant = title.toLowerCase().includes('delete') ? 'danger' : 'primary';

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // Close on overlay click
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-6 rounded-lg max-w-md w-full shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{title}</h3>
        <div className="text-slate-600 dark:text-slate-300 mb-6">{children}</div>
        <div className="flex gap-4 mt-6 justify-end">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          {onConfirm && (
            <Button onClick={onConfirm} variant={confirmButtonVariant}>
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;