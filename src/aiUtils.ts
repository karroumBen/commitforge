import * as vscode from "vscode";
import { fetch } from "undici";
import { getActiveProvider, getApiKey } from "./secrets";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export function normalizeOllamaBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function getOllamaBaseUrl(
  context: vscode.ExtensionContext,
  override?: string
): Promise<string> {
  const fromSecret = await context.secrets.get("aich.ollama.baseUrl");
  const fromConfig = vscode.workspace
    .getConfiguration("aiCommitHelper")
    .get<string>("ollama.url");
  return normalizeOllamaBaseUrl(
    override?.trim() || fromSecret || fromConfig || DEFAULT_OLLAMA_URL
  );
}

export async function listOllamaModels(baseUrl: string): Promise<string[]> {
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(`${baseUrl}/api/tags`);
  } catch (error: any) {
    throw new Error(
      `Could not reach Ollama at ${baseUrl}. Is \`ollama serve\` running? (${error?.message ?? error})`
    );
  }

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.error || `Ollama at ${baseUrl} returned HTTP ${res.status}.`
    );
  }

  return Array.isArray(data?.models)
    ? data.models
        .map((model: { name?: string }) => model?.name)
        .filter((name: string | undefined): name is string => Boolean(name))
    : [];
}

async function resolveOllamaModel(
  context: vscode.ExtensionContext,
  baseUrl: string
): Promise<string> {
  const fromSecret = (await context.secrets.get("aich.ollama.model"))?.trim();
  const fromConfig = vscode.workspace
    .getConfiguration("aiCommitHelper")
    .get<string>("ollama.model")
    ?.trim();
  if (fromSecret) return fromSecret;
  if (fromConfig) return fromConfig;

  const models = await listOllamaModels(baseUrl);
  if (!models.length) {
    throw new Error(
      `Connected to Ollama at ${baseUrl}, but no models are installed. Run \`ollama pull <model>\`.`
    );
  }
  return models[0];
}

export async function testOllamaConnection(
  context: vscode.ExtensionContext,
  overrideUrl?: string
): Promise<string> {
  const baseUrl = await getOllamaBaseUrl(context, overrideUrl);
  const models = await listOllamaModels(baseUrl);
  if (!models.length) {
    return `Connected to ${baseUrl}, but no models are installed. Run \`ollama pull <model>\`.`;
  }
  return `Connected to ${baseUrl}. Models: ${models.join(", ")}`;
}

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
      const base = await getOllamaBaseUrl(context);
      const model = await resolveOllamaModel(context, base);
      const res = await fetch(`${base}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          think: false,
          options: { num_predict: 40 },
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        throw new Error(
          data?.error || `Ollama request failed (HTTP ${res.status}).`
        );
      }
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
