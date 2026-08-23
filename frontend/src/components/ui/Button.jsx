import React from "react";

const Button = React.forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      disabled = false,
      isLoading = false,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-400",
      secondary:
        "bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 disabled:bg-neutral-400",
      tertiary:
        "bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400 disabled:bg-neutral-300",
      danger:
        "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 disabled:bg-neutral-400",
      outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 disabled:border-neutral-400 disabled:text-neutral-400",
      ghost:
        "text-primary-600 hover:bg-primary-50 active:bg-primary-100 disabled:text-neutral-400",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm font-medium rounded-lg",
      md: "px-4 py-2 text-base font-medium rounded-lg",
      lg: "px-6 py-3 text-lg font-semibold rounded-xl",
      xl: "px-8 py-4 text-xl font-semibold rounded-xl",
    };

    const baseClasses =
      "inline-flex items-center justify-center gap-2 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-ring";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
