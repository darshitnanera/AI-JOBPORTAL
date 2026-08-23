import cron from "node-cron";
import { syncAllLeetCodeData } from "./integrations.service.js";

/**
 * Initialize cron jobs for the application
 * Call this function from server.js during app startup
 */
export const initializeCronJobs = () => {
  // Sync LeetCode data every night at 2:00 AM
  // Format: "0 2 * * *" means 2:00 AM every day
  const leetcodeSyncJob = cron.schedule("0 2 * * *", async () => {
    console.log("[Cron Job] Starting nightly LeetCode data sync at", new Date());
    try {
      await syncAllLeetCodeData();
      console.log("[Cron Job] LeetCode data sync completed successfully");
    } catch (error) {
      console.error("[Cron Job] Error during LeetCode data sync:", error);
    }
  });

  console.log("[Cron Jobs] Initialized. LeetCode sync scheduled for 2:00 AM daily");

  return {
    leetcodeSyncJob,
  };
};

// Cron Job Patterns Reference:
// sec min hr  day mon dow
//   0   0  *   *   *   *   - Runs every day at midnight (00:00)
//   0   2  *   *   *   *   - Runs every day at 2:00 AM
//   0  *  *   *   *  [pattern] - Runs every N minutes
//   0   9  *   *   *  MON  - Runs every Monday at 9:00 AM
//   0   0  1   *   *   *   - Runs on the 1st of every month at midnight
