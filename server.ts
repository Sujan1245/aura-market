import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// API Routes
app.post("/api/recommendations", async (req, res) => {
  try {
    const { activity, products } = req.body;

    const prompt = `
      Based on the following user activity: ${JSON.stringify(activity)}
      Recommend 4 product IDs from this catalog: ${JSON.stringify(products)}
      Return only the IDs in an array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const recommendedIds = JSON.parse(response.text || "[]");
    res.json({ recommendationIds: recommendedIds });
  } catch (error: any) {
    console.error("Recommendation error:", error);
    res.json({ recommendationIds: [] });
  }
});

app.post("/api/analyze-image", async (req, res) => {
  try {
    const { image } = req.body; // base64

    const prompt = "Describe the main fashion or tech product in this image with a few keywords for searching.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } }
          ]
        }
      ]
    });

    res.json({ query: response.text || "" });
  } catch (error: any) {
    console.error("Image analysis error:", error);
    res.json({ query: "gadget" }); // Simple fallback query
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const { query: searchQuery, products } = req.body;

    const prompt = `
      You are an AI shopping assistant. The user is searching for: "${searchQuery}".
      
      1. Review our local catalog: ${JSON.stringify(products)}
      2. Identify IDs of matching local products.
      3. "Discover" 6 additional high-quality products from the "global web" that match this search. 
         These should be premium, desirable items. 
         For each discovered product, generate: 
         - A catchy Name
         - A realistic Price (number)
         - A Category
         - A compelling Description
         - A high-quality, relevant Unsplash image URL (use format: https://images.unsplash.com/photo-[id]?w=800)

      Return a JSON object with this structure:
      {
        "localIds": string[],
        "discovered": Array<{ name, price, category, description, imageUrl, tags: string[] }>
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            localIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            discovered: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  imageUrl: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "price", "category", "description", "imageUrl"]
              }
            }
          },
          required: ["localIds", "discovered"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"localIds":[], "discovered":[]}');
    res.json(result);
  } catch (error: any) {
    console.error("Search error:", error);
    res.json({ localIds: [], discovered: [] });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, context } = req.body;

    const systemInstruction = `
      You are "Aura Superintelligence", a highly intelligent and helpful shopping assistant for AuraMarket.
      Current Context: ${JSON.stringify(context)}
      Be concise and sophisticated.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        })),
        config: {
            systemInstruction
        }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.json({ text: "I'm currently processing a high volume of requests. How else can I assist you with our catalog?" });
  }
});

let cachedTrending: any = null;
let lastTrendingFetch = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

app.get("/api/trending", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedTrending && (now - lastTrendingFetch < CACHE_DURATION)) {
      return res.json({ products: cachedTrending });
    }

    const prompt = "Discover 8 trending, high-end lifestyle and tech products.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              imageUrl: { type: Type.STRING }
            },
            required: ["id", "name", "price", "category", "description", "imageUrl"]
          }
        }
      }
    });

    const products = JSON.parse(response.text || "[]");
    if (products.length === 0) throw new Error("Empty trending");
    cachedTrending = products;
    lastTrendingFetch = now;
    res.json({ products });
  } catch (error: any) {
    console.error("Trending error:", error);
    // Return hardcoded fallback trending if API fails
    const fallbacks = [
        { id: 't1', name: 'Aura Vision Pro Goggles', price: 3499, category: 'Vision', description: 'Next-gen spatial computing.', imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800' },
        { id: 't2', name: 'Zenith Audio Studio', price: 549, category: 'Audio', description: 'Legendary sound quality.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
        { id: 't3', name: 'Smart Flux Watch', price: 399, category: 'Wearables', description: 'Track every heartbeat.', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800' },
        { id: 't4', name: 'Minimalist Leather Carry', price: 129, category: 'Fashion', description: 'Italian leather craftsmanship.', imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800' },
        { id: 't5', name: 'Vortex Sonic Speaker', price: 199, category: 'Audio', description: 'Room-filling spatial audio.', imageUrl: 'https://images.unsplash.com/photo-1608156639585-34052e81c968?w=800' },
        { id: 't6', name: 'Pulse Fitness Ring', price: 299, category: 'Wearables', description: 'Health tracking on your finger.', imageUrl: 'https://images.unsplash.com/photo-1610940882244-1fbcfe92fca1?w=800' },
        { id: 't7', name: 'Sky-Path Pro Drone', price: 799, category: 'Electronics', description: 'Capture 8K cinematic footage.', imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800' },
        { id: 't8', name: 'Lunar Keyboard Elite', price: 249, category: 'Tech', description: 'Custom mechanical switches.', imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800' }
    ];
    res.json({ products: cachedTrending || fallbacks });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
