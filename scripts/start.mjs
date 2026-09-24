/**
 * Starts the standalone server on any platform. Replaces the previous
 * `NODE_ENV=production node ...` prefix, which is POSIX-shell only.
 */
import { resolve } from "node:path";

process.env.NODE_ENV ??= "production";
process.env.PORT ??= "3000";
process.env.HOSTNAME ??= "0.0.0.0";

const server = resolve(import.meta.dirname, "..", ".next", "standalone", "server.js");
await import(`file://${server}`);
