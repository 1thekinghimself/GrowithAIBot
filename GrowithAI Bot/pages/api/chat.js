// pages/api/chat.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: "DEEPSEEK_API_KEY not configured" });
  }

  try {
    const { message, history = [] } = req.body;

    // Build system prompt using optional FAQ file
    const faqPath = path.join(process.cwd(), "data", "faqs.json");
    let faqText = "";
    if (fs.existsSync(faqPath)) {
      const faqs = JSON.parse(fs.readFileSync(faqPath, "utf8"));
      faqText = faqs.map((f, i) => `${i+1}. Q: ${f.q}\nA: ${f.a}`).join("\n\n");
    }

    const systemContent =
      "You are a helpful customer-support assistant for ACME Inc. Use the company FAQ when appropriate. If unsure, be honest and offer to escalate to human support.\n\n" +
      (faqText ? `FAQ:\n\n${faqText}` : "");

    const payload = {
      model: "deepseek-chat",       // pick appropriate model (deepseek-chat or reasoner)
      messages: [
        { role: "system", content: systemContent },
        ...history,
        { role: "user", content: message }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text });
    }

    const data = await resp.json();
    const assistant = data?.choices?.[0]?.message?.content ?? data?.result ?? "No response from model";

    return res.status(200).json({ assistant, raw: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
