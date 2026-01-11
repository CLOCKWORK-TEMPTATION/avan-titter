import { NextResponse } from "next/server";

type ChatMessage = { role: string; content: string };

type ChatRequestBody = {
  model?: string;
  messages?: ChatMessage[];
};

const extractFirstText = (data: any): string => {
  const candidates = data?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";

  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return "";

  for (const p of parts) {
    if (typeof p?.text === "string" && p.text.trim()) return p.text;
  }

  return "";
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatRequestBody;
    const model = body?.model || "gemini-3-flash-preview";
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    const prompt = messages
      .map((m) => `${String(m.role || "user")}: ${String(m.content || "")}`)
      .join("\n\n")
      .trim();

    if (!prompt) {
      return NextResponse.json({ error: "Empty prompt" }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const upstreamRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        { error: "Gemini request failed", details: errText },
        { status: 502 }
      );
    }

    const data = await upstreamRes.json();
    const content = extractFirstText(data);

    if (!content) {
      return NextResponse.json(
        { error: "Empty Gemini response", raw: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: "Unhandled error", details: String(error) },
      { status: 500 }
    );
  }
}
