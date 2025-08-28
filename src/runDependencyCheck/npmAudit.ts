import { log, success, error } from "../utils/logger.js";
import { runCommand } from "../utils/runCommand.js";

export async function auditPackages() {
    log("Running audit.");
    try {
        const result = await runCommand("npm", ["audit", "--json"]);
        const audit = JSON.parse(result);
        if (audit.metadata.vulnerabilities.total === 0) {
            success("No vulnerabilities found.");
        } else {
            log("Vulnerabilities found:", audit.metadata.vulnerabilities);
        }
    } catch {
        error("Error running audit.");
    }

    log("Running outdated dependencies.");
    try {
        const outdatedResult = await runCommand("npm", ["outdated", "--json"]);
        const outdatedOutput = outdatedResult ? JSON.parse(outdatedResult) : {};
        if (Object.keys(outdatedOutput).length === 0) {
            success("No Outdated packages found.")
        } else {
            log("Outdated dependencies found:", outdatedOutput.metadata.vulnerabilities)
            for (const [pkg, info] of Object.entries(outdatedOutput)) {
                const pkgInfo = info as { current: string; wanted: string; latest: string };
                log(`${pkg}: current=${pkgInfo.current}, wanted=${pkgInfo.wanted}, latest=${pkgInfo.latest}`);
            }
        }
    } catch {
        error("Error running audit.");
    }
}