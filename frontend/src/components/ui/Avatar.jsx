import React from "react";
import { User } from "lucide-react";

const Avatar = React.forwardRef(
  ({ src = null, alt = "Avatar", size = "md", className = "", fallback = null, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    const baseClasses =
      "inline-flex items-center justify-center rounded-full font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200";

    if (src) {
      return (
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${className} object-cover`}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${className}`}
        {...props}
      >
        {fallback || <User size={20} />}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export default Avatar;
