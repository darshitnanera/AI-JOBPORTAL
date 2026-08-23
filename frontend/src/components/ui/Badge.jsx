import React from "react";

const Badge = React.forwardRef(
  ({ variant = "neutral", size = "md", className = "", children, ...props }, ref) => {
    const variantClasses = {
      success:
        "bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-200 border border-success-300 dark:border-success-700",
      warning:
        "bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-200 border border-warning-300 dark:border-warning-700",
      danger:
        "bg-error-100 text-error-800 dark:bg-error-950 dark:text-error-200 border border-error-300 dark:border-error-700",
      neutral:
        "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600",
      primary:
        "bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200 border border-primary-300 dark:border-primary-700",
      secondary:
        "bg-secondary-100 text-secondary-800 dark:bg-secondary-950 dark:text-secondary-200 border border-secondary-300 dark:border-secondary-700",
    };

    const sizeClasses = {
      sm: "px-2 py-1 text-xs font-medium rounded",
      md: "px-3 py-1.5 text-sm font-medium rounded-md",
      lg: "px-4 py-2 text-base font-semibold rounded-lg",
    };

    const baseClasses = "inline-flex items-center gap-1.5 font-medium";

    return (
      <span
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant] || variantClasses.neutral} ${sizeClasses[size] || sizeClasses.md} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
