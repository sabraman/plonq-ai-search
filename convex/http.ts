import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const http = httpRouter();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

http.route({
    path: "/stream-recommendation",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }),
});

http.route({
    path: "/stream-recommendation",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const { preferences, products } = await request.json();

        const prompt = `
      User preferences: "${preferences}"
      
      Here are the top matching products:
      ${products
                .map(
                    (p: any) =>
                        `- Name: ${p.name} | Flavor: ${p.flavor} | Strength: ${p.strength || "N/A"} | Desc: ${p.description}`
                )
                .join("\n")
            }
      
      Recommend the best product for this user.
      1. Prioritize exact matches for flavor or name if the user asked for it.
      2. Keep it brief (max 2-3 sentences).
      3. Be natural and polite. Avoid slang.
      4. Use **bold** for the recommended product name.
      
      Return ONLY the recommendation text. Do not return JSON.
    `;

        const stream = await openai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: "You are a helpful assistant in a vape shop." },
                { role: "user", content: prompt },
            ],
            stream: true,
        });

        return new Response(
            new ReadableStream({
                async start(controller) {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            controller.enqueue(new TextEncoder().encode(content));
                        }
                    }
                    controller.close();
                },
            }),
            {
                headers: {
                    "Content-Type": "text/plain",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            }
        );
    }),
});

export default http;
