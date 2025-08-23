import ts from "typescript";
import * as fs from "fs";
import path from "path";

export function parseFiles(dir: string): string[] {
    const files: string[] = [];
    const ignoreDirs = ["node_modules", ".git", "dist", "build"];
    const walk = (d: string) => {
        for (const f of fs.readdirSync(d)) {
            const full = path.join(d, f);
            try {
                const stat = fs.statSync(full);
                if (stat.isDirectory()) { if (!ignoreDirs.includes(f)) walk(full) }
                else if ((full.endsWith(".ts") || full.endsWith(".js")) && !full.includes("/dist/")) files.push(full);
            } catch (err) {
                console.warn(`Failed to read ${full}:`, err);
            }
        }
    };
    walk(dir);
    return files;
}

export function getAST(file: string): ts.SourceFile | null {
    try {
        const src = fs.readFileSync(file, "utf-8");
        return ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
    } catch (err) {
        console.warn(`Failed to parse ${file}:`, err);
        return null;
    }
}
