/**
 * Configuration for ictcrm-mcp.
 *
 * Part of ictcrm-mcp by Tahir Almas, ICT Innovations (https://ictinnovations.com).
 */

export interface Config {
  baseUrl: string;
  username: string;
  password: string;
  allowWrite: boolean;
  timeoutMs: number;
  tlsInsecure: boolean;
}

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bool(value: string | undefined): boolean {
  return /^(1|true|yes)$/i.test(value ?? "");
}

/**
 * Read config from the environment. Throws a clear error when a required value is
 * missing, so the server fails at startup rather than on the first tool call.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Base URL WITHOUT the /rest suffix, e.g. https://your-ictcontact.
  const baseUrl = (env.ICTCRM_BASE_URL ?? "").trim().replace(/\/+$/, "").replace(/\/rest$/i, "");
  const username = (env.ICTCRM_USERNAME ?? "").trim();
  const password = env.ICTCRM_PASSWORD ?? "";

  const missing: string[] = [];
  if (!baseUrl) missing.push("ICTCRM_BASE_URL");
  if (!username) missing.push("ICTCRM_USERNAME");
  if (!password) missing.push("ICTCRM_PASSWORD");
  if (missing.length) {
    throw new Error(
      `ictcrm-mcp: missing required config: ${missing.join(", ")}.\n` +
        "See https://github.com/ictinnovations/ictcrm-mcp for the full variable list."
    );
  }

  return {
    baseUrl,
    username,
    password,
    allowWrite: bool(env.ICTCRM_MCP_ALLOW_WRITE),
    timeoutMs: num(env.ICTCRM_TIMEOUT_MS, 30000),
    tlsInsecure: bool(env.ICTCRM_TLS_INSECURE),
  };
}
