import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parse as parseYaml } from "yaml";

export const DownstreamConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
});

export const GuardianConfigSchema = z.object({
  mode: z.enum(["fail_closed", "permissive"]).optional(),
  policyFile: z.string().min(1),
  downstreams: z.array(DownstreamConfigSchema).min(1),
  auditDb: z.string().optional(),
  // 可选云同步（P1）；会话审批主路径不使用，保留配置字段避免破坏旧 yaml
  sync: z
    .object({
      enabled: z.boolean().default(false),
      endpoint: z.string().url().optional(),
      owner: z.string().default("local-dev"),
      deviceToken: z.string().optional(),
    })
    .optional(),
});

export type GuardianConfig = z.infer<typeof GuardianConfigSchema>;
export type DownstreamConfig = z.infer<typeof DownstreamConfigSchema>;

export function loadGuardianConfig(filePath: string): GuardianConfig {
  const abs = path.resolve(filePath);
  const raw = parseYaml(readFileSync(abs, "utf8"));
  return GuardianConfigSchema.parse(raw);
}

export function resolveFromConfigDir(
  configPath: string,
  maybeRelative: string,
): string {
  return path.resolve(path.dirname(path.resolve(configPath)), maybeRelative);
}
