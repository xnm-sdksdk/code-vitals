# CodeVitals

CodeVitals is a lightweight CLI tool for TypeScript and JavaScript projects that helps teams maintain secure, clean, and reliable code. It combines dependency checks, dead code analysis, and YAML/Kubernetes configuration audits into a single, easy-to-use tool.

## Key Features

- Dependency Health Checks – Detect vulnerable or outdated packages.
- Dead Code Analysis – Identify unused exports, imports, and variables.
- YAML Security Checks – Detect unsafe patterns in CI/CD pipeline configurations.
- Kubernetes Best Practices – Spot common misconfigurations and security risks.
- CI/CD Friendly – Exit codes and JSON reports make integration effortless.

> Ideal for enterprise and team projects that want to enforce safe, maintainable, and scalable code practices.

## Installation

Install globally via NPM:

```bash
npm install -g code-vitals
```

## Usage

Run CodeVitals in the root of your project:

```bash
# Check dependencies for vulnerabilities and outdated packages
code-v deps

# Analyze dead code, unused variables, and unsafe patterns
code-v code

# Show CLI help
code-v help
```

## Reports

CodeVitals generates JSON reports at the root of your project:

- `codeVitals-ts-report.json`: TypeScript dead code and unused imports/exports.
- `codeVitals-yaml-report.json`: YAML unsafe patterns detection.
- `codeVitals-k8s-report.json`: Kubernetes security and and configuration issues.

> Reports are automatically overwritten on each run. If no issues are found, the files are removed.

## CI/CD Integration

Easily integrate into your CI pipelines (GitHub Actions example):

```yaml
name: CodeVitals Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  code-vitals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install -g code-vitals
      - run: code-v deps
      - run: code-v code
```

> The pipeline fails automatically if any vulnerabilities, dead code, or unsafe patterns are detected.

## Project Structure

```plaintext
bin/                 # CLI entry point
src/
  runDeadCodeCheck/
    index.ts          # Dependency check runner
    tsAnalyzer.ts     # Dead code analysis
    astParser.ts      # TypeScript AST parser
    yamlAnalyzer.ts   # YAML unsafe patterns analysis
  runDependencyCheck/
    index.ts          # Dependency check runner
    npmAudit.ts       # NPM audit
    outdated.ts       # Outdated packages check
  utils/
    logger.ts         # Logging utilities
package.json
tsconfig.json
README.md
```

## Why CodeVitals?

- All-in-one – Dependency, dead code, and config audits in a single tool.
- Lightweight & Native – No extra dependencies, fully Node.js-based.
- CI/CD Ready – JSON reports and exit codes for automated pipelines.
- Easy to Use – Minimal setup, intuitive CLI.

## License

MIT License
