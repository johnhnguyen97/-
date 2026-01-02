import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description/subtitle */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Children */
  children: React.ReactNode;
  /** Additional class for modal content */
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  header,
  footer,
  children,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
          'transform transition-all duration-200',
          isVisible
            ? 'scale-100 translate-y-0'
            : 'scale-95 translate-y-4',
          sizeStyles[size],
          'max-h-[90vh] flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button for compound component usage */}
        {showCloseButton && !header && !title && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-xl transition-all z-10',
              'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/50'
            )}
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Header - legacy prop-based */}
        {(header || title) && (
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            {header || (
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'ml-4 p-2 rounded-xl transition-all',
                  'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-amber-500/50'
                )}
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body - compound components or raw children */}
        {children}

        {/* Footer - legacy prop-based */}
        {footer && (
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// Confirm Dialog (specialized modal)
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-xl font-medium transition-all',
              'text-gray-600 hover:bg-gray-100',
              'dark:text-gray-400 dark:hover:bg-gray-800',
              'disabled:opacity-50'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-xl font-medium transition-all',
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white',
              'disabled:opacity-50'
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </Modal>
  );
};

// Compound components for flexible modal composition
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => (
  <div className={cn('flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800', className)}>
    {children}
  </div>
);

export interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalTitle: React.FC<ModalTitleProps> = ({ children, className }) => (
  <h2 className={cn('text-lg sm:text-xl font-semibold text-gray-900 dark:text-white', className)}>
    {children}
  </h2>
);

export interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalDescription: React.FC<ModalDescriptionProps> = ({ children, className }) => (
  <p className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', className)}>
    {children}
  </p>
);

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({ children, className }) => (
  <div className={cn('flex-1 overflow-y-auto p-4 sm:p-6', className)}>
    {children}
  </div>
);

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div className={cn('p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3', className)}>
    {children}
  </div>
);

export default Modal;
