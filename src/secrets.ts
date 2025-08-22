import * as vscode from "vscode";

export async function setApiKey(
  context: vscode.ExtensionContext,
  provider: "openai" | "gemini"
) {
  const pretty = provider === "openai" ? "OpenAI" : "Gemini";
  const key = await vscode.window.showInputBox({
    prompt: `Enter ${pretty} API key`,
    ignoreFocusOut: true,
    password: true,
    validateInput: v => (v.trim() ? undefined : "API key required")
  });
  if (!key) return;
  await context.secrets.store(`aich.${provider}.apiKey`, key.trim());
  await setActiveProvider(context, provider);
  vscode.window.showInformationMessage(`${pretty} connected.`);
}

export async function getApiKey(
  context: vscode.ExtensionContext,
  provider: "openai" | "gemini"
) {
  return context.secrets.get(`aich.${provider}.apiKey`);
}

export async function setActiveProvider(
  context: vscode.ExtensionContext,
  provider: string
) {
  await context.globalState.update("aich.activeProvider", provider);
}

export function getActiveProvider(context: vscode.ExtensionContext) {
  return (
    context.globalState.get<string>("aich.activeProvider") ||
    vscode.workspace.getConfiguration("aiCommitHelper").get<string>("activeProvider") ||
    "gemini"
  );
}
