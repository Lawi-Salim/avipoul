import "dotenv/config";
import { exec as execCb } from "child_process";
import { mkdir, readdir, stat, unlink, appendFile } from "fs/promises";
import { join, resolve, dirname } from "path";
import { promisify } from "util";
import { createGzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const execAsync = promisify(execCb);

// ── Configuration ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = resolve(__dirname, "..");
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS ?? "30", 10);

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.slice(1),
    user: parsed.username,
    password: parsed.password,
  };
}

// ── Logger ───────────────────────────────────────────────────────────────────
const LOG_DIR = join(BACKEND_DIR, "backups", "logs");

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

type Level = "INFO" | "WARN" | "ERROR";

async function log(level: Level, message: string) {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line);
  await ensureDir(LOG_DIR);
  await appendFile(join(LOG_DIR, "backup.log"), line + "\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  // 1. Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    await log("ERROR", "DATABASE_URL is not defined");
    process.exit(1);
  }

  const db = parseDatabaseUrl(databaseUrl);
  await log("INFO", `Starting backup for database "${db.database}" on ${db.host}:${db.port}`);

  // 2. Ensure backup directory exists
  const backupDir = join(BACKEND_DIR, "backups");
  await ensureDir(backupDir);
  await ensureDir(LOG_DIR);

  // 3. Generate filenames
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dumpFilename = `avipoul-backup-${timestamp}.sql`;
  const gzFilename = `${dumpFilename}.gz`;
  const dumpPath = join(backupDir, dumpFilename);
  const gzPath = join(backupDir, gzFilename);

  // 4. Run pg_dump
  await log("INFO", "Running pg_dump...");
  const pgDumpCmd = [
    "pg_dump",
    `-h ${db.host}`,
    `-p ${db.port}`,
    `-U ${db.user}`,
    `-d ${db.database}`,
    "-F p", // Plain SQL (compatible with psql)
    `-f "${dumpPath}"`,
  ].join(" ");

  try {
    await execAsync(pgDumpCmd, {
      env: { ...process.env, PGPASSWORD: db.password },
      maxBuffer: 50 * 1024 * 1024, // 50 MB
    });
  } catch (err: any) {
    await log("ERROR", `pg_dump failed: ${err.stderr ?? err.message}`);
    process.exit(1);
  }

  // 5. Compress with gzip
  await log("INFO", "Compressing dump file...");
  try {
    await pipeline(
      createReadStream(dumpPath),
      createGzip(),
      createWriteStream(gzPath),
    );
    // Remove uncompressed dump
    await unlink(dumpPath);
  } catch (err: any) {
    await log("ERROR", `Compression failed: ${err.message}`);
    process.exit(1);
  }

  // 6. Get file size
  const stats = await stat(gzPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  // 7. Clean old backups
  await log("INFO", `Cleaning backups older than ${RETENTION_DAYS} days...`);
  const cleaned = await cleanOldBackups(backupDir, RETENTION_DAYS);
  await log("INFO", `Removed ${cleaned} old backup(s)`);

  // 8. Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  await log("INFO", "─".repeat(50));
  await log("INFO", `  Backup completed successfully!`);
  await log("INFO", `  File: ${gzPath}`);
  await log("INFO", `  Size: ${sizeMB} MB`);
  await log("INFO", `  Duration: ${duration}s`);
  await log("INFO", "─".repeat(50));
}

async function cleanOldBackups(backupDir: string, retentionDays: number): Promise<number> {
  const files = await readdir(backupDir);
  const now = Date.now();
  let removed = 0;

  for (const file of files) {
    if (!file.startsWith("avipoul-backup-") || !file.endsWith(".sql.gz")) continue;

    const filePath = join(backupDir, file);
    const fileStat = await stat(filePath);
    const ageMs = now - fileStat.mtimeMs;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays > retentionDays) {
      await unlink(filePath);
      await log("INFO", `Removed old backup: ${file} (${Math.floor(ageDays)} days old)`);
      removed++;
    }
  }

  return removed;
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
