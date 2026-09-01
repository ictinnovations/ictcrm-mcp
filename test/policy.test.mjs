/**
 * Config and write-gate tests. Run after build (they import from dist/).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { loadConfig } from "../dist/config.js";
import { registerTools } from "../dist/tools.js";

const base = {
  ICTCRM_BASE_URL: "https://crm.example.com/rest/",
  ICTCRM_USERNAME: "admin",
  ICTCRM_PASSWORD: "x",
};

test("loadConfig requires base url, username and password", () => {
  assert.throws(() => loadConfig({}), /ICTCRM_BASE_URL/);
  assert.throws(() => loadConfig({ ICTCRM_BASE_URL: "https://x" }), /ICTCRM_USERNAME/);
});

test("base url trims trailing slash and a /rest suffix", () => {
  assert.equal(loadConfig(base).baseUrl, "https://crm.example.com");
});

test("write is off by default and parses truthy strings", () => {
  assert.equal(loadConfig(base).allowWrite, false);
  assert.equal(loadConfig({ ...base, ICTCRM_MCP_ALLOW_WRITE: "true" }).allowWrite, true);
});

function collectTools(allowWrite) {
  const names = [];
  const fakeServer = { registerTool: (name) => names.push(name) };
  registerTools(fakeServer, { ...loadConfig(base), allowWrite }, /* client */ {});
  return names;
}

test("read-only install registers only the contact-groups read tool", () => {
  assert.deepEqual(collectTools(false), ["ictcrm_list_contact_groups"]);
});

test("write install additionally registers the three write tools", () => {
  const names = collectTools(true);
  assert.ok(names.includes("ictcrm_create_contact"));
  assert.ok(names.includes("ictcrm_delete_contact"));
  assert.ok(names.includes("ictcrm_add_contact_to_campaign"));
  assert.equal(names.length, 4);
});
