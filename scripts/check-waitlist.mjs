import assert from "node:assert/strict";
import { handleWaitlist } from "../src/waitlist.js";

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, body: JSON.parse(options.body) });
  return new Response("{}", { status: url.endsWith("/smtp/email") ? 429 : 201 });
};
const env = { BREVO_API_KEY: "test", BREVO_LIST_ID: "5" };
const answers = {
  email: "test@example.com", rubro: "__other", rubro_other: "Un taller",
  objetivo: "Agendar citas o reservas", atencion: "Una persona dedicada", lang: "es",
};
async function post(body) {
  return handleWaitlist(new Request("https://pautia.app/api/waitlist", {
    method: "POST", body: JSON.stringify(body),
  }), env);
}
assert.equal((await post({ ...answers, rubro_other: "x".repeat(101) })).status, 400);
assert.equal((await post({ ...answers, rubro_other: " " })).status, 400);
assert.equal((await post({ ...answers, objetivo: "" })).status, 400);
assert.equal(calls.length, 0);
const result = await (await post(answers)).json();
assert.equal(result.ok, true);
assert.equal(result.confirmationSent, false);
assert.equal(calls[0].body.attributes.RUBRO, "Otro: Un taller");
assert.equal(calls.length, 2);
console.log("Waitlist validation and confirmation status: OK (no real emails)");
