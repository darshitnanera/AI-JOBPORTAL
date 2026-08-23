/**
 * Local development MongoDB.
 *
 * The project's MONGO_URI points at mongodb://localhost:27017, but this
 * machine has no system mongod and no usable Docker daemon. This script
 * starts a real MongoDB server on that exact port, backed by a directory on
 * disk so data survives restarts.
 *
 * Usage:  node scripts/dev-mongo.js
 * Stop:   Ctrl-C (or kill the process)
 *
 * This is a development convenience only — production uses the real
 * MONGO_URI from the environment and never runs this file.
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", ".dev-mongo-data");
const PORT = 27017;

fs.mkdirSync(DB_PATH, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: {
    port: PORT,
    dbPath: DB_PATH,
    storageEngine: "wiredTiger",
  },
});

console.log(`[dev-mongo] listening on ${server.getUri()}`);
console.log(`[dev-mongo] data directory: ${DB_PATH}`);
console.log("[dev-mongo] press Ctrl-C to stop");

const shutdown = async (signal) => {
  console.log(`\n[dev-mongo] ${signal} received, shutting down...`);
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
