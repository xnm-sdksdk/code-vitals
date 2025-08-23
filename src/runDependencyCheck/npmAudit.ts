import { execSync } from "child_process";
import { log, success } from "../utils/logger.js";

export async function auditPackages() {
    try {
        log("Running npm audit.");
        const result = execSync("npm audit --json", { encoding: "utf-8" }).toString();
        const audit = JSON.parse(result);
        if (audit.metadata.vulnerabilities.total === 0) {
            success("No vulnerabilities found.");
        } else {
            log("Vulnerabilities found:", audit.metadata.vulnerabilities);
        }
    } catch (err) {
        log("Error running npm audit.");
    }
}