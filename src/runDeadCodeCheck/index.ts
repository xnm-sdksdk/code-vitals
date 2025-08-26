import { analyzeDeadCode, analyzeUnused } from "./tsAnalyzer.js";
import { analyzeK8s, analyzeYaml } from "./yamlAnalyzer.js";

export function runDeadCodeCheck(rootDir: string) {
    analyzeDeadCode(rootDir);
    analyzeYaml(rootDir);
    analyzeUnused(rootDir);
    analyzeK8s(rootDir);
}
