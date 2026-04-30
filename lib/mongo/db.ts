import dns from "node:dns";
import mongoose from "mongoose";

let connected = false;

async function ensureApplicationIndexes(): Promise<void> {
  if (process.env.MONGO_ENSURE_INDEXES === "false") {
    return;
  }

  const started = Date.now();
  try {
    const { User } = await import("@/lib/mongo/models/User");
    await User.createIndexes();
    console.log(`[db] Ensured Mongo indexes in ${Date.now() - started}ms`);
  } catch (error) {
    console.warn("[db] Mongo index ensure failed:", error instanceof Error ? error.message : String(error));
  }
}

export async function connectDB(): Promise<void> {
  if (connected) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  const mongoDbName = process.env.MONGO_DB_NAME || "manage";
  const dnsServers = process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1";

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in environment");
  }

  try {
    await mongoose.connect(mongoUri, { dbName: mongoDbName });
  } catch (error) {
    const maybe = error as { code?: string; syscall?: string };
    const isDnsRefused =
      maybe?.code === "ECONNREFUSED" && ["querySrv", "queryA", "queryAAAA"].includes(String(maybe?.syscall || ""));

    if (!isDnsRefused) {
      throw error;
    }

    const fallbackServers = dnsServers
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (fallbackServers.length === 0) {
      throw error;
    }

    console.warn(
      `[db] DNS lookup failed (${maybe.syscall} ${maybe.code}). Retrying with DNS servers: ${fallbackServers.join(", ")}`
    );

    dns.setServers(fallbackServers);
    await mongoose.connect(mongoUri, { dbName: mongoDbName });
  }

  connected = true;
  await ensureApplicationIndexes();

  mongoose.connection.on("disconnected", () => {
    connected = false;
    console.warn("[db] MongoDB disconnected");
  });

  mongoose.connection.on("error", (error) => {
    console.error("[db] MongoDB error:", error.message);
  });
}
