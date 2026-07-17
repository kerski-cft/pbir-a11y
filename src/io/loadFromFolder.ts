// Folder loader — the one genuinely new piece of I/O in this CLI.
//
// The original tool only ever received a .zip via a browser file-drop, so
// pbirParser.ts/pbixParser.ts were written against JSZip. Real PBIP/PBIR
// projects live on disk as a plain folder tree (that's the whole point —
// it's git-diffable). Rather than requiring the user to zip a folder before
// every CLI run, we walk the folder ourselves and build an in-memory JSZip
// that looks identical to what the browser tool would have unzipped. From
// that point on, parsePbirFromZip / buildReportFromLayout run completely
// unchanged — no logic was touched, only how the bytes get into a JSZip.

import * as fs from "node:fs";
import * as path from "node:path";
import JSZip from "jszip";
import { parsePbirFromZip, PBIRParseError, type PBIRParseResult } from "../lib/pbirParser";

const IGNORE_DIRS = new Set([".git", "node_modules", ".pbi", ".vscode"]);

function walkDir(dir: string, base: string, zip: JSZip): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const zipPath = path.posix.join(base, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath, zipPath, zip);
    } else if (entry.isFile()) {
      zip.file(zipPath, fs.readFileSync(fullPath));
    }
  }
}

/**
 * Locates the report's PBIR root within a PBIP project.
 *
 * A PBIP project folder looks like:
 *   MyReport.pbip
 *   MyReport.Report/
 *     definition/
 *       report.json
 *       pages/<page>/page.json
 *       pages/<page>/visuals/<id>/visual.json
 *   MyReport.SemanticModel/
 *
 * If the given path is already a `*.Report` folder (or its `definition`
 * subfolder), we use it directly. If it's the top-level PBIP folder (or the
 * folder containing the .pbip file), we look for the single `*.Report`
 * subfolder ourselves so the user can just point the CLI at the project.
 */
export function resolveReportRoot(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new PBIRParseError(`Path does not exist: ${resolved}`);
  }

  const base = path.basename(resolved);
  if (base.endsWith(".Report")) return resolved;

  // Already pointed at a definition/ folder or similar — use as-is.
  if (fs.existsSync(path.join(resolved, "report.json")) ||
      fs.existsSync(path.join(resolved, "definition"))) {
    return resolved;
  }

  // Otherwise assume `resolved` is the PBIP project directory and look for
  // exactly one *.Report subfolder inside it.
  const children = fs.readdirSync(resolved, { withFileTypes: true });
  const reportDirs = children.filter((c) => c.isDirectory() && c.name.endsWith(".Report"));

  if (reportDirs.length === 1) {
    return path.join(resolved, reportDirs[0].name);
  }
  if (reportDirs.length > 1) {
    throw new PBIRParseError(
      `Multiple *.Report folders found under ${resolved}. Point the CLI at the specific one, e.g. "MyReport.Report".`,
    );
  }

  // Fall back to treating the given path as the report root itself.
  return resolved;
}

/**
 * Reads a PBIP/PBIR project from a folder on disk and runs it through the
 * same parsing + normalisation logic as the browser tool.
 */
export async function loadPbirFromFolder(inputPath: string): Promise<PBIRParseResult> {
  const reportRoot = resolveReportRoot(inputPath);

  const zip = new JSZip();
  walkDir(reportRoot, "", zip);

  const sourceName = path.basename(reportRoot);
  let sourceSize = 0;
  for (const relPath of Object.keys(zip.files)) {
    const f = zip.files[relPath];
    if (!f.dir) {
      // Rough size for display purposes only — not used in any check logic.
      sourceSize += (f as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    }
  }

  return parsePbirFromZip(zip, sourceName, sourceSize);
}
