import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "./config";

export async function verifyProof(condition: string, proof: string): Promise<boolean> {
    console.log(`[Verifier] Verify requested: Condition='${condition}', Proof='${proof}'`);

    // 1. Basic Heuristic / Mock Check
    if (!proof || proof.length < 5) {
        console.log("[Verifier] Proof too short. Rejected.");
        return false;
    }

    // 2. AI Verification (Gemini)
    if (CONFIG.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
        You are an impartial automated payment verifier.
        
        Condition for payment: "${condition}"
        Proof submitted by worker: "${proof}"
        
        Task: Determine if the proof reasonably satisfies the condition.
        
        Reply ONLY with "YES" if satisfied, or "NO" if not. Do not add any other text.
      `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text().trim().toUpperCase();

            console.log(`[Verifier] Gemini Response: ${text}`);

            if (text.includes("YES")) return true;
            if (text.includes("NO")) return false;

            console.warn("[Verifier] Ambiguous AI response, defaulting to FALSE");
            return false;

        } catch (error) {
            console.error("[Verifier] AI Verification Failed:", error);
            return false; // Fail safe
        }
    } else {
        console.log("[Verifier] No GEMINI_API_KEY provided. Using mock logic (Accept everything length > 10).");
        return proof.length > 10;
    }
}
