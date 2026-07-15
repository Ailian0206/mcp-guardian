#!/usr/bin/env node
import { startDemoHttpStdio } from "./http.js";

startDemoHttpStdio().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
