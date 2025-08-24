#!/usr/bin/env node
import("../dist/cli.js").catch((err) => {
    console.error("Failed to start CLI:", err);
    process.exit(1);
});