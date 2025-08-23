import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { log, success } from "../utils/logger.js";

function isYaml(filePath: string) {
    return filePath.endsWith(".yml") || filePath.endsWith(".yaml");
}

function getYamlFiles(dir: string): string[] {
    let results: string[] = [];
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
            results = results.concat(getYamlFiles(fullPath));
        } else if (f.isFile() && isYaml(f.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

export function analyzeYaml(rootDir: string) {
    const files = getYamlFiles(rootDir);
    const unsafePatterns: Record<string, string[]> = {};

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, "utf-8");
            const doc = yaml.load(content);

            if (/rm\s+-rf/.test(content)) {
                unsafePatterns[file] = (unsafePatterns[file] || []).concat("Unsafe shell command: rm -rf");
            }

            if (/import\s*\(.*\+.*\)/.test(content)) {
                unsafePatterns[file] = (unsafePatterns[file] || []).concat("Dynamic import detected in node -e");
            }

            const traverse = (obj: any) => {
                if (obj && typeof obj === "object") {
                    for (const key of Object.keys(obj)) {
                        const val = obj[key];

                        if (key === "run" && typeof val === "string") {
                            const issues: string[] = [];
                            if (val.includes("sudo")) issues.push("Using sudo in run commands");
                            if (val.includes("|| true")) issues.push("Ignoring exit code in run command");
                            if (/curl|wget/.test(val)) issues.push("Downloading unverified scripts");
                            if (issues.length > 0) unsafePatterns[file] = (unsafePatterns[file] || []).concat(issues);
                        }

                        if (key === "uses" && typeof val === "string") {
                            if (val.includes("@main") || val.includes("@master")) {
                                unsafePatterns[file] = (unsafePatterns[file] || []).concat("Unpinned action in uses");
                            }
                        }

                        traverse(val);
                    }
                }
            };

            traverse(doc);
        } catch {
            unsafePatterns[file] = ["Failed to parse YAML"];
        }
    }

    if (Object.keys(unsafePatterns).length > 0) {
        const jsonPath = path.join(rootDir, "codeVitals-yaml-report.json");
        fs.writeFileSync(jsonPath, JSON.stringify({ unsafePatterns }, null, 2));
        log(`[WARN] Unsafe patterns in YAML detected! Report: ${jsonPath}`);
    } else {
        success("[SUCCESS] No unsafe patterns detected in YAML!");
    }

    return unsafePatterns;
}