import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { log, success } from "../utils/logger.js";

const ignoreDirs: string[] = ["node_modules", ".git", "dist"]

function isYaml(filePath: string) {
    return filePath.toLowerCase().endsWith(".yml") || filePath.toLowerCase().endsWith(".yaml");
}

function getYamlFiles(dir: string, ignoreDirs: string[]): string[] {
    let results: string[] = [];
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
            results = results.concat(getYamlFiles(fullPath, ignoreDirs));
        } else if (f.isFile() && isYaml(f.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

export function analyzeYaml(rootDir: string) {
    const files = getYamlFiles(rootDir, ignoreDirs);
    const unsafePatterns: Record<string, string[]> = {};
    const SECRET_PATTERNS: RegExp[] = [
        /aws_secret_access_key\s*:\s*[A-Za-z0-9/+=]{40}/i,
        /password\s*:\s*.+/i,
        /token\s*:\s*.+/i,
        /credentials\s*:\s*.+/i
    ];

    for (const file of files) {
        log("Running YAML analysis");
        try {
            const content = fs.readFileSync(file, "utf-8");
            const doc = yaml.load(content)

            if (content.includes("&") || content.includes("*")) {
                unsafePatterns[file] = (unsafePatterns[file] || []).concat("YAML contains anchors/aliases (&, *) which may hide malicious references")
            }

            if (/rm\s+-rf/.test(content)) {
                unsafePatterns[file] = (unsafePatterns[file] || []).concat("Unsafe shell command: rm -rf");
            }

            if (/import\s*\(.*\+.*\)/.test(content)) {
                unsafePatterns[file] = (unsafePatterns[file] || []).concat("Dynamic import detected in node -e");
            }

            const traverse = (obj: any, pathTrace = "") => {
                if (obj && typeof obj === "object") {
                    for (const key of Object.keys(obj)) {
                        const val = obj[key];
                        const currentPath = pathTrace ? `${pathTrace}.${key}` : key;

                        if (typeof val === "string") {
                            for (const pattern of SECRET_PATTERNS) {
                                if (pattern.test(`${key}: ${val}`)) {
                                    unsafePatterns[file] = (unsafePatterns[file] || []).concat(
                                        `Hardcoded secret detected at ${currentPath}`
                                    );
                                }
                            }
                        }

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

                        if (key === "kind" && (val === 'Pod' || val === "Deployment")) {
                            const spec = obj.spec ?? {};
                            const containers = spec.containers ?? [];
                            for (const c of containers) {
                                const name = c.name || "<unknown>";
                                const sec = c.securityContext ?? {};
                                if (sec.privileged === true) {
                                    unsafePatterns[file] = (unsafePatterns[file] || []).concat(
                                        `Container '${name}' runs as privileged`
                                    );
                                }
                                if (sec.runAsUser === 0) {
                                    unsafePatterns[file] = (unsafePatterns[file] || []).concat(
                                        `Container '${name}' runs as root user`
                                    );
                                }
                            }
                        }

                        traverse(val, currentPath);
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

export function analyzeK8s(rootDir: string) {
    const files = getYamlFiles(rootDir, ignoreDirs);
    const unsafePatterns: Record<string, string[]> = {};

    for (const file of files) {
        log("Running Kubernetes analysis.");
        try {
            const content = fs.readFileSync(file, "utf8");
            const docs = yaml.loadAll(content)
            const issues: string[] = []

            for (const doc of docs) {
                const replicas = (doc as any).spec?.replicas;

                if (!doc || typeof doc !== "object") continue;
                if (typeof replicas === "number" && replicas < 2) issues.push("Replicas must be at least 2.")

                const containers = (doc as any).spec?.template?.spec?.containers;
                if (Array.isArray(containers)) {
                    for (const container of containers) {
                        if (container.image?.endsWith(":latest")) {
                            issues.push(`Container ${container.name || ""} uses ':latest' tag.`);
                        }
                        if (!container.resources?.limits) {
                            issues.push(`Container ${container.name || ""} has no resource limits.`);
                        }
                        if (!container.livenessProbe) {
                            issues.push(`Container ${container.name || ""} has no liveness probe.`);
                        }
                        if (!container.readinessProbe) {
                            issues.push(`Container ${container.name || ""} has no readiness probe.`);
                        }
                    }
                }
                if (issues.length > 0) {
                    unsafePatterns[file] = (unsafePatterns[file] || []).concat(issues);
                }
            }

        }
        catch {
            unsafePatterns[file] = ["Failed to parse YAML"];
        }
    }

    if (Object.keys(unsafePatterns).length > 0) {
        const jsonPath = path.join(rootDir, "codeVitals-k8s-report.json");
        fs.writeFileSync(jsonPath, JSON.stringify({ unsafePatterns }, null, 2));
        log(`[WARN] Unsafe patterns in YAML in Kubernetes detected! Report: ${jsonPath}`);
    } else {
        success("[SUCCESS] No unsafe patterns detected in YAML!");
    }

    return unsafePatterns;
}