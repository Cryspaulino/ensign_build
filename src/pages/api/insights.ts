import { GoogleGenAI } from "@google/genai";
import type { APIRoute } from "astro";

// export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { category, checkins } = await request.json();

    if (
      !["work", "personal"].includes(category) ||
      !Array.isArray(checkins) ||
      checkins.length > 100
    ) {
      return new Response("Invalid category or check-ins", {
        status: 400,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: import.meta.env.GEMINI_API_KEY,
    });

    const prompt = `
        Analyze these ${category} mood and habit check-ins:
        ${JSON.stringify(checkins)}
        Focus only on ${category === "work" ? "work life, workload, focus, and work stress" : "personal life, relationships, leisure, and personal well-being"}.

        Identify recurring patterns supported by the data. Do not invent correlations or claim to measure dopamine, serotonin, or other brain chemicals.

        Return valid JSON with exactly these keys:
        {
          "insights": [
            {
              "pattern": "A possible pattern",
              "evidence": "Specific evidence from the check-ins",
              "confidence": "low, medium, or high",
              "habitLikelihood": null
            }
          ],
          "experiment": "One practical action to try"
        }

        Rules:
        - Return at most 2 insights.
        - habitLikelihood is a percentage from 0 to 100 only if the data supports a meaningful estimate of habit formation; otherwise use null.
        - Do not present this percentage as a scientifically validated prediction.
        - If fewer than 3 check-ins exist or evidence is insufficient, return:
        {
          "insights": [],
          "experiment": "You are on track! Check in 2 more days to help identify possible patterns."
        }
        `;

    let response;

    for (const model of ["gemini-3.5-flash", "gemini-3.5-flash-lite"]) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response?.text) break;
      } catch (error) {
        console.error(`${model} failed:`, error);
      }
    }

    if (!response?.text) {
      return new Response(JSON.stringify({ error: "All AI models failed" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Insights API error:", error);

    return new Response(
      JSON.stringify({ error: "Could not generate insights" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
