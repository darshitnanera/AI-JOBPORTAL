import React from "react";

const Card = React.forwardRef(
  ({ variant = "default", hoverable = false, className = "", children, ...props }, ref) => {
    const variantClasses = {
      default:
        "bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800",
      elevated: "bg-white shadow-md dark:bg-neutral-900",
      "elevated-lg": "bg-white shadow-lg dark:bg-neutral-900",
      outlined: "border-2 border-neutral-300 dark:border-neutral-700",
    };

    const hoverableClasses = hoverable
      ? "hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      : "";

    const baseClasses = "rounded-xl p-6";

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${hoverableClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
));

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className = "", children, ...props }, ref) => (
  <h3 ref={ref} className={`text-xl font-semibold text-neutral-900 dark:text-neutral-100 ${className}`} {...props}>
    {children}
  </h3>
));

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className = "", children, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-neutral-600 dark:text-neutral-400 mt-1 ${className}`} {...props}>
    {children}
  </p>
));

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`${className}`} {...props}>
    {children}
  </div>
));

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`mt-6 flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 ${className}`} {...props}>
    {children}
  </div>
));

CardFooter.displayName = "CardFooter";

export default Card;
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
