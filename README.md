# ictcrm-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for
**[ICTCRM](https://ictcrm.com)** from [ICT Innovations](https://ictinnovations.com).

`ictcrm.com` runs on the ICTContact backend, so this server speaks that RPC surface.
It lets an AI assistant read contact groups and — only when you turn writes on —
create and delete contacts and add a contact to a campaign.

## Install

```bash
npx -y ictcrm-mcp      # no install
npm install -g ictcrm-mcp
```

Requires Node.js 18 or newer.

## Configure

| Variable | Required | Default | |
|----------|----------|---------|--|
| `ICTCRM_BASE_URL` | yes | | Server base URL, without the `/rest` suffix, e.g. `https://your-ictcrm` |
| `ICTCRM_USERNAME` | yes | | API account username |
| `ICTCRM_PASSWORD` | yes | | Password for that account |
| `ICTCRM_MCP_ALLOW_WRITE` | no | `false` | Unlock the contact write tools (see Safety) |
| `ICTCRM_TIMEOUT_MS` | no | `30000` | Per-request timeout |
| `ICTCRM_TLS_INSECURE` | no | `false` | Skip TLS verification — self-signed test servers only |

### Claude Desktop example

```json
{
  "mcpServers": {
    "ictcrm": {
      "command": "npx",
      "args": ["-y", "ictcrm-mcp"],
      "env": {
        "ICTCRM_BASE_URL": "https://your-ictcrm",
        "ICTCRM_USERNAME": "admin",
        "ICTCRM_PASSWORD": "your-password"
      }
    }
  }
}
```

## Tools

Read tools are always available:

| Tool | What it does |
|------|--------------|
| `ictcrm_list_contact_groups` | List contact groups (id, name, description) |

Write tools appear only when `ICTCRM_MCP_ALLOW_WRITE=true`:

| Tool | What it does |
|------|--------------|
| `ictcrm_create_contact` | Create a contact in a group; returns the contact id |
| `ictcrm_delete_contact` | Delete a contact by id |
| `ictcrm_add_contact_to_campaign` | Create a contact and attach it to a campaign |

## Safety

The server is **read-only by default**. Creating and deleting contacts only becomes
possible when you set `ICTCRM_MCP_ALLOW_WRITE=true`.

## A note on listing contacts

The ICTContact backend that ICTCRM runs on exposes contact groups and contact
creation/deletion, but its "list contacts" method errors server-side, so this server
does not offer a contact-listing tool. It manages contacts and reads contact groups;
listing individual contacts is not available over the API today.

## How it connects

Calls go to a form-encoded RPC API at `{base}/rest/<Method>`, each carrying the
account username and password. There is no separate token to provision.

## About

Built by Tahir Almas at [ICT Innovations](https://ictinnovations.com) — the team
behind ICTCRM, ICTContact, ICTDialer, ICTBroadcast, ICTFax and ICTPBX. Learn more at
[ictcrm.com](https://ictcrm.com).

MIT licensed. Issues and PRs welcome at
[github.com/ictinnovations/ictcrm-mcp](https://github.com/ictinnovations/ictcrm-mcp).
