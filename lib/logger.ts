import fs from "fs";
import path from "path";

// ponytail: daily file logs — zero dependencies, works offline.
// In production, transition to Grafana/Loki (ship logs as NDJSON to a collector)
// or swap this module for @sentry/nextjs. The call-sites don't change.
const LOGS_DIR = path.join(process.cwd(), "logs");

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return now().slice(0, 10);
}

function write(level: "INFO" | "WARN" | "ERROR", source: string, message: string, extra?: string): void {
  const line = `[${now()}] ${level} [${source}] ${message}${extra ? `\n${extra}` : ""}\n`;

  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOGS_DIR, `${today()}.log`), line);
  } catch {
    // fallback to console if fs is unavailable (e.g. read-only deploy)
  }

  // Mirror to console so dev tools / docker logs still show it
  if (level === "ERROR") console.error(line.trimEnd());
  else if (level === "WARN") console.warn(line.trimEnd());
  else console.log(line.trimEnd());
}

export const logger = {
  info:  (source: string, message: string)                      => write("INFO",  source, message),
  warn:  (source: string, message: string)                      => write("WARN",  source, message),
  error: (source: string, message: string, stack?: string)      => write("ERROR", source, message, stack),
};
