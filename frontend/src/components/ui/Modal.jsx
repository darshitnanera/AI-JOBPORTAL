import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = React.forwardRef(
  (
    {
      isOpen = false,
      onClose = () => {},
      title = null,
      size = "md",
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
    };

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
      }

      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in"
        onClick={onClose}
        role="presentation"
      >
        <div
          ref={ref}
          className={`${sizeClasses[size] || sizeClasses.md} w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-xl animate-slide-up ${className}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
