/** Week 0 占位：Week 1/2 实现 demo-fs / demo-shell / demo-http */
export const DEMO_SERVER_NAMES = ["demo-fs", "demo-shell", "demo-http"] as const;

export type DemoServerName = (typeof DEMO_SERVER_NAMES)[number];
