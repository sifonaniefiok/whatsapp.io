# WhatsApp Bot — Groq + Llama 3.3

A WhatsApp bot powered by Groq's free Llama 3.3 70B API. Emotionally intelligent, no deflection.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Create a `.env` file (or set these in Railway):

```
VERIFY_TOKEN=choose_any_secret_string
WHATSAPP_TOKEN=your_meta_whatsapp_token
PHONE_NUMBER_ID=your_meta_phone_number_id
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

### 3. Get your keys

**Groq API Key**
- Go to https://console.groq.com
- API Keys → Create new key

**WhatsApp Token + Phone Number ID**
- Go to https://developers.facebook.com
- Create App → Business type → Add WhatsApp product
- Under API Setup, copy the temporary access token and Phone Number ID
- For production, generate a permanent token via System Users

### 4. Deploy to Railway
- Push this folder to a GitHub repo
- Connect repo to Railway → it auto-detects Node.js
- Add all 4 env vars in Railway's Variables tab
- Copy your Railway public URL (e.g. https://your-bot.up.railway.app)

### 5. Configure Meta webhook
- In your Meta App → WhatsApp → Configuration
- Webhook URL: `https://your-bot.up.railway.app/webhook`
- Verify Token: same string you set in `VERIFY_TOKEN`
- Subscribe to: `messages`

## Customizing the bot
Edit the `SYSTEM_PROMPT` in `index.js` to change the bot's personality and behavior.

## Notes
- Conversation history is stored in memory — resets when the server restarts
- For persistence, swap the `conversations` object for a Supabase table
- Free Groq tier: 14,400 requests/day on Llama 3.3 70B
