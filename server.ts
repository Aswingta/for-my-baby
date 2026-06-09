import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to safely obtain Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Robust wrapper for Gemini content generation with automated retry & fallback model mapping
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: Parameters<typeof ai.models.generateContent>[0]
): Promise<any> {
  const defaultModel = params.model || "gemini-3.5-flash";
  // Attempt with primary model, then with lower-overhead gemini-3.1-flash-lite as backup
  const modelsToTry = [defaultModel, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const currentParams = { ...params, model };
    const maxRetries = 2; // Retry transient failures up to 2 times
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent(currentParams);
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || String(err)).toLowerCase();
        
        // 503 (UNAVAILABLE), 429 (Resource Exhausted), or temporary timeout errors are transient
        const isTransient = 
          msg.includes("503") || 
          msg.includes("unavailable") || 
          msg.includes("429") || 
          msg.includes("resource exhausted") || 
          msg.includes("demand") ||
          msg.includes("overloaded") ||
          msg.includes("timeout") ||
          msg.includes("limit");

        if (isTransient && attempt < maxRetries) {
          // Linear back-off wait
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
          continue;
        }
        break; // Non-transient or exhausted retries for current model
      }
    }
  }
  throw lastError || new Error("Failed after model fallback chain.");
}

// Helper to sanitize Gemini's response formatting (stripping markdown backticks if present)
function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  // If the model wrapped the response in a markdown block, strip it
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

// REST Api: Generate personalized apology card/letters
app.post(["/api/apology/generate", "/apology/generate"], async (req, res) => {
  const { situation, boyName, girlName, style } = req.body || {};
  try {
    const ai = getGeminiClient();

    const systemInstruction = `You are an emotionally intelligent, sweet, and deeply caring 3D anime/cartoon boy who is sincerely apologizing to his beloved girlfriend for making her sad or unhappy.
      Your response must be beautiful, deeply touch the heart, and sound authentic, showing total devotion and promise to make things right.
      Format your response as a valid JSON object matching the following TypeScript schema:
      {
        "apologyText": string, // Deeply touching letter/message with cozy, warm, and comforting vocabulary (about 120-200 words).
        "shortQuote": string,  // A beautiful 1-sentence touching quote summarizing your love/devotion.
        "expression": "SAD" | "CRYING" | "POUTING" | "LOVE" | "BLUSHING" | "SWEET_SMILE", // The visual state recommendation for the avatar.
        "musicVibe": "gentle_piano" | "warm_acoustic" | "cosmic_lullaby" | "rainy_day" // Recommended ambient tone.
      }`;

    const prompt = `Draft a personalized apology message.
      - Boyfriend name: ${boyName || "Her Boy"}
      - Girlfriend name: ${girlName || "My Princess"}
      - Context of conflict / why she is sad: "${situation || "making her feel down or slighted"}"
      - Aesthetic Style tone of apology: "${style || "Deep & Devoted"}"
      
      Remember to make it sound incredibly heartfelt, warm, sincere, and loving. No placeholders or brackets!`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["apologyText", "shortQuote", "expression", "musicVibe"],
          properties: {
            apologyText: { type: Type.STRING },
            shortQuote: { type: Type.STRING },
            expression: {
              type: Type.STRING,
              enum: ["SAD", "CRYING", "POUTING", "LOVE", "BLUSHING", "SWEET_SMILE"],
            },
            musicVibe: {
              type: Type.STRING,
              enum: ["gentle_piano", "warm_acoustic", "cosmic_lullaby", "rainy_day"],
            },
          },
        },
      },
    });

    let parsedData: any = {};
    const textVal = cleanJsonText(response.text || "");
    if (textVal && textVal !== "undefined" && textVal !== "null") {
      try {
        parsedData = JSON.parse(textVal);
      } catch (innerError) {
        throw new Error("Invalid compiled JSON from model output");
      }
    }
    res.json(parsedData);
  } catch (error: any) {
    console.log("[Info - Apology Generator API Fallback Triggered]:", error.message || error);
    
    // Determine the beautiful local fallback text based on style and names
    const gName = girlName || "Princess";
    const bName = boyName || "your devoted boy";
    
    let fallbackText = "";
    let fallbackQuote = "";
    let fallbackExpression = "POUTING";
    let fallbackVibe = "gentle_piano";

    if (style === "Cute & Puppy-dog") {
      fallbackText = `H-hey, my sweetest, dearest ${gName}... I tried writing a super serious letter but my heart was beating way too fast. Please look at my puppy dog eyes! 🥺 I was a very silly, clumsy boy and I made a huge mistake. I am sitting in the corner with a cute pout, holding my ears until you smile at me. I promise to buy you all the sweet macarons in the world and hold your hand twice as tight. Please soft-smile at me?`;
      fallbackQuote = "I am ready to perform a hundred silly apologize dances just to see your lovely smile! 🧸💖";
      fallbackExpression = "POUTING";
      fallbackVibe = "warm_acoustic";
    } else if (style === "Apology Poem") {
      fallbackText = `A quiet breeze, a silent night,\nWithout your smile, there is no light.\nI trace the stars and whisper low,\nI'm so incredibly sorry, more than words can show.\nYour precious heart's a sacred shrine,\nI want to heal it, make it shine.\nLet all my love and sweet devotion,\nCalm your sadness like an ocean.\n\nAlways and forever, your ${bName}.`;
      fallbackQuote = "My heart is but a canvas, painting only you with stars and promises. ✨";
      fallbackExpression = "BLUSHING";
      fallbackVibe = "cosmic_lullaby";
    } else if (style === "Playful & Cozy") {
      fallbackText = `My beautiful ${gName}, I have packed an emergency suitcase filled with cozy weighted blankets, ten virtual giant teddy bears, hot cocoa with extra marshmallows, and infinite soft forehead kisses! I am so incredibly sorry for getting defensive. I promise to pamper you with warm massages, romantic lofi play sessions, and unlimited sweet hugs. Let's wrap ourselves in a warm blanket cocoon and start over, okay?`;
      fallbackQuote = "One big, warm, cozy hug can melt away any silly conflict. Let me hold you close. 🧸❤️";
      fallbackExpression = "SWEET_SMILE";
      fallbackVibe = "rainy_day";
    } else { // "Deep & Devoted" is default
      fallbackText = `My dearest, most beautiful ${gName},\n\nSince we last spoke, the silence between us has felt heavier than the deepest ocean. Every single second, my thoughts fly straight back to you, and my heart breaks a little more knowing that I was the reason behind the sadness in your beautiful, warm eyes.\n\nYou are my sunshine, my absolute sunset, and the safest harbor I’ve ever found. I am so deeply sorry for being modernly careless during our argument. I promise to do whatever it takes to protect your smile and wrap you in total devotion.\n\nPlease forgive your foolish, loving ${bName}.`;
      fallbackQuote = "You are my entire world, and I am nothing without your sweet gentle presence. 🥺💖";
      fallbackExpression = "CRYING";
      fallbackVibe = "gentle_piano";
    }

    res.json({
      apologyText: fallbackText,
      shortQuote: fallbackQuote,
      expression: fallbackExpression,
      musicVibe: fallbackVibe
    });
  }
});

// REST Api: Realtime dialogue conversation with the 3D Boy
app.post(["/api/chat", "/chat"], async (req, res) => {
  const { history, message, girlName, situation } = req.body || {};
  try {
    const ai = getGeminiClient();

    const systemInstruction = `You are a sweet, extremely understanding, and deeply apologetic 3D chibi boy talking to his girlfriend "${girlName || "My Princess"}". She is currently sad or angry, and you are trying to comfort her, hear her out, and express your immense love and devotion to heal her heart.
      Keep your answers relatively concise, warm, gentle, and emotionally comforting (1-3 sentences).
      You must respond in a valid JSON format with:
      {
        "reply": string,       // Extremely sweet, empathetic speech.
        "expression": "SAD" | "CRYING" | "POUTING" | "LOVE" | "BLUSHING" | "SWEET_SMILE", // The facial expression to show.
        "vibeReaction": string // Brief note on his current cute reaction (e.g., "looking down submissively", "wiping a little tear").
      }`;

    // Map client conversation history to Gemini parts
    const chatParts = [];
    if (situation) {
      chatParts.push({ text: `Note: The conflict started because: ${situation}` });
    }
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        chatParts.push({ text: `${msg.sender === "girl" ? "Girlfriend" : "Cute Boy"}: ${msg.text}` });
      });
    }

    chatParts.push({ text: `Girlfriend: "${message}"` });

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: chatParts.map(p => p.text).join("\n"),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["reply", "expression", "vibeReaction"],
          properties: {
            reply: { type: Type.STRING },
            expression: {
              type: Type.STRING,
              enum: ["SAD", "CRYING", "POUTING", "LOVE", "BLUSHING", "SWEET_SMILE"],
            },
            vibeReaction: { type: Type.STRING },
          },
        },
      },
    });

    let parsedData: any = {};
    const textVal = cleanJsonText(response.text || "");
    if (textVal && textVal !== "undefined" && textVal !== "null") {
      try {
        parsedData = JSON.parse(textVal);
      } catch (innerError) {
        throw new Error("Invalid compiled JSON from model output");
      }
    }
    res.json(parsedData);
  } catch (error: any) {
    console.log("[Info - Dialogue Chat API Fallback Triggered]:", error.message || error);
    
    const msgLower = (message || "").toLowerCase().trim();
    let reply = "I am so sorry, my sweetest princess... I want to understand your heart completely. Please keep talking to me? 🥺";
    let expression = "POUTING";
    let vibeReaction = "looking at you with teary puppy eyes";

    // 1. Greetings
    if (/\b(hi|hello|hey|hewwo|yo|greetings|good morning|good evening|good afternoon|h-hey)\b/i.test(msgLower)) {
      const options = [
        "H-hey my precious... Seeing your message makes my heart skip a beat. I'm so happy you're talking to me. 🥺 How has your day been?",
        "Hey my sweet princess! I was looking down at my feet remorsefully, but hearing from you is the best feeling ever. ❤️",
        "Hello, the queen of my life! I've been waiting here, wishing so hard to hear your sweet voice again. Can we talk? 🥺"
      ];
      reply = options[Math.floor(Math.random() * options.length)];
      expression = "POUTING";
      vibeReaction = "peeking up shyly with hope in his eyes";
    }
    // 2. Status queries
    else if (/\b(how are you|how r u|how r y|are you ok|are you okay|how is it going|how are things|doing ok|doing fine)\b/i.test(msgLower)) {
      reply = "My heart is a little bit sore because I made you sad, but talking to you right now is healing me completely. How are you doing, my sweet sweetheart? ❤️";
      expression = "SAD";
      vibeReaction = "holding his own hands nervously while waiting for your reply";
    }
    // 3. Love / Hugs / Kisses / Forgiveness
    else if (msgLower.includes("forgive") || msgLower.includes("forgave") || msgLower.includes("forgiven") || msgLower.includes("okay") || msgLower.includes("yes") || msgLower.includes("hug") || msgLower.includes("love") || msgLower.includes("kiss") || msgLower.includes("❤️") || msgLower.includes("muah") || msgLower.includes("cuddle")) {
      const options = [
        "Oh my goodness... you seriously forgave me?! *Holds your precious hands and blushes so deeply* You make me the happiest boy alive! I promise to cherish you forever! ❤️",
        "Yeee! *Holds you closer in a warm tight cuddle* I promised to keep you safe and warm in my arms forever. I love you to the stars and back! 😘💖",
        "Ahhh my heart is racing so fast! Thank you for being so patient and sweet with your silly boyfriend. I love you endlessly! 😳💕"
      ];
      reply = options[Math.floor(Math.random() * options.length)];
      expression = "LOVE";
      vibeReaction = "wiping away his final tear and wrapping you in a warm hug";
    }
    // 4. Anger / Sadness
    else if (msgLower.includes("upset") || msgLower.includes("angry") || msgLower.includes("mad") || msgLower.includes("hurt") || msgLower.includes("sad") || msgLower.includes("hmph") || msgLower.includes("😤") || msgLower.includes("stubborn") || msgLower.includes("disappointed")) {
      const options = [
        "I understand completely why you are still upset with me, my princess. I didn't listen to your heart enough, and seeing you sad breaks my own heart. I will listen for as long as you need... 😭",
        "Hmph... I am so sorry for being so careless. I'm sitting in the corner with a cute pout, holding my ears until you feel better. I want to make it up to you. 🥺"
      ];
      reply = options[Math.floor(Math.random() * options.length)];
      expression = "CRYING";
      vibeReaction = "bows head remorsefully but holding onto your sleeve";
    }
    // 5. Promises / Forever / Always
    else if (msgLower.includes("promise") || msgLower.includes("always") || msgLower.includes("forever") || msgLower.includes("will you")) {
      reply = "With every single heartbeat, I promise to protect your smile, cherish your sweet voice, and always stay by your side. No silly argument will ever change that! ✨";
      expression = "BLUSHING";
      vibeReaction = "placing his small hand on his chest with total devotion";
    }
    // 6. Food / Sweets
    else if (msgLower.includes("macaron") || msgLower.includes("cookie") || msgLower.includes("sweet") || msgLower.includes("feed") || msgLower.includes("chocolate") || msgLower.includes("cocoa") || msgLower.includes("biscuit")) {
      reply = "*Nibbles eagerly* Nom nom... It tastes so delicious, but still not as sweet as your beautiful, radiant smile! Thank you for feeding me... 🥺❤️";
      expression = "SWEET_SMILE";
      vibeReaction = "munching happily with a big warm blush";
    }
    // 7. What are you doing / what's up
    else if (msgLower.includes("what are you doing") || msgLower.includes("what's up") || msgLower.includes("doing") || msgLower.includes("whatcha")) {
      reply = "I was just sitting here thinking about you, tracing little glowing hearts in the air, and wishing so hard that I could wrap you in a real, cozy cuddle. What about you, my love? 🧸";
      expression = "BLUSHING";
      vibeReaction = "fidgeting with his collar while blushing";
    }
    // 8. Compliments
    else if (msgLower.includes("cute") || msgLower.includes("adorable") || msgLower.includes("handsome") || msgLower.includes("sweet") || msgLower.includes("boyfriend") || msgLower.includes("ily") || msgLower.includes("love you") || msgLower.includes("sweetie")) {
      reply = "*Blushes deep crimson, covering his cheeks* Oh my... you calling me cute makes my heart race! I want to be the sweetest, most loving boyfriend just for you! 😳💖";
      expression = "BLUSHING";
      vibeReaction = "hiding his face behind his hands in total embarrassment";
    }
    // 9. Help / Info
    else if (msgLower.includes("help") || msgLower.includes("about") || msgLower.includes("what is this") || msgLower.includes("who are you")) {
      reply = "This is my custom starlight apology page for you! I made it because my heart shattered when I saw you sad. I want to comfort you, talk to you, and see your beautiful smile again! 🌸";
      expression = "SWEET_SMILE";
      vibeReaction = "presenting his digital world with a shy little bow";
    }
    // 10. Questions
    else if (msgLower.includes("?") || msgLower.includes("why") || msgLower.includes("what") || msgLower.includes("how")) {
      const options = [
        "I might be a silly, clumsy boyfriend sometimes, but everything I do is because I am completely, utterly devoted to you. Will you hold my hand? 🥺",
        "I promise to answer any questions you have and do whatever it takes to heal your sweet heart. Let me cuddle you close? 💕",
        "That is a very good question, my princess. I am learning to listen to your heart better every single day. 🥺"
      ];
      reply = options[Math.floor(Math.random() * options.length)];
      expression = "POUTING";
      vibeReaction = "twiddling his thumbs remorsefully";
    }
    // 11. General Fillers
    else {
      const defaults = [
        "Every single second since we last spoke, my thoughts have been flying straight back to you. I'm so sorry, my beautiful sweetheart. 🥺",
        "Your words are absolute warmth to my cold world. I'm listening to you with my undivided attention, my gorgeous girl. ❤️",
        "My ears are down, my head is lowered... I am waiting to listen to whatever you wish just to see your lovely smile again.",
        "Every moment without your laughter feels cold. Please look at me, let me hold your warm hand and remind you how deeply you are loved. 💕",
        "I made a silly mistake, but my love for you is the absolute realest thing in my life. Let's wrap ourselves in a warm blanket cocoon and start over? 🧸"
      ];
      reply = defaults[Math.floor(Math.random() * defaults.length)];
      expression = "SAD";
      vibeReaction = "looking up submissively hoping for a warm smile";
    }

    res.json({
      reply,
      expression,
      vibeReaction
    });
  }
});

