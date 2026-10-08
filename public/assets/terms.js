// Product terms shared by the build, the browser and the edge. Each one is a
// word the product owns, with a short explanation shown on hover, so a reader
// who does not know it does not have to leave the page.
const terms = {
  es: {
    messaging: ["(?:canal(?:es)?\\s+de\\s+)?mensajería",
      "Canales que conectas a Pautia: WhatsApp, Telegram, Signal y SimpleX Chat."],
    "smart-imports": ["Smart\\s+Imports?",
      "Propone un borrador del flujo a partir de tus chats, si lo autorizas."],
    "smart-routing": ["Smart\\s+Routing",
      "Elige el siguiente paso del flujo con IA. No redacta la respuesta."],
    "fuzzy-routing": ["fuzzy\\s+(?:routing|match)",
      "Elige el siguiente paso por similitud de texto, sin IA. No redacta la respuesta."],
    "visual-editor": ["editor\\s+visual",
      "Donde creas o ajustas el flujo sin programar."],
    "ai-credits": ["créditos\\s+(?:de\\s+)?IA",
      "Saldo mensual para las funciones de IA."],
    flow: ["flujos?(?:\\s+de\\s+atención)?",
      "El recorrido que sigue el agente: qué pregunta, responde o hace."],
    action: ["acciones|acción", "Una tarea del agente además de responder."],
    agent: ["agentes?|bots?", "El que atiende por tu canal de mensajería siguiendo tus reglas."],
    integration: ["integraciones|integración",
      "Conexión con tu sistema mediante una API REST o un servidor MCP compatible."],
    mcp: ["MCP", "Protocolo para usar herramientas externas como acciones autorizadas del flujo."],
    system: ["sistemas?",
      "El software de gestión de tu negocio: agenda, CRM, inventario o el que uses."],
    handoff: ["escalamiento|escalación|escalar|escala",
      "Cuando el agente se detiene y pasa la conversación a una persona."],
  },
  en: {
    messaging: ["messaging(?:[ -]+channels?)?",
      "Channels you connect to Pautia: WhatsApp, Telegram, Signal and SimpleX Chat."],
    "smart-imports": ["Smart\\s+Imports?",
      "Suggests a flow draft from your chats, if you authorize it."],
    "smart-routing": ["Smart\\s+Routing",
      "Picks the next step in the flow using AI. It does not write the reply."],
    "fuzzy-routing": ["fuzzy\\s+(?:routing|match)",
      "Picks the next step by text similarity, without AI. It does not write the reply."],
    "visual-editor": ["visual\\s+editor",
      "Where you build or adjust the flow without coding."],
    "ai-credits": ["AI\\s+credits", "Monthly allowance for AI features."],
    flow: ["(?:support\\s+)?flows?",
      "The path the agent follows: what it asks, answers or does."],
    action: ["actions?", "A task of the agent beyond replying."],
    agent: ["agents?|bots?", "Answers on your messaging channel, following your rules."],
    integration: ["integrations?",
      "A connection to your system through a compatible REST API or MCP server."],
    mcp: ["MCP", "A protocol for calling external tools as actions authorized by the flow."],
    system: ["systems?",
      "Your business's management software: calendar, CRM, inventory or whatever you use."],
    handoff: ["escalation|escalates?|handoff",
      "When the agent stops and hands the conversation to a person."],
  },
  pt: {
    messaging: ["(?:cana(?:l|is)\\s+de\\s+)?mensageria",
      "Canais que você conecta à Pautia: WhatsApp, Telegram, Signal e SimpleX Chat."],
    "smart-imports": ["Smart\\s+Imports?",
      "Propõe um rascunho do fluxo a partir dos seus chats, se você autorizar."],
    "smart-routing": ["Smart\\s+Routing",
      "Escolhe o próximo passo do fluxo com IA. Não redige a resposta."],
    "fuzzy-routing": ["fuzzy\\s+(?:routing|match)",
      "Escolhe o próximo passo por semelhança de texto, sem IA. Não redige a resposta."],
    "visual-editor": ["editor\\s+visual", "Onde você cria ou ajusta o fluxo sem programar."],
    "ai-credits": ["créditos\\s+(?:de\\s+)?IA", "Saldo mensal para os recursos de IA."],
    flow: ["fluxos?",
      "O percurso que o agente segue: o que pergunta, responde ou faz."],
    action: ["ações|ação", "Uma tarefa do agente além de responder."],
    agent: ["agentes?|bots?", "Atende no seu canal de mensageria seguindo suas regras."],
    integration: ["integrações|integração",
      "Conexão com seu sistema por uma API REST ou um servidor MCP compatível."],
    mcp: ["MCP", "Protocolo para chamar ferramentas externas como ações autorizadas pelo fluxo."],
    system: ["sistemas?",
      "O software de gestão do seu negócio: agenda, CRM, estoque ou o que você usa."],
    handoff: ["escalonamento|escalar|escala",
      "Quando o agente para e passa a conversa a uma pessoa."],
  },
  fr: {
    messaging: ["(?:cana(?:l|ux)\\s+de\\s+)?messagerie",
      "Canaux reliés à Pautia : WhatsApp, Telegram, Signal et SimpleX Chat."],
    "smart-imports": ["Smart\\s+Imports?",
      "Propose une ébauche du flux depuis vos conversations, si vous l'autorisez."],
    "smart-routing": ["Smart\\s+Routing",
      "Choisit l'étape suivante du flux avec l'IA. Ne rédige pas la réponse."],
    "fuzzy-routing": ["fuzzy\\s+(?:routing|match)",
      "Choisit l'étape suivante par similarité du texte, sans IA. Ne rédige pas la réponse."],
    "visual-editor": ["éditeur\\s+visuel", "Où vous créez ou ajustez le flux sans programmer."],
    "ai-credits": ["crédits\\s+IA", "Solde mensuel pour les fonctions d'IA."],
    flow: ["flux", "Le parcours suivi par l'agent : ce qu'il demande, répond ou fait."],
    action: ["actions?", "Une tâche de l'agent au-delà de répondre."],
    agent: ["agents?|bots?", "Répond sur votre canal de messagerie selon vos règles."],
    integration: ["intégrations?",
      "Connexion à votre système par une API REST ou un serveur MCP compatible."],
    mcp: ["MCP", "Protocole pour utiliser des outils externes comme actions autorisées du flux."],
    system: ["systèmes?",
      "Le logiciel de gestion de votre activité : agenda, CRM, stock ou celui que vous utilisez."],
    handoff: ["escalade|escalader",
      "Quand l'agent s'arrête et passe la conversation à une personne."],
  },
  de: {
    messaging: ["Messaging(?:-Kan(?:al|äle))?",
      "Kanäle für Pautia: WhatsApp, Telegram, Signal und SimpleX Chat."],
    "smart-imports": ["Smart\\s+Imports?",
      "Schlägt einen Ablaufentwurf aus Ihren Chats vor, wenn Sie es erlauben."],
    "smart-routing": ["Smart\\s+Routing",
      "Wählt den nächsten Ablaufschritt mit KI. Verfasst nicht die Antwort."],
    "fuzzy-routing": ["fuzzy\\s+(?:routing|match)",
      "Wählt den nächsten Schritt nach Textähnlichkeit, ohne KI. Verfasst nicht die Antwort."],
    "visual-editor": ["visuellen?\\s+Editor",
      "Hier bauen oder ändern Sie den Ablauf ohne Programmieren."],
    "ai-credits": ["KI-Credits", "Monatliches Guthaben für KI-Funktionen."],
    flow: ["Abläufe|Ablaufs|Ablauf",
      "Der Weg des Agenten: was er fragt, antwortet oder tut."],
    action: ["Aktion(?:en)?", "Eine Aufgabe des Agenten neben dem Antworten."],
    agent: ["Agent(?:en)?|Bots?", "Antwortet über Ihren Messaging-Kanal nach Ihren Regeln."],
    integration: ["Integrationen?",
      "Anbindung Ihres Systems über eine kompatible REST-API oder einen MCP-Server."],
    mcp: ["MCP", "Protokoll zum Aufruf externer Werkzeuge als im Ablauf erlaubte Aktionen."],
    system: ["System(?:e|en)?",
      "Die Verwaltungssoftware Ihres Geschäfts: Kalender, CRM, Lager oder was Sie nutzen."],
    handoff: ["Eskalation|eskalieren|eskaliert",
      "Wenn der Agent stoppt und das Gespräch an eine Person übergibt."],
  },
  it: {
    messaging: ["(?:canal(?:e|i)\\s+di\\s+)?messaggistica",
      "Canali collegati a Pautia: WhatsApp, Telegram, Signal e SimpleX Chat."],
    "smart-imports": ["Smart\\s+Imports?",
      "Propone una bozza del flusso dalle tue chat, se lo autorizzi."],
    "smart-routing": ["Smart\\s+Routing",
      "Sceglie il prossimo passo del flusso con IA. Non scrive la risposta."],
    "fuzzy-routing": ["fuzzy\\s+(?:routing|match)",
      "Sceglie il prossimo passo per somiglianza del testo, senza IA. Non scrive la risposta."],
    "visual-editor": ["editor\\s+visual", "Dove crei o modifichi il flusso senza programmare."],
    "ai-credits": ["crediti\\s+IA", "Saldo mensile per le funzioni IA."],
    flow: ["flussi|flusso", "Il percorso che l'agente segue: cosa chiede, risponde o fa."],
    action: ["azioni|azione", "Un compito dell'agente oltre a rispondere."],
    agent: ["agenti|agente|bots?",
      "Risponde sul tuo canale di messaggistica seguendo le tue regole."],
    integration: ["integrazioni|integrazione",
      "Connessione al tuo sistema tramite un'API REST o un server MCP compatibile."],
    mcp: ["MCP", "Protocollo per chiamare strumenti esterni come azioni autorizzate dal flusso."],
    system: ["sistemi|sistema",
      "Il software di gestione della tua attività: agenda, CRM, magazzino o quello che usi."],
    handoff: ["escalation|scalare|scala",
      "Quando l'agente si ferma e passa la conversazione a una persona."],
  },
};

export function escapeText(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

export function linkTerms(text, language) {
  const entries = Object.entries(terms[language] || terms.es);
  const patterns = entries.map(([, [pattern]]) => `(${pattern})`).join("|");
  const match = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${patterns})(?![\\p{L}\\p{N}_])`, "giu");
  let html = "";
  let end = 0;
  for (const found of text.matchAll(match)) {
    const index = found.slice(1).findIndex((group) => group !== undefined);
    const [id, [, hint]] = entries[index];
    html += escapeText(text.slice(end, found.index));
    html += `<button type="button" class="term" data-term="${id}"`;
    html += ` title="${escapeText(hint)}" aria-expanded="false">`;
    html += escapeText(found[0]) + "</button>";
    end = found.index + found[0].length;
  }
  return html + escapeText(text.slice(end));
}

// A translated element owns its text, including the term hints generated inside
// it. A small scan matches the whole element, so a hint nested in it does not
// end the element at its own closing tag.
export function translateTexts(html, table, language) {
  const opening = /<([a-z][\w-]*)([^>]*\sdata-i18n="([\w.-]+)"[^>]*)>/g;
  let out = "";
  let last = 0;
  let found;
  while ((found = opening.exec(html))) {
    const [whole, tag, attrs, key] = found;
    if (!table[key]) continue;
    const start = found.index + whole.length;
    const end = elementEnd(html, start, tag);
    if (end < 0) continue;
    out += html.slice(last, start);
    out += attrs.includes(" data-terms")
      ? linkTerms(table[key], language) : escapeText(table[key]);
    out += `</${tag}>`;
    last = end;
    opening.lastIndex = end;
  }
  return out + html.slice(last);
}

function elementEnd(html, from, tag) {
  const opens = new RegExp(`<${tag}(?=[\\s/>])`, "g");
  const closes = new RegExp(`</${tag}\\s*>`, "g");
  let depth = 1;
  let at = from;
  while (at < html.length) {
    opens.lastIndex = at;
    closes.lastIndex = at;
    const nextOpen = opens.exec(html);
    const nextClose = closes.exec(html);
    if (!nextClose) return -1;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      at = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      at = nextClose.index + nextClose[0].length;
      if (depth === 0) return at;
    }
  }
  return -1;
}
