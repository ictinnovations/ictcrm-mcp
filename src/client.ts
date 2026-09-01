/**
 * Client for the ICTCRM API.
 *
 * ictcrm.com runs on the ICTContact backend, so it speaks the same RPC surface:
 * every call is a form-encoded POST to `{base}/rest/<Method>` carrying `username`
 * and `password`; nested values are sent as JSON strings. A success comes back as
 * `[true, data]`, a failure as `[false, "message"]`.
 *
 * Part of ictcrm-mcp by Tahir Almas, ICT Innovations (https://ictinnovations.com).
 */

import type { Config } from "./config.js";

export class ICTCRMError extends Error {}

export interface ContactFields {
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  [key: string]: unknown;
}

export class ICTCRMClient {
  constructor(private cfg: Config) {}

  private controller(): { signal: AbortSignal; done: () => void } {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), this.cfg.timeoutMs);
    return { signal: c.signal, done: () => clearTimeout(t) };
  }

  async call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const form = new URLSearchParams();
    form.set("username", this.cfg.username);
    form.set("password", this.cfg.password);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      form.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }

    const { signal, done } = this.controller();
    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseUrl}/rest/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: form.toString(),
        signal,
      });
    } finally {
      done();
    }

    const textBody = await res.text();
    let body: unknown = null;
    if (textBody) {
      try { body = JSON.parse(textBody); } catch { body = textBody; }
    }

    if (body && typeof body === "object" && !Array.isArray(body) && "ErrorMessage" in (body as object)) {
      const e = body as { ErrorCode?: number; ErrorMessage?: string };
      throw new ICTCRMError(`${e.ErrorCode ?? res.status}: ${e.ErrorMessage}`);
    }
    if (!res.ok) throw new ICTCRMError(`HTTP ${res.status}: ${textBody.slice(0, 200)}`);

    if (Array.isArray(body) && typeof body[0] === "boolean") {
      if (body[0]) return body.length > 1 ? body[1] : true;
      throw new ICTCRMError(String(body.length > 1 ? body[1] : `${method} failed`));
    }
    return body;
  }

  // ---- reads ------------------------------------------------------------
  listContactGroups() { return this.call("Contact_Group_List"); }

  // ---- writes -----------------------------------------------------------
  createContact(contactGroupId: number, contact: ContactFields) {
    return this.call("Contact_Create", { contact_group_id: contactGroupId, contact });
  }
  deleteContact(contactId: number) {
    return this.call("Contact_Delete", { contact_id: contactId });
  }
  addContactToCampaign(campaignId: number, contact: ContactFields) {
    return this.call("Campaign_Contact_Create", { campaign_id: campaignId, contact_id: contact });
  }
}
