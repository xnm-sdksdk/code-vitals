import { auditPackages } from "./npmAudit.js";
import { checkOutdated } from "./outdated.js";

export async function runDependencyCheck() {
    await auditPackages();
    await checkOutdated();
}