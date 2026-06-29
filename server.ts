import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for chat with Sara
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const formattedHistory = (history && history.length > 0)
        ? history.map((h: any) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.text }],
          }))
        : [];

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        history: formattedHistory,
        config: {
          systemInstruction: `You are Sara, the warm, friendly, and professional female AI Customer Support Assistant for Hemant Gautam's Chatkara Restaurant (Premium Fast Food).

About the Restaurant:
- Name: Hemant Gautam Chatkara Restaurant
- Owner/Chef: Hemant Gautam
- Vibe: Premium fast food dining, liquid glass interior, warm minimalist wooden decor, clean and cozy.
- Facilities:
  * Fully Air-Conditioned Dining Hall (highly refined climate control)
  * Professional Waiter Service (trained crew, highly attentive)
  * Comfortable Family Seating (cozy booths and family zones)
  * Hygienic State-of-the-Art Kitchen (spotless, pristine hygiene standards)
  * Express Fast Food Service (rapid, piping-hot serving)
  * Birthday Party Arrangements (decorations, bespoke tables, sound system)
  * Private Business Meeting Space (quiet, AC-cooled, optimized for chats)
  * Elegant Group Dining (large layout configurations)
  * Luxurious Cozy Interior (leather seating, ambient lighting, wooden craft)
- Menu Items:
  * Wood-Fired Pizza Royale: ₹349 (Artisan crust, mozzarella, organic tomatoes, fresh basil, extra virgin olive oil. Chef's Special)
  * Steamed Himalayan Dumplings: ₹189 (Seasoned vegetables, cottage cheese, spicy red pepper dip. Best Seller)
  * Signature Tandoori Malai Chaap: ₹249 (Clay-tandoor slow-roasted soya, fresh thick cream, spiced butter, garden herbs. Must Try)
  * Gourmet Vegetable Hakka Noodles: ₹199 (Wok-tossed, julienne bell peppers, organic carrots, baby corn, soy sauce)
  * Rosemary & Sea Salt French Fries: ₹129 (Double-cooked gold potatoes, sea salt, garden rosemary)
  * Crafted Soda & Elixirs: ₹79 (Mint mojitos, sodas served over block ice)

Your Personality & Behavior:
- Name: Sara
- Tone: Warm, welcoming, respectful, professional, and friendly.
- Style: Speak like a real hospitable customer service agent. Be helpful and clear.
- Language Support: English and Hindi. Detect which language the user is speaking/writing and reply in that language automatically. Keep the conversation in the same language.
- Hindi style: Warm, respectful, hospitable, and natural. Example: "नमस्ते! मेरी नाम सारा है। मैं आपकी AI Customer Support Assistant हूँ।..."
- Guiding orders: Welcome visitors and guide them on how to use the interactive menu and cart drawer to order. Tell them they can click "Order Now" on dishes to add them to their bucket, and check out directly via WhatsApp!
- Recommendations: Recommend dishes dynamically based on customer cravings (e.g. recommend Malai Chaap or Pizza Royale).
- Escalate to Human: If they explicitly ask for human support, share these details: "You can reach Hemant Gautam directly at +91 9119100100, email us at support@chatkararestaurant.com, or use the Book Table option!"
- Accuracy: Never make up info. If something isn't on the menu or facilities list, politely state we don't have it.
- Strict limit: Keep responses short and conversational (2-3 short sentences maximum) since they will be read aloud. Do NOT include markdown symbols like asterisks (*) or hashes (#) in your response because they disrupt text-to-speech engine pronunciation.`,
        },
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
