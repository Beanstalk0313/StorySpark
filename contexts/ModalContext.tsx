
import React, { createContext, useContext, useState, ReactNode } from 'react';
import Modal from '../components/ui/Modal';

interface ModalOptions {
  title: string;
  message: ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  onCancel?: () => void;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
  };

  const hideModal = () => {
    setModalOptions(null);
  };

  const handleConfirm = () => {
    if (modalOptions?.onConfirm) {
      modalOptions.onConfirm();
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modalOptions?.onCancel) {
      modalOptions.onCancel();
    }
    hideModal();
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalOptions && (
        <Modal
          isOpen={true}
          onClose={hideModal}
          title={modalOptions.title}
          confirmText={modalOptions.confirmText}
          onConfirm={handleConfirm}
          cancelText={modalOptions.cancelText}
          onCancel={modalOptions.cancelText ? handleCancel : undefined}
        >
          {modalOptions.message}
        </Modal>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
