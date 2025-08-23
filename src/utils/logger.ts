import chalk from "chalk";

export function log(...args: any[]) {
    console.log(chalk.blue("[CodeVitals]"), ...args);
}

export function success(...args: any[]) {
    console.log(chalk.green("[SUCCESS]"), ...args);
}

export function warn(...args: any[]) {
    console.log(chalk.yellow("[WARN]"), ...args);
}

export function error(...args: any[]) {
    console.log(chalk.red("[ERROR]"), ...args);
}
