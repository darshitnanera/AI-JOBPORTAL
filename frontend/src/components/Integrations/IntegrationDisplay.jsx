import React from "react";
import DeveloperActivity from "./DeveloperActivity";

/**
 * Read-only view of a candidate's connected platforms.
 *
 * Kept for backwards compatibility with the documented props
 * (`integrations`, `candidateName`); the rendering is now delegated to
 * <DeveloperActivity />, which enforces the "never fabricate a stat" rule.
 *
 * NOTE: the former IntegrationDisplay.css was deleted — its rules were
 * unlayered plain CSS, which outranks every Tailwind utility.
 */
const IntegrationDisplay = ({
  integrations,
  candidateName,
  loading = false,
  error = "",
  onRetry,
}) => (
  <DeveloperActivity
    integrations={integrations}
    loading={loading}
    error={error}
    onRetry={onRetry}
    title="Developer activity"
    description={
      candidateName
        ? `Verified external profiles and credentials for ${candidateName}.`
        : "Verified external profiles and credentials."
    }
  />
);

export default IntegrationDisplay;
