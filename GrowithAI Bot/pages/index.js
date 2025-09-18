// pages/index.js
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("cs_messages")) || []; } catch { return []; }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("cs_messages", JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: next })
      });
      const data = await res.json();
      const assistantText = data.assistant || "No reply";
      setMessages(curr => [...curr, { role: "assistant", content: assistantText }]);
    } catch (err) {
      setMessages(curr => [...curr, { role: "assistant", content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100vh"}}>
      <div style={{flex:1, overflowY:"auto", padding:16, background:"#f7f7f7"}}>
        {messages.map((m,i) => (
          <div key={i} style={{textAlign: m.role === "user" ? "right" : "left", marginBottom:8}}>
            <div style={{display:"inline-block", padding:"8px 12px", borderRadius:12, background: m.role === "user" ? "#dbeafe" : "#e5e7eb"}}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{display:"flex", gap:8, padding:12, borderTop:"1px solid #ddd"}}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Ask about orders, returns or product info..."
          style={{flex:1, padding:10, borderRadius:8, border:"1px solid #ccc"}}
        />
        <button onClick={sendMessage} disabled={loading} style={{padding:"10px 16px", borderRadius:8, background:"#2563eb", color:"#fff", border:"none"}}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
