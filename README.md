# CodeVitals

CodeVitals is a CLI tool for TypeScript projects that performs:

- Dependency vulnerability checks, outdated packages
- Outdated package checks
- Dead code analysis (unused exports and imports)
- CI/CD YAML security pattern checks
- Kubernetes security pattern checks and misconfigurations
- Unused variables

It is intended for enterprise-level projects to enforce safe and maintainable code.

## Installation

Install via NPM:

```bash
npm install -g code-vitals
```

Ensure your Node.js version is >= 18.

## Usage

Run the CLI in your project root:

```bash
code-v deps    # Run dependency checks
code-v code    # Run dead code and unsafe pattern analysis
code-v help    # Show usage information
```

## Reports

Reports are generated in JSON format at the project root:

- `codeVitals-ts-report.json`: TypeScript dead code analysis
- `codeVitals-yaml-report.json`: YAML unsafe patterns analysis

Reports are overwritten on each run. If no issues are found, the files are removed automatically.

## CI/CD Integration

You can integrate CodeVitals in GitHub Actions or any CI pipeline:

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

The pipeline fails if any vulnerabilities, dead code, or unsafe patterns are detected.

## Project Structure

```plaintext
bin/                 # CLI entry point
src/
  runDeadCodeCheck/
    index.ts          # Dependency check runner
    tsAnalyzer.ts     # Dead code analysis
    astParser.ts      # TypeScript AST parser
    yamlAnalyzer.ts       # YAML unsafe patterns analysis
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

## License

MIT License
