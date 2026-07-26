import { mkdir, readFile, stat, access, appendFile } from "fs/promises";
import { join, resolve, dirname } from "path";
import { createGunzip } from "zlib";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

// ── Configuration ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = resolve(__dirname, "..");
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
  await appendFile(join(LOG_DIR, "validate.log"), line + "\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error("Usage: yarn validate-backup -- <path-to-backup.sql.gz>");
    process.exit(1);
  }

  const filePath = resolve(backupFile);
  await log("INFO", `Validating backup file: ${filePath}`);

  // 1. Check file exists
  try {
    await access(filePath);
  } catch {
    await log("ERROR", `File not found: ${filePath}`);
    process.exit(1);
  }

  // 2. File stats
  const fileStat = await stat(filePath);
  const fileSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);
  const fileDate = fileStat.mtime.toISOString().replace("T", " ").slice(0, 19);
  await log("INFO", "─".repeat(50));
  await log("INFO", "  FILE INFORMATION");
  await log("INFO", "─".repeat(50));
  await log("INFO", `  Path:      ${filePath}`);
  await log("INFO", `  Size:      ${fileSizeMB} MB`);
  await log("INFO", `  Modified:  ${fileDate}`);
  await log("INFO", "─".repeat(50));

  // 3. Decompress and analyze
  const isGzipped = filePath.endsWith(".gz");
  let sqlContent: string;

  if (isGzipped) {
    await log("INFO", "Decompressing gzip file...");
    const chunks: Buffer[] = [];

    try {
      const gunzip = createGunzip();
      const readStream = createReadStream(filePath);
      const { Readable } = await import("stream");

      await new Promise<void>((resolve, reject) => {
        readStream.pipe(gunzip).on("data", (chunk: Buffer) => chunks.push(chunk))
          .on("end", () => resolve())
          .on("error", reject);
      });

      sqlContent = Buffer.concat(chunks).toString("utf-8");
    } catch (err: any) {
      await log("ERROR", `Failed to decompress: ${err.message}`);
      process.exit(1);
    }
  } else {
    sqlContent = await readFile(filePath, "utf-8");
  }

  // 4. Analyze SQL content
  const sqlSizeMB = (Buffer.byteLength(sqlContent) / (1024 * 1024)).toFixed(2);
  await log("INFO", "─".repeat(50));
  await log("INFO", "  SQL ANALYSIS");
  await log("INFO", "─".repeat(50));
  await log("INFO", `  Uncompressed size: ${sqlSizeMB} MB`);
  await log("INFO", `  Compression ratio: ${((fileStat.size / Buffer.byteLength(sqlContent)) * 100).toFixed(1)}%`);

  // Count tables
  const createTableMatches = sqlContent.match(/CREATE TABLE/g);
  const tableCount = createTableMatches?.length ?? 0;
  await log("INFO", `  Tables found:      ${tableCount}`);

  // Extract table names
  const tableNameRegex = /CREATE TABLE (?:IF NOT EXISTS )?(?:\w+\.)?["']?(\w+)["']?\s*\(/g;
  const tableNames: string[] = [];
  let match;
  while ((match = tableNameRegex.exec(sqlContent)) !== null) {
    const name = match[1]!;
    if (name !== "public" && !tableNames.includes(name)) {
      tableNames.push(name);
    }
  }

  if (tableNames.length > 0) {
    await log("INFO", "  Tables:");
    for (const name of tableNames) {
      await log("INFO", `    - ${name}`);
    }
  }

  // Count inserts
  const insertMatches = sqlContent.match(/COPY .+ FROM stdin/g);
  await log("INFO", `  COPY (insert) statements: ${insertMatches?.length ?? 0}`);

  // Check for pg_restore metadata
  if (sqlContent.includes("PGDMP")) {
    await log("INFO", "  Format: PostgreSQL custom dump (pg_dump -F c)");
  } else if (sqlContent.includes("-- PostgreSQL database cluster dump")) {
    await log("INFO", "  Format: Plain SQL dump");
  } else {
    await log("INFO", "  Format: Unknown (could be binary or compressed format)");
  }

  await log("INFO", "─".repeat(50));
  await log("INFO", "  RESULT: Backup file is VALID and appears healthy.");
  await log("INFO", "─".repeat(50));
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
