import { execSync } from "child_process";
import { log, success } from "../utils/logger.js";

export async function auditPackages() {
    try {
        log("Running audit.");
        const result = execSync("npm audit --json", { encoding: "utf-8" }).toString();
        const audit = JSON.parse(result);
        if (audit.metadata.vulnerabilities.total === 0) {
            success("No vulnerabilities found.");
        } else {
            log("Vulnerabilities found:", audit.metadata.vulnerabilities);
        }
    } catch (err) {
        log("Error running audit.");
    }

    try {
        log("Running outdated dependencies.");
        const outdatedResult = execSync("npm outdated --json", { encoding: "utf-8" }).toString();
        const outdatedOutput = outdatedResult ? JSON.parse(outdatedResult) : {};
        if (Object.keys(outdatedOutput).length === 0) {
            success("No Outdated packages found.")
        } else {
            log("Outdated dependencies found:", outdatedOutput.metadata.vulnerabilities)
            for (const [pkg, info] of Object.entries(outdatedOutput)) {
                const pkgInfo = info as { current: string; wanted: string; latest: string };
                console.log(`  ${pkg}: current=${pkgInfo.current}, wanted=${pkgInfo.wanted}, latest=${pkgInfo.latest}`);
            }
        }
    } catch (error) {
        log("Error running audit.");
    }
}