import OpenAI from "openai";

export async function POST(req: Request) {
  const body = await req.json();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional trading coach." },
      { role: "user", content: JSON.stringify(body) }
    ]
  });

  return new Response(JSON.stringify({
    result: completion.choices[0].message.content
  }));
}