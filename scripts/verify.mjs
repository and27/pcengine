#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const commands = ["lint", "typecheck", "build"];
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");

for (const command of commands) {
  if (verbose) {
    console.log(`> pnpm ${command}`);
  }

  const result = spawnSync("pnpm", [command], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`Failed to run pnpm ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
