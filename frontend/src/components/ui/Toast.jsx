import React, { useEffect } from "react";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

const Toast = React.forwardRef(
  (
    {
      variant = "info",
      title = null,
      message = "",
      onClose = () => {},
      duration = 5000,
      className = "",
      isOpen = true,
      ...props
    },
    ref,
  ) => {
    useEffect(() => {
      if (!isOpen) return;

      if (duration > 0) {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
      }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const variantClasses = {
      success:
        "bg-success-100 dark:bg-success-950 text-success-900 dark:text-success-100 border border-success-300 dark:border-success-700",
      error:
        "bg-error-100 dark:bg-error-950 text-error-900 dark:text-error-100 border border-error-300 dark:border-error-700",
      warning:
        "bg-warning-100 dark:bg-warning-950 text-warning-900 dark:text-warning-100 border border-warning-300 dark:border-warning-700",
      info: "bg-primary-100 dark:bg-primary-950 text-primary-900 dark:text-primary-100 border border-primary-300 dark:border-primary-700",
    };

    const iconMap = {
      success: <CheckCircle size={20} className="flex-shrink-0" />,
      error: <AlertCircle size={20} className="flex-shrink-0" />,
      warning: <AlertTriangle size={20} className="flex-shrink-0" />,
      info: <Info size={20} className="flex-shrink-0" />,
    };

    return (
      <div
        ref={ref}
        className={`rounded-lg p-4 ${variantClasses[variant] || variantClasses.info} animate-slide-in ${className}`}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{iconMap[variant]}</div>
          <div className="flex-1">
            {title && <h3 className="font-semibold mb-1">{title}</h3>}
            <p className="text-sm">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
            aria-label="Close notification"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  },
);

Toast.displayName = "Toast";

export default Toast;
