import "dotenv/config";
import { exec as execCb } from "child_process";
import { mkdir, readFile, appendFile, access, unlink } from "fs/promises";
import { join, resolve, dirname } from "path";
import { promisify } from "util";
import { createGunzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const execAsync = promisify(execCb);

// ── Configuration ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = resolve(__dirname, "..");

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
  await appendFile(join(LOG_DIR, "restore.log"), line + "\n");
}

// ── CLI Argument Parsing ─────────────────────────────────────────────────────
interface RestoreOptions {
  file: string | null;
  dryRun: boolean;
  noBackup: boolean;
}

function parseArgs(): RestoreOptions {
  const args = process.argv.slice(2);
  const options: RestoreOptions = { file: null, dryRun: false, noBackup: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--file":
        options.file = args[++i] ?? null;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--no-backup":
        options.noBackup = true;
        break;
    }
  }

  return options;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  const options = parseArgs();

  if (!options.file) {
    console.error("Usage: yarn restore -- --file <path-to-backup.sql.gz> [--dry-run] [--no-backup]");
    process.exit(1);
  }

  const backupFile = resolve(options.file);
  await log("INFO", `Restore request for file: ${backupFile}`);
  if (options.dryRun) await log("WARN", "DRY-RUN MODE — no changes will be made");
  if (options.noBackup) await log("WARN", "Pre-restore backup SKIPPED (--no-backup)");

  // 1. Verify backup file exists
  try {
    await access(backupFile);
  } catch {
    await log("ERROR", `Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  // 2. Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    await log("ERROR", "DATABASE_URL is not defined");
    process.exit(1);
  }

  const db = parseDatabaseUrl(databaseUrl);
  await log("INFO", `Target database: "${db.database}" on ${db.host}:${db.port}`);

  // 3. Decompress if .gz
  let sqlFile: string;
  const isGzipped = backupFile.endsWith(".gz");

  if (isGzipped) {
    await log("INFO", "Decompressing backup file...");
    sqlFile = backupFile.replace(/\.gz$/, "");

    if (!options.dryRun) {
      try {
        await pipeline(
          createReadStream(backupFile),
          createGunzip(),
          createWriteStream(sqlFile),
        );
      } catch (err: any) {
        await log("ERROR", `Decompression failed: ${err.message}`);
        process.exit(1);
      }
    } else {
      // In dry-run, still decompress to validate content
      sqlFile = join(BACKEND_DIR, "backups", ".tmp-restore-preview.sql");
      try {
        await pipeline(
          createReadStream(backupFile),
          createGunzip(),
          createWriteStream(sqlFile),
        );
      } catch (err: any) {
        await log("ERROR", `Decompression failed (dry-run): ${err.message}`);
        process.exit(1);
      }
    }
  } else {
    sqlFile = backupFile;
  }

  // 4. Validate SQL content
  await log("INFO", "Validating SQL file content...");
  const sqlContent = await readFile(sqlFile, "utf-8");
  const sqlSize = (Buffer.byteLength(sqlContent) / (1024 * 1024)).toFixed(2);
  await log("INFO", `SQL file size: ${sqlSize} MB`);

  // Count tables in dump
  const tableMatches = sqlContent.match(/CREATE TABLE/g);
  await log("INFO", `Tables found in dump: ${tableMatches?.length ?? 0}`);

  if (options.dryRun) {
    await log("INFO", "─".repeat(50));
    await log("INFO", "  DRY-RUN SUMMARY");
    await log("INFO", `  File: ${backupFile}`);
    await log("INFO", `  SQL size: ${sqlSize} MB`);
    await log("INFO", `  Tables in dump: ${tableMatches?.length ?? 0}`);
    await log("INFO", "  No changes were made to the database.");
    await log("INFO", "─".repeat(50));
    return;
  }

  // 5. Create pre-restore backup (safety net)
  if (!options.noBackup) {
    await log("INFO", "Creating pre-restore backup...");
    try {
      const preRestoreTimestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const preRestoreFile = join(BACKEND_DIR, "backups", `avipoul-pre-restore-${preRestoreTimestamp}.sql`);

      const pgDumpCmd = [
        "pg_dump",
        `-h ${db.host}`,
        `-p ${db.port}`,
        `-U ${db.user}`,
        `-d ${db.database}`,
        "-F p",
        `-f "${preRestoreFile}"`,
      ].join(" ");

      await execAsync(pgDumpCmd, {
        env: { ...process.env, PGPASSWORD: db.password },
        maxBuffer: 50 * 1024 * 1024,
      });
      await log("INFO", `Pre-restore backup saved: ${preRestoreFile}`);
    } catch (err: any) {
      await log("WARN", `Pre-restore backup failed: ${err.stderr ?? err.message}`);
      await log("WARN", "Continuing with restore...");
    }
  }

  // 6. Restore with psql
  await log("INFO", "Restoring database...");
  const psqlCmd = [
    "psql",
    `-h ${db.host}`,
    `-p ${db.port}`,
    `-U ${db.user}`,
    `-d ${db.database}`,
    `-f "${sqlFile}"`,
    "--set ON_ERROR_STOP=on",
  ].join(" ");

  try {
    await execAsync(psqlCmd, {
      env: { ...process.env, PGPASSWORD: db.password },
      maxBuffer: 50 * 1024 * 1024,
    });
    await log("INFO", "Database restore command executed successfully");
  } catch (err: any) {
    await log("ERROR", `Restore failed: ${err.stderr ?? err.message}`);
    await log("INFO", "You can restore from the pre-restore backup if needed.");
    process.exit(1);
  }

  // 7. Post-restore verification
  await log("INFO", "Running post-restore verification...");
  const tables = ["cycles", "ventes", "clients", "mortalites", "depenses"];
  await log("INFO", "─".repeat(50));
  await log("INFO", "  TABLE RECORD COUNTS");
  await log("INFO", "─".repeat(50));

  for (const table of tables) {
    try {
      const { stdout } = await execAsync(
        `psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -t -A -c "SELECT COUNT(*) FROM ${table};"`,
        { env: { ...process.env, PGPASSWORD: db.password } },
      );
      const count = stdout.trim();
      await log("INFO", `  ${table.padEnd(15)} ${count} rows`);
    } catch {
      await log("WARN", `  ${table.padEnd(15)} (table not found or empty)`);
    }
  }
  await log("INFO", "─".repeat(50));

  // 8. Cleanup decompressed temp file
  if (isGzipped) {
    try {
      await unlink(sqlFile);
      await log("INFO", "Cleaned up temporary decompressed file");
    } catch {
      // Ignore cleanup errors
    }
  }

  // 9. Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  await log("INFO", "─".repeat(50));
  await log("INFO", "  Restore completed successfully!");
  await log("INFO", `  Source: ${backupFile}`);
  await log("INFO", `  Duration: ${duration}s`);
  await log("INFO", "─".repeat(50));
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
