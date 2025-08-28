import { spawn } from "child_process";

export function runCommand(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        let error = "";

        child.stdout.on("data", (data) => (output += data))
        child.stderr.on("data", (data) => (error += data))

        child.on("close", (code) => {
            if (code === 0) resolve(output);
            else reject(new Error(error || `Command failed with code: ${code}`));
        });
    });
}