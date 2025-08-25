import ts from "typescript";
import fs from "fs";
import path from "path";
import { parseFiles, getAST } from "./astParser.js";
import { log, success } from "../utils/logger.js";

function isInProject(filePath: string, rootDir: string) {
    return filePath.startsWith(rootDir) && !filePath.includes("node_modules") && !filePath.includes("dist");
}

export function analyzeDeadCode(rootDir: string) {
    const files = parseFiles(rootDir).filter(f => isInProject(f, rootDir));

    const exportsDeclared: Record<string, Set<string>> = {};
    const importsDeclared: Record<string, Set<string>> = {};
    const usageMap: Record<string, Set<string>> = {};
    const unsafePatterns: Record<string, string[]> = {};

    for (const file of files) {
        const ast = getAST(file);
        if (!ast) continue;

        exportsDeclared[file] = new Set();
        importsDeclared[file] = new Set();
        usageMap[file] = new Set();

        const trackUsage = (node: ts.Node) => {
            if (ts.isIdentifier(node)) usageMap[file].add(node.getText());
            ts.forEachChild(node, trackUsage);
        };

        ts.forEachChild(ast, (node) => {
            if (ts.isFunctionDeclaration(node) && node.name) exportsDeclared[file].add(node.name.getText());
            if (ts.isClassDeclaration(node) && node.name) exportsDeclared[file].add(node.name.getText());
            if (ts.isVariableStatement(node)) {
                for (const decl of node.declarationList.declarations) {
                    if (ts.isIdentifier(decl.name)) {
                        const init = decl.initializer;
                        if (init && (ts.isFunctionExpression(init) || ts.isArrowFunction(init))) {
                            exportsDeclared[file].add(decl.name.getText());
                        }
                    }
                }
            }

            if (ts.isImportDeclaration(node) && node.importClause) {
                const { name, namedBindings } = node.importClause;
                if (name) importsDeclared[file].add(name.getText());
                if (namedBindings && ts.isNamedImports(namedBindings)) {
                    for (const elem of namedBindings.elements) importsDeclared[file].add(elem.name.getText());
                }
            }

            if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                unsafePatterns[file].push("Dynamic import detected");

                const args = node.arguments;
                if (args.length > 0 && ts.isStringLiteral(args[0])) {
                    usageMap[file].add(args[0].text);
                }
            }

            ts.forEachChild(node, trackUsage);
        });
    }

    const deadExports: Record<string, string[]> = {};
    const allUsages = new Set<string>();
    Object.values(usageMap).forEach(set => set.forEach(name => allUsages.add(name)));
    for (const [file, names] of Object.entries(exportsDeclared)) {
        deadExports[file] = [...names].filter(name => !allUsages.has(name));
    }

    const unusedImports: Record<string, string[]> = {};
    for (const [file, names] of Object.entries(importsDeclared)) {
        unusedImports[file] = [...names].filter(name => !usageMap[file].has(name));
    }

    const hasDeadExports = Object.values(deadExports).some(arr => arr.length > 0);
    const hasUnusedImports = Object.values(unusedImports).some(arr => arr.length > 0);

    if (hasDeadExports || hasUnusedImports) {
        const report = { deadExports, unusedImports };
        const jsonPath = path.join(rootDir, "codeVitals-ts-report.json");
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
        log(`[WARN] TypeScript issues detected! Report generated at ${jsonPath}`);
    } else {
        const jsonPath = path.join(rootDir, "codeVitals-ts-report.json");
        if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
        success("[SUCCESS] No dead exports or unused imports in TypeScript!");
    }
}


export function analyzeUnused(rootDir: string) {
    const fileExt: string = "tsconfig.json"
    const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, fileExt);
    let configParse: ts.ParsedCommandLine;

    if (!configPath) {
        log(`[WARN] File ${configPath} not found`)
        return []
    } else {
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        configParse = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath))
    }

    const program = ts.createProgram({
        rootNames: configParse.fileNames,
        options: {
            ...configParse.options,
            noUnusedLocals: true,
            noUnusedParameters: true,
        },
    });

    const diagnostics = [
        ...program.getSemanticDiagnostics(),
        ...program.getOptionsDiagnostics(),
        ...program.getGlobalDiagnostics(),
    ];

    const unused: { file: string; message: string }[] = [];

    for (const diag of diagnostics) {
        if (!diag.file || !diag.start) continue;

        const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
        const message = ts.flattenDiagnosticMessageText(diag.messageText, "\n");

        if (message.includes("is declared but its value is never read") ||
            message.includes("parameter") && message.includes("never used")) {
            unused.push({
                file: diag.file.fileName,
                message: `[${line + 1},${character + 1}] ${message}`
            });
        }
    }

    if (unused.length > 0) {
        const reportPath = path.join(rootDir, "codeVitals-unused-report.json");
        fs.writeFileSync(reportPath, JSON.stringify(unused, null, 2));
        log(`[WARN] Unused code detected! Report saved at ${reportPath}`);
    } else {
        log("[SUCCESS] No unused variables or parameters detected.");
    }

    return unused;
}