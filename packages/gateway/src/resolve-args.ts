import path from "node:path";

/**
 * 下游 args 里哪些要相对 config 目录 resolve。
 * 禁止把 `@scope/pkg`、CLI flag、已是绝对路径的工作区根当成相对文件路径。
 */
export function shouldResolveDownstreamArg(arg: string): boolean {
  if (!arg) return false;
  if (arg.startsWith("@")) return false;
  if (arg.startsWith("-")) return false;
  if (path.isAbsolute(arg)) return false;
  if (arg.startsWith(".")) return true;
  if (/\.(c|m)?js$/i.test(arg)) return true;
  // 相对路径片段（如 packages/demo-servers/dist/fs.js）
  if (arg.includes("/")) return true;
  return false;
}

export function resolveDownstreamArgs(
  configPath: string,
  args: string[],
  resolveFromConfigDir: (configPath: string, maybeRelative: string) => string,
): string[] {
  return args.map((a) =>
    shouldResolveDownstreamArg(a) ? resolveFromConfigDir(configPath, a) : a,
  );
}
