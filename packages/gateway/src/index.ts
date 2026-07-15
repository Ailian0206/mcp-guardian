import { PACKAGE_NAME } from "@mcp-guardian/shared";
import { scaffoldAction } from "@mcp-guardian/policy-engine";

export function gatewayBanner(): string {
  return `${PACKAGE_NAME} gateway (scaffold) default=${scaffoldAction()}`;
}
