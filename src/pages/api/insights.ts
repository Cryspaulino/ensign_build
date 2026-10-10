import { GoogleGenAI } from "@google/genai";
import type { APIRoute } from "astro";

// export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { checkins } = await request.json();

    if (!Array.isArray(checkins) || checkins.length > 100) {
      return new Response("Invalid check-ins", { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: import.meta.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Analyze these mood and habit check-ins: ${JSON.stringify(checkins)}.
                       Identify possible patterns supported by the data.
                       Return JSON with keys: insights (array), experiment (string), max 2.
                       If uncertaint and insufficient data, invite to check in more days`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return new Response(response.text ?? "{}", {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Gemini error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
