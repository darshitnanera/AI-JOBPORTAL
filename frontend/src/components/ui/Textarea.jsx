import React from "react";

const Textarea = React.forwardRef(
  (
    {
      variant = "default",
      size = "md",
      disabled = false,
      hasError = false,
      className = "",
      label = null,
      error = null,
      helpText = null,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      default:
        "border border-neutral-300 bg-white dark:bg-neutral-900 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500",
      filled:
        "border-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500",
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-4 py-3 text-lg",
    };

    const errorClasses = hasError
      ? "border-error-500 bg-error-50 dark:bg-error-950 dark:border-error-700"
      : "";

    const baseClasses =
      "w-full rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed font-sans";

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          rows={rows}
          className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${sizeClasses[size] || sizeClasses.md} ${errorClasses} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-error-600 dark:text-error-400 mt-1">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{helpText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
