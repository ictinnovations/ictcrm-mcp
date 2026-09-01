/**
 * ICTCRM tools exposed over MCP.
 *
 * Read tools are always registered. The write tools — create/delete a contact and
 * add a contact to a campaign — only appear when ICTCRM_MCP_ALLOW_WRITE is set.
 *
 * Note: ictcrm.com runs on the ICTContact backend. That RPC surface exposes contact
 * groups and contact creation/deletion, but has no working "list contacts" method
 * (Contact_List errors server-side), so this server does not offer one.
 *
 * Part of ictcrm-mcp by Tahir Almas, ICT Innovations (https://ictinnovations.com).
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import type { ICTCRMClient, ContactFields } from "./client.js";
import { json, text, toolError } from "./format.js";

const contactShape = {
  phone: z.string().describe("Contact phone number in international format, e.g. +12125550123."),
  first_name: z.string().optional().describe("First name."),
  last_name: z.string().optional().describe("Last name."),
  email: z.string().optional().describe("Email address."),
};

function buildContact(a: { phone: string; first_name?: string; last_name?: string; email?: string }): ContactFields {
  const c: ContactFields = { phone: a.phone };
  if (a.first_name) c.first_name = a.first_name;
  if (a.last_name) c.last_name = a.last_name;
  if (a.email) c.email = a.email;
  return c;
}

export function registerTools(server: McpServer, cfg: Config, client: ICTCRMClient): void {
  server.registerTool(
    "ictcrm_list_contact_groups",
    {
      title: "List contact groups",
      description:
        "List the contact groups (contact lists) in the CRM, each with its id, name and description. " +
        "Use a group id when creating a contact.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => { try { return json(await client.listContactGroups()); } catch (e) { return toolError(e); } }
  );

  if (!cfg.allowWrite) return;

  // ---- writes (only when ICTCRM_MCP_ALLOW_WRITE is set) -----------------
  server.registerTool(
    "ictcrm_create_contact",
    {
      title: "Create a contact",
      description:
        "Create a contact in a contact group. Returns the new contact id. Use " +
        "ictcrm_list_contact_groups to find a group id first.",
      inputSchema: {
        contact_group_id: z.number().int().describe("The contact group id to add the contact to."),
        ...contactShape,
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ contact_group_id, phone, first_name, last_name, email }) => {
      try {
        const id = await client.createContact(contact_group_id, buildContact({ phone, first_name, last_name, email }));
        return text(`Created contact. contact_id=${JSON.stringify(id)}`);
      } catch (e) { return toolError(e); }
    }
  );

  server.registerTool(
    "ictcrm_delete_contact",
    {
      title: "Delete a contact",
      description: "Delete a contact by id.",
      inputSchema: { contact_id: z.number().int().describe("The contact id to delete.") },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ contact_id }) => {
      try { return json(await client.deleteContact(contact_id)); } catch (e) { return toolError(e); }
    }
  );

  server.registerTool(
    "ictcrm_add_contact_to_campaign",
    {
      title: "Add a contact to a campaign",
      description:
        "Add a contact to an outbound campaign by campaign id. Creates the contact record and attaches " +
        "it to the campaign; returns the new contact id.",
      inputSchema: {
        campaign_id: z.number().int().describe("The campaign id to add the contact to."),
        ...contactShape,
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ campaign_id, phone, first_name, last_name, email }) => {
      try {
        const id = await client.addContactToCampaign(campaign_id, buildContact({ phone, first_name, last_name, email }));
        return text(`Added contact to campaign ${campaign_id}. contact_id=${JSON.stringify(id)}`);
      } catch (e) { return toolError(e); }
    }
  );
}
