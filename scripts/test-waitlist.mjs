/* Try the waitlist endpoint against the real mailing list.
 *
 *   node --env-file=.env scripts/test-waitlist.mjs tu@correo.com
 *   make test-waitlist email=tu@correo.com
 *
 * It calls the same function the Worker calls, with the same secrets, so a green
 * run means Brevo really took the contact and sent the confirmation. The four
 * cases are: a wrong method, an address that is not one, the honeypot, and a real
 * sign-up. The address of the real one stays in the account afterwards, with the
 * three answers, so it can be deleted from Brevo when the test is done.
 */

import { handleWaitlist } from "../src/waitlist.js";

const email = process.argv[2];
if (!email) {
  console.error("uso: node --env-file=.env scripts/test-waitlist.mjs <correo>");
  process.exit(2);
}

const env = {
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_LIST_ID: process.env.BREVO_LIST_ID,
};
if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
  console.error("faltan BREVO_API_KEY o BREVO_LIST_ID: corre make test-waitlist email=...");
  process.exit(2);
}

function post(body, method = "POST") {
  return new Request("http://localhost/api/waitlist", {
    method,
    headers: { "content-type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

async function attempt(name, request, status, ok) {
  const response = await handleWaitlist(request, env);
  const body = await response.json();
  const good = response.status === status && body.ok === ok;
  console.log(`${good ? "ok  " : "FALLA"} ${name}: ${response.status} ${JSON.stringify(body)}`);
  return good;
}

const results = [];
results.push(await attempt("otro método", post({}, "GET"), 405, false));
results.push(await attempt("correo inválido", post({ email: "no-es-un-correo" }), 400, false));
results.push(await attempt("trampa", post({ email: "bot@example.com", website: "spam" }), 200, true));
results.push(await attempt(
  "alta real",
  post({
    email,
    rubro: "Servicios profesionales",
    objetivo: "Agendar citas o reservas",
    atencion: "Una persona dedicada",
    lang: "es",
  }),
  200,
  true,
));

if (results.every(Boolean)) {
  console.log(`\nTodo bien. Revisa la bandeja de ${email} y el contacto en Brevo.`);
} else {
  process.exitCode = 1;
}
