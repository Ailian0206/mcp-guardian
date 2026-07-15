#!/usr/bin/env node
import { startDemoShellStdio } from "./shell.js";

startDemoShellStdio().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
