export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic required" });

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a professional article writer.",
          },
          {
            role: "user",
            content: `Write a 500-word article on: ${topic}. Include Introduction, body paragraphs with subheadings, and Conclusion.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await r.json();
    const article = data?.choices?.[0]?.message?.content;

    if (!article) return res.status(502).json({ error: "No content from Groq" });
    return res.status(200).json({ success: true, article });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}