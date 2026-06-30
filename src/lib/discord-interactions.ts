/**
 * Discord Interactions (HTTP webhook) primitives — runtime-agnostic, no DB.
 *
 * Flow: a button posted in a channel carries custom_id `form_open:<formKey>`.
 * Clicking it opens a modal built from the form's field schema; the modal
 * submits with custom_id `form_submit:<formKey>`. The route handler verifies
 * the request signature, then dispatches on these prefixes.
 *
 * Components use the Label-based modal layout (Action Row + Text Input in modals
 * is deprecated; File Upload must live inside a Label).
 */

import { createPublicKey, verify as edVerify } from "node:crypto";
import type { Form, FormField } from "@/lib/services/forms";

// Interaction request types (incoming `body.type`).
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

// Interaction callback types (our `response.type`).
export const CallbackType = {
  PONG: 1,
  CHANNEL_MESSAGE: 4,
  DEFERRED_MESSAGE: 5,
  MODAL: 9,
} as const;

// Message/component component types.
const Comp = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  TEXT_INPUT: 4,
  LABEL: 18,
  FILE_UPLOAD: 19,
} as const;

// Text input styles.
const TextStyle = { SHORT: 1, PARAGRAPH: 2 } as const;

// EPHEMERAL message flag (only the interacting user sees the reply).
export const EPHEMERAL = 1 << 6; // 64

export const OPEN_PREFIX = "form_open:";
export const SUBMIT_PREFIX = "form_submit:";

// ----------------------------------------------------------------------------
// Signature verification (Ed25519)
// ----------------------------------------------------------------------------

// SPKI DER prefix for an Ed25519 public key; raw 32-byte key is appended.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Verify a Discord interaction request. `message` is `timestamp + rawBody`.
 * Returns false on any malformed input rather than throwing.
 */
export function verifyInteraction(
  publicKeyHex: string,
  signatureHex: string | null,
  timestamp: string | null,
  rawBody: string,
): boolean {
  if (!publicKeyHex || !signatureHex || !timestamp) return false;
  try {
    const der = Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, "hex")]);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    const message = Buffer.from(timestamp + rawBody, "utf8");
    return edVerify(null, message, key, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Responses
// ----------------------------------------------------------------------------

/** An ephemeral text reply (type 4). */
export function ephemeralReply(content: string) {
  return { type: CallbackType.CHANNEL_MESSAGE, data: { content, flags: EPHEMERAL } };
}

/**
 * Build a MODAL response (type 9) from a form's field schema.
 * Modals allow at most 5 top-level components, so only the first 5 fields fit;
 * forms meant for Discord submission should keep to <= 5 fields.
 */
export function buildModal(form: Form) {
  return {
    type: CallbackType.MODAL,
    data: {
      custom_id: SUBMIT_PREFIX + form.key,
      title: form.title.slice(0, 45),
      components: form.fields.slice(0, 5).map(fieldToLabel),
    },
  };
}

/** Wrap one form field in a Label (type 18) around its interactive component. */
function fieldToLabel(f: FormField) {
  const label = { type: Comp.LABEL, label: f.label.slice(0, 45) };
  const required = !!f.required;

  switch (f.type) {
    case "textarea":
      return { ...label, component: { type: Comp.TEXT_INPUT, custom_id: f.name, style: TextStyle.PARAGRAPH, required } };
    case "image":
      return {
        ...label,
        component: { type: Comp.FILE_UPLOAD, custom_id: f.name, min_values: required ? 1 : 0, max_values: 1 },
      };
    case "select":
      if (f.options?.length) {
        return {
          ...label,
          component: {
            type: Comp.STRING_SELECT,
            custom_id: f.name,
            min_values: required ? 1 : 0,
            max_values: 1,
            options: f.options.slice(0, 25).map((o) => ({ label: o.slice(0, 100), value: o.slice(0, 100) })),
          },
        };
      }
      return { ...label, component: { type: Comp.TEXT_INPUT, custom_id: f.name, style: TextStyle.SHORT, required } };
    case "number":
      return {
        ...label,
        component: { type: Comp.TEXT_INPUT, custom_id: f.name, style: TextStyle.SHORT, required, placeholder: "숫자" },
      };
    case "text":
    case "checkbox":
    default:
      return { ...label, component: { type: Comp.TEXT_INPUT, custom_id: f.name, style: TextStyle.SHORT, required } };
  }
}

// ----------------------------------------------------------------------------
// Submit parsing
// ----------------------------------------------------------------------------

export type ResolvedAttachment = { url: string; filename: string; content_type?: string };

export type SubmittedData = {
  values: Record<string, unknown>; // custom_id -> value (text) or values (select/file)
  attachments: Record<string, ResolvedAttachment>; // attachment id -> file
};

/**
 * Flatten a MODAL_SUBMIT payload's components into a { custom_id -> value } map,
 * regardless of Label / Action Row nesting. File uploads carry an array of
 * attachment ids resolved via `data.resolved.attachments`.
 */
export function collectSubmitted(data: unknown): SubmittedData {
  const out: Record<string, unknown> = {};
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    const n = node as Record<string, unknown>;
    if (typeof n.custom_id === "string" && (n.value !== undefined || n.values !== undefined)) {
      out[n.custom_id] = n.value !== undefined ? n.value : n.values;
    }
    if (n.component) walk(n.component);
    if (n.components) walk(n.components);
  };
  const d = (data ?? {}) as Record<string, unknown>;
  walk(d.components);
  const resolved = (d.resolved ?? {}) as { attachments?: Record<string, ResolvedAttachment> };
  return { values: out, attachments: resolved.attachments ?? {} };
}
