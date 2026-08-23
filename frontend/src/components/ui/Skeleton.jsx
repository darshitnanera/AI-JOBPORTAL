import React from "react";

const Skeleton = React.forwardRef(
  ({
    variant = "default",
    width = "w-full",
    height = "h-4",
    className = "",
    count = 1,
    ...props
  },
  ref,
) => {
  const variantClasses = {
    default: "bg-neutral-200 dark:bg-neutral-800",
    shimmer:
      "bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 animate-pulse",
  };

  const baseClasses = `rounded-lg ${variantClasses[variant] || variantClasses.default}`;

  if (count > 1) {
    return (
      <div className={className} {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? ref : null}
            className={`${baseClasses} ${width} ${height} mb-3 last:mb-0`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${width} ${height} ${className}`}
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";

export default Skeleton;
