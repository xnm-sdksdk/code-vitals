import { analyzeDeadCode } from "./tsAnalyzer.js";
import { analyzeYaml } from "./yamlAnalyzer.js";

export function runDeadCodeCheck(rootDir: string) {
    analyzeDeadCode(rootDir);
    analyzeYaml(rootDir);
}
