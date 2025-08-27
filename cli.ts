#!/usr/bin/env node
import { log } from "./src/utils/logger.js"
import { runDependencyCheck } from "./src/runDependencyCheck/index.js";
import { runDeadCodeCheck } from "./src/runDeadCodeCheck/index.js"
import * as commander from "commander";

const program = new commander.Command();

program.name("code-vitals").description("Analyze JS/TS project health: dependencies, dead code and misconfigurations.").version("1.1.9");

program.command("deps").description("Checking dependency health...").action(async () => {
    log("Running dependency checks...");
    await runDependencyCheck();
});

program.command("code").description("Checking unused and dead code...").action(async () => {
    log("Running dead code checks...");
    runDeadCodeCheck(process.cwd());
});

program.parse(process.argv);