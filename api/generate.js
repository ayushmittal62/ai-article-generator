export const config = {
  runtime: "edge",
};

export default async function handler(req) {

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse body
  let topic;
  try {
    const body = await req.json();
    topic = body?.topic?.trim();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!topic) {
    return new Response(
      JSON.stringify({ error: "Topic is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not set in environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a professional article writer. Write clear, engaging, well-structured articles. Do not include any reasoning or thinking process — output only the final article.",
            },
            {
              role: "user",
              content: `Write a 500-word article on: ${topic}. Structure it with a title, Introduction, 2-3 body sections with subheadings, and a Conclusion.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: `Groq API error: ${groqRes.status}`, details: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await groqRes.json();
    const article = data?.choices?.[0]?.message?.content;

    if (!article) {
      return new Response(
        JSON.stringify({ error: "No article content in Groq response" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, article }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}