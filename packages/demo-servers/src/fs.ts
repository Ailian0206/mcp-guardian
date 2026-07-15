#!/usr/bin/env node
import { startDemoFsStdio } from "./index.js";

startDemoFsStdio().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
