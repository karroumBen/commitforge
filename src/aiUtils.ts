import * as vscode from "vscode";
import { fetch } from "undici";
import { getActiveProvider, getApiKey } from "./secrets";

export async function generateAIMessage({
  context,
  fileName,
  diff,
}: {
  context: vscode.ExtensionContext;
  fileName: string;
  diff: string;
}): Promise<string> {
  const provider = getActiveProvider(context);

  const prompt = `Generate a concise git commit message (max 20 words).\nFiles: ${fileName}\nDiff:\n${diff}\nCommit message:`;

  let text = "update changes";

  try {
    if (provider === "gemini") {
      const key = await getApiKey(context, "gemini");
      if (!key) throw new Error("Gemini API key not set.");
      // Minimal HTTP call to Gemini REST (model name adjustable)
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          encodeURIComponent(key),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      const data: any = await res.json();
      text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "gemini could not generate a commit message.";
    } else if (provider === "openai") {
      const key = await getApiKey(context, "openai");
      if (!key) throw new Error("OpenAI API key not set.");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 64,
        }),
      });
      const data: any = await res.json();
      text =
        data?.choices?.[0]?.message?.content?.trim() ||
        "openai could not generate a commit message.";
    } else if (provider === "ollama") {
      const base =
        (await context.secrets.get("aich.ollama.baseUrl")) ||
        "http://localhost:11434";
      const res = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3", prompt }),
      });
      const data: any = await res.json();
      text = data?.response?.trim() || "update changes";
    }
  } catch (e: any) {
    vscode.window.showErrorMessage(
      `Generation error (${provider}): ${e.message}`
    );
  }

  // Enforce 15-word cap
  const words = text.split(/\s+/).filter(Boolean).slice(0, 20);
  return words.join(" ");
}
