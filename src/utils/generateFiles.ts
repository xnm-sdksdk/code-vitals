import fs from "fs";
import path from "path";
import { success, warn } from "../utils/logger.js";


export function generateJsonFiles(rootDir: string, unsafePatterns: Record<string, string[]>, file: string, format: string) {
    if (Object.keys(unsafePatterns).length > 0) {
        const jsonPath = path.join(rootDir, file);
        fs.writeFileSync(jsonPath, JSON.stringify({ unsafePatterns }, null, 2));
        warn(`[WARN] Unsafe patterns in ${format} detected! Report: ${jsonPath}`);
    } else {
        success(`[SUCCESS] No unsafe patterns detected in ${format}!`);
    }
}