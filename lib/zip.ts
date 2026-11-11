import AdmZip from "adm-zip";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const MAX_UNCOMPRESSED_BYTES = 1024 * 1024 * 1024; // 1 GB
export const MAX_ENTRIES = 50_000;

const S_IFMT = 0o170000;
const S_IFLNK = 0o120000;

export class UnsafeArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeArchiveError";
  }
}

/**
 * Extracts an uploaded ZIP into `destDir` without trusting the archive:
 * - rejects absolute paths and `..` segments (zip slip)
 * - rejects symlink entries (they could point outside the site directory)
 * - caps entry count and total uncompressed size (zip bombs), counting the
 *   real decompressed bytes, not the size the archive declares
 * - writes regular files with mode 0644 and directories with 0755, so SUID/SGID
 *   or executable bits from the archive are never applied
 *
 * Returns the list of extracted entry names.
 */
export async function safeExtractZip(zipPath: string, destDir: string): Promise<string[]> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  if (entries.length > MAX_ENTRIES) {
    throw new UnsafeArchiveError(`Archive has too many files (max ${MAX_ENTRIES}).`);
  }

  const root = path.resolve(destDir);
  await mkdir(root, { recursive: true, mode: 0o755 });

  let totalBytes = 0;
  const names: string[] = [];

  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, "/");

    if (name.startsWith("/") || /^[a-zA-Z]:/.test(name) || name.split("/").includes("..")) {
      throw new UnsafeArchiveError(`Archive contains an unsafe path: ${name}`);
    }

    const unixMode = (entry.attr >>> 16) & 0xffff;
    if ((unixMode & S_IFMT) === S_IFLNK) {
      throw new UnsafeArchiveError(`Archive contains a symbolic link: ${name}`);
    }

    const target = path.resolve(root, name);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new UnsafeArchiveError(`Archive contains an unsafe path: ${name}`);
    }

    if (entry.isDirectory) {
      await mkdir(target, { recursive: true, mode: 0o755 });
      continue;
    }

    if (entry.header.size > MAX_UNCOMPRESSED_BYTES - totalBytes) {
      throw new UnsafeArchiveError("Archive is too large when extracted (max 1 GB).");
    }

    const data = entry.getData();
    totalBytes += data.length;
    if (totalBytes > MAX_UNCOMPRESSED_BYTES) {
      throw new UnsafeArchiveError("Archive is too large when extracted (max 1 GB).");
    }

    await mkdir(path.dirname(target), { recursive: true, mode: 0o755 });
    await writeFile(target, data, { mode: 0o644 });
    names.push(name);
  }

  return names;
}