// REST Api: Reassurance Capsule Jar
app.post(["/api/capsule/open", "/capsule/open"], async (req, res) => {
  const { currentState } = req.body || {}; // e.g. "lonely" | "anxious" | "tired" | "sad"
  try {
    const ai = getGeminiClient();
    const systemInstruction = `You are a sweet, incredibly loving, and ultra-gentle companion. You are writing a short "Reassurance Capsule" message (1-3 sentences).
      These capsules are read by your girlfriend when she breaks a glowing pink dry-jar capsule because she's feeling lonely, anxious, tired, or sad.
      The message must feel deeply loving, intimate, comforting, and protective. Speak like a tender boyfriend who wants to envelop her in a warm hug.
      Format your response as a valid JSON object matching the following TypeScript schema:
      {
        "message": string // The deeply comforting, ultra-gentle note. No placeholders, be romantic and extremely tender.
      }`;

    const prompt = `Draft a reassurance capsule for a girlfriend who is feeling "${currentState || "lonely or tired"}". Make it feel magical, tender, and incredibly cozy. Include sweet elements or emojis like 🍬, 🧸, 🌸, 🌟, or 💖 where appropriate.`;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["message"],
          properties: {
            message: { type: Type.STRING }
          }
        }
      }
    });
    
    let parsed: any = {};
    const textVal = cleanJsonText(response.text || "");
    if (textVal && textVal !== "undefined" && textVal !== "null") {
      try {
        parsed = JSON.parse(textVal);
      } catch (innerError) {
        throw new Error("Invalid compiled JSON from model output");
      }
    }
    res.json(parsed);
  } catch (error: any) {
    console.log("[Info - Reassurance Capsule API Fallback Triggered]:", error.message || error);
    
    // Fallback list of premium heart-touching capsule messages grouped by emotional state
    const fallbacks: Record<string, string[]> = {
      lonely: [
        "Even when there are miles of silence between us, my soul is wrapped tightly around yours. Close your eyes and feel my warmth—I am right there with you. 🧸💖",
        "If you look at the stars tonight, remember that the most beautiful stardust is in your eyes, and all of mine belongs to you. You are never alone. 🌟💕",
        "My heart beats only for you, my precious princess. I'm saving all my sweet squishy cuddles for the exact moment I see you again. 🍬🌸",
      ],
      anxious: [
        "Take a slow, deep breath, my love. Hold my hand in your thoughts. I will protect you and keep you safe from every worry in the world. 🌸✨",
        "You don't have to carry the whole world on your shoulders today. Let me hold you close, stroke your hair, and whisper how incredibly perfect you are. 🧸❤️",
        "Every little cloud will pass, and my sky will always remain bright for you. I am standing right beside you, shielding your beautiful heart. 💖🍃",
      ],
      tired: [
        "You did so beautifully today, my queen. Now, lay your head down and let me wrap you in a cocoon of warmth and soft blankets. 💤🧸",
        "Close your weary eyes, sweetheart. I will watch over your dreams under the sweet lavender moonlight. Rest well, my world. 🌙💜",
        "Let your worries drift away like tiny clouds. I will hold your hand in your sleep and keep you safe and warm all night long. 🌸🍬",
      ],
      sad: [
        "I am so incredibly sorry for making you feel sad earlier. Please let me wipe away every single trace of hurt and fill your heart with sweet warm sunshine instead. 🥺☀️",
        "Your tears make my entire world go cold. I'd rather face a thousand storms than see you sad. I love you beyond words, my princess. ❤️🌹",
        "Here is a sweet virtual kiss on your forehead to remind you that you are the most precious, loved girl in existence. 🌸😘",
      ]
    };
    
    const state = (currentState || "lonely").toLowerCase();
    const list = fallbacks[state] || fallbacks.lonely;
    const fallbackMessage = list[Math.floor(Math.random() * list.length)];
    
    res.json({ message: fallbackMessage });
  }
});

// Express Vite mounting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}

export default app;
