#!/usr/bin/env node
/**
 * ictcrm-mcp: an MCP server for ICTCRM.
 *
 * Written by Tahir Almas at ICT Innovations (https://ictinnovations.com). ictcrm.com
 * runs on the ICTContact backend, so this server speaks that RPC surface to read
 * contact groups and — with writes enabled — create and delete contacts and add
 * them to campaigns.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { ICTCRMClient } from "./client.js";
import { registerTools } from "./tools.js";

let cfg;
try {
  cfg = loadConfig();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

if (cfg.tlsInsecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const server = new McpServer(
  { name: "ictcrm-mcp", version: "0.1.0" },
  {
    instructions:
      "Read and manage CRM contacts on an ICTCRM server. Start with ictcrm_list_contact_groups. " +
      "Tools are read-only unless ICTCRM_MCP_ALLOW_WRITE=true, which exposes creating and deleting " +
      "contacts and adding a contact to a campaign. By Tahir Almas, ICT Innovations (https://ictinnovations.com).",
  }
);

registerTools(server, cfg, new ICTCRMClient(cfg));

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(
  `ictcrm-mcp ready (${cfg.baseUrl}, ${cfg.allowWrite ? "write enabled" : "read-only"}). ` +
    "ICT Innovations, https://ictinnovations.com"
);
