import React, { useState } from "react";

const Tabs = React.forwardRef(
  (
    {
      tabs = [],
      defaultValue = null,
      onChange = () => {},
      variant = "default",
      className = "",
      ...props
    },
    ref,
  ) => {
    const defaultTab = defaultValue || tabs[0]?.value;
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabChange = (value) => {
      setActiveTab(value);
      onChange(value);
    };

    const variantClasses = {
      default:
        "border-b border-neutral-200 dark:border-neutral-800 gap-1",
      pills:
        "gap-2 flex-wrap",
    };

    const tabButtonClasses = {
      default:
        "px-4 py-2 border-b-2 font-medium text-sm transition-colors",
      defaultActive:
        "border-b-primary-600 text-primary-600 dark:text-primary-400",
      defaultInactive:
        "border-b-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200",
      pills:
        "px-4 py-2 rounded-full font-medium text-sm transition-colors border",
      pillsActive:
        "bg-primary-600 text-white border-primary-600",
      pillsInactive:
        "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700",
    };

    return (
      <div ref={ref} className={className} {...props}>
        <div
          className={`flex ${variantClasses[variant] || variantClasses.default}`}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`${
                variant === "pills"
                  ? tabButtonClasses.pills
                  : tabButtonClasses.default
              } ${
                activeTab === tab.value
                  ? variant === "pills"
                    ? tabButtonClasses.pillsActive
                    : tabButtonClasses.defaultActive
                  : variant === "pills"
                    ? tabButtonClasses.pillsInactive
                    : tabButtonClasses.defaultInactive
              }`}
              role="tab"
              aria-selected={activeTab === tab.value}
              aria-controls={`tab-panel-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabs.map((tab) => (
          <div
            key={`panel-${tab.value}`}
            id={`tab-panel-${tab.value}`}
            role="tabpanel"
            hidden={activeTab !== tab.value}
            className={activeTab === tab.value ? "animate-fade-in" : "hidden"}
          >
            {activeTab === tab.value && tab.content}
          </div>
        ))}
      </div>
    );
  },
);

Tabs.displayName = "Tabs";

export default Tabs;
