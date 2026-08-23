import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const Select = React.forwardRef(
  (
    {
      options = [],
      value = null,
      onChange = () => {},
      label = null,
      placeholder = "Select an option",
      disabled = false,
      className = "",
      error = null,
      size = "md",
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const selectedOption = options.find((opt) => opt.value === value);

    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-4 py-3 text-lg",
    };

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    const errorClasses = error
      ? "border-error-500 bg-error-50 dark:bg-error-950 dark:border-error-700"
      : "";

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full flex items-center justify-between rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${errorClasses}`}
            {...props}
          >
            <span className={selectedOption ? "" : "text-neutral-500"}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              size={20}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg z-10 animate-slide-up">
              <div className="max-h-64 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2 transition-colors duration-150 ${
                      value === option.value
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-error-600 dark:text-error-400 mt-1">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
