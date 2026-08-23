import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { authHeaders } from "./integrationHelpers";

const EMPTY_INTEGRATIONS = {
  github: { connected: false },
  leetcode: { connected: false },
  linkedin: { connected: false },
};

/**
 * Loads the signed-in user's integrations.
 *
 * Endpoint and request shape are unchanged from the previous build:
 *   GET /api/integrations/profile   (Authorization: Bearer <token>)
 */
export const useIntegrations = ({ enabled = true } = {}) => {
  const [integrations, setIntegrations] = useState(EMPTY_INTEGRATIONS);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/integrations/profile", {
        headers: authHeaders(),
      });
      setIntegrations(response.data?.integration || EMPTY_INTEGRATIONS);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your connected accounts.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  return { integrations, loading, error, refresh, setIntegrations };
};

export { EMPTY_INTEGRATIONS };
export default useIntegrations;
