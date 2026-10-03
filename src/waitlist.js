/* The waitlist endpoint: one POST from the dialog, two calls to Brevo, and one
 * answer. Nothing about the mailing list reaches the browser, and the API key
 * lives as a secret on the Worker, never in the page.
 *
 * Brevo is both the store and the sender. The contact carries the three answers
 * as attributes, so the list is exported from Brevo and this project keeps no
 * database of its own. The confirmation is transactional mail: 300 a day are
 * free, it is the only email the page ever sends, and it is what tells a person
 * their address was written down.
 *
 * There is no rate limit here. The honeypot stops the bots that fill every
 * field, and a real flood is a Cloudflare rule in front of the route, not
 * something this file should pretend to solve.
 */

const API = "https://api.brevo.com/v3";

// The address the visitor sees and can reply to. It forwards to a person
// (Cloudflare Email Routing), so a reply is read even though this Worker sends.
const SENDER = { name: "Pautia", email: "info@pautia.app" };

// The dialog's field names, and the Brevo attribute each one is stored in.
// Brevo ignores an attribute the account does not have, so the names here have
// to match what was created in the account, letter for letter.
const ATTRIBUTES = {
  rubro: "RUBRO",
  objetivo: "OBJETIVO",
  atencion: "ATENCION_ACTUAL",
};

const MAIL = {
  es: {
    subject: "Ya estás en la lista de Pautia",
    text: "Gracias por anotarte. Te escribimos a este correo en cuanto Pautia "
      + "abra, con tu acceso y los primeros pasos.\n\n"
      + "Si quieres contarnos algo más de tu negocio, responde a este correo.\n\n"
      + "Pautia · info@pautia.app",
  },
  en: {
    subject: "You are on the Pautia list",
    text: "Thanks for signing up. We will write to this address as soon as "
      + "Pautia opens, with your access and the first steps.\n\n"
      + "If you want to tell us more about your business, reply to this email.\n\n"
      + "Pautia · info@pautia.app",
  },
};

// The same text as the plain one, in the simplest HTML a mail client cannot
// misread: no stylesheet, no table, one font and one colour.
function html(mail) {
  const body = mail.text.split("\n\n")
    .map((part) => `<p style="margin:0 0 16px">${part.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return '<div style="font-family:system-ui,sans-serif;font-size:16px;'
    + 'line-height:1.6;color:#263243;max-width:520px">' + body + "</div>";
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function call(key, path, payload) {
  return fetch(API + path, {
    method: "POST",
    headers: {
      "api-key": key,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
}

// A contact is the part that must not be lost, so an attribute the account does
// not have yet cannot take the address down with it: the answers are dropped and
// the lead is kept.
async function save(key, list, email, attributes) {
  const contact = { email, listIds: [list], updateEnabled: true };
  const withAnswers = await call(key, "/contacts", { ...contact, attributes });
  if (withAnswers.ok) return true;
  const without = await call(key, "/contacts", contact);
  return without.ok;
}

// Best effort on purpose: a stored lead whose confirmation bounced is a lead,
// and the only real failure is the store, which is answered before this runs.
async function confirm(key, email, language) {
  const mail = MAIL[language] || MAIL.en;
  try {
    const response = await call(key, "/smtp/email", {
      sender: SENDER,
      replyTo: SENDER,
      to: [{ email }],
      subject: mail.subject,
      htmlContent: html(mail),
      textContent: mail.text,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function handleWaitlist(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "body" }, 400);
  }
  if (!body || typeof body !== "object") return json({ ok: false, error: "body" }, 400);

  // A field no person can see and a bot fills in anyway. Answering as if it
  // worked costs the bot its certainty and costs a person nothing.
  if (text(body.website)) return json({ ok: true });

  const email = text(body.email).toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ ok: false, error: "email" }, 400);
  }

  const key = env.BREVO_API_KEY;
  const list = Number(env.BREVO_LIST_ID);
  if (!key || !Number.isInteger(list) || list <= 0) {
    // The only 500 this route has, and it always means the same thing: the
    // Worker is missing its two variables. It is logged because the deployment
    // it happens on is the only place that can say which one is absent.
    console.error("waitlist: BREVO_API_KEY or BREVO_LIST_ID is not set on the Worker");
    return json({ ok: false, error: "config" }, 500);
  }

  const attributes = {};
  for (const [field, name] of Object.entries(ATTRIBUTES)) {
    let answer = text(body[field]);
    if (answer === "__other") {
      const detail = text(body[`${field}_other`]);
      if (!detail || detail.length > 100) {
        return json({ ok: false, error: "answer" }, 400);
      }
      answer = `Otro: ${detail}`;
    }
    if (!answer || answer.length > 120) {
      return json({ ok: false, error: "answer" }, 400);
    }
    attributes[name] = answer;
  }

  if (!(await save(key, list, email, attributes))) {
    console.error("waitlist: Brevo refused the contact");
    return json({ ok: false, error: "store" }, 502);
  }

  const confirmationSent = await confirm(key, email, body.lang === "es" ? "es" : "en");
  return json({ ok: true, confirmationSent });
}
