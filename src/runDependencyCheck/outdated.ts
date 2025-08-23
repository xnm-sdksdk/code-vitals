import axios from "axios";
import { log, success } from "../utils/logger.js";
import * as fs from "fs";
import chalk from "chalk";

interface PackageJSON {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

export async function checkOutdated() {
    log("Checking outdated packages...");

    const pkg: PackageJSON = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    const allDeps: Record<string, string> = {
        ...pkg.dependencies,
        ...pkg.devDependencies
    };

    const results = await Promise.all(
        Object.entries(allDeps).map(async ([dep, version]) => {
            const currentVersion = version; // now TS knows this is string
            try {
                const res = await axios.get(`https://registry.npmjs.org/${dep}/latest`);
                const latestVersion = res.data.version as string;

                const normalizedCurrent = currentVersion.replace(/^[\^~]/, "");

                if (normalizedCurrent !== latestVersion) {
                    return chalk.yellow(`${dep} is outdated: ${currentVersion} -> ${latestVersion}`);
                } else {
                    return chalk.green(`${dep} is up-to-date (${currentVersion})`);
                }
            } catch {
                return chalk.red(`Could not fetch info for ${dep}`);
            }
        })
    );

    results.forEach(r => console.log(r));
    success("Package check completed!");
}
