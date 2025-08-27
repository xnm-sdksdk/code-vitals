import fs from "fs/promises";
import path from "path";

export async function readFiles(rootDir: string, ignoreDirs: string[] = []): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.readdir(rootDir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(rootDir, entry.name);

        if (entry.isDirectory() && !ignoreDirs.includes(entry.name)) {
            results.push(...await readFiles(fullPath, ignoreDirs));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}