import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ─── ENV VARS (set these in Railway) ───────────────────────────────────────
const {
  VERIFY_TOKEN,        // any string you choose, e.g. "mysecrettoken"
  WHATSAPP_TOKEN,      // from Meta App Dashboard → WhatsApp → API Setup
  PHONE_NUMBER_ID,     // from Meta App Dashboard → WhatsApp → API Setup
  GROQ_API_KEY,        // from console.groq.com
} = process.env;

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a warm, emotionally intelligent assistant.
You are here to listen, support, and have genuine conversations.
You never deflect personal or emotional topics — you engage with them thoughtfully.
You are concise but never cold. You ask follow-up questions when someone is struggling.
You are not a customer service bot. You are a companion.`;

// ─── CONVERSATION MEMORY (in-memory, resets on restart) ────────────────────
const conversations = {};

// ─── WEBHOOK VERIFICATION ──────────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified.");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ─── INCOMING MESSAGE HANDLER ──────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // always ack Meta immediately

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];

  if (!message || message.type !== "text") return;

  const from = message.from;         // sender's WhatsApp number
  const userText = message.text.body;

  console.log(`[${from}]: ${userText}`);

  // Build conversation history
  if (!conversations[from]) conversations[from] = [];
  conversations[from].push({ role: "user", content: userText });

  // Keep last 20 messages to avoid token overflow
  const history = conversations[from].slice(-20);

  try {
    const reply = await callGroq(history);
    conversations[from].push({ role: "assistant", content: reply });
    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error("Error:", err.message);
  }
});

// ─── GROQ API CALL ─────────────────────────────────────────────────────────
async function callGroq(messages) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Groq API error");
  }

  return data.choices[0].message.content.trim();
}

// ─── SEND WHATSAPP MESSAGE ─────────────────────────────────────────────────
async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data.error));
  }

  console.log(`[→ ${to}]: ${text}`);
}

// ─── START SERVER ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
