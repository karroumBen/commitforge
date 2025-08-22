import * as vscode from "vscode";

export async function startOAuthFlow(
  provider: string,
  context: vscode.ExtensionContext
) {
  const key = await vscode.window.showInputBox({
    prompt: `Enter API key for ${provider}`,
    ignoreFocusOut: true,
    password: true,
  });

  if (key) {
    await context.secrets.store(`aiCommitForge.${provider}.token`, key);
    vscode.window.showInformationMessage(`${provider} connected successfully!`);
  }
}

export async function getProviderToken(
  context: vscode.ExtensionContext,
  provider: string
) {
  return context.secrets.get(`aiCommitForge.${provider}.token`);
}

export async function clearToken(
  context: vscode.ExtensionContext,
  provider: string
) {
  await context.secrets.delete(`aiCommitForge.${provider}.token`);
  vscode.window.showInformationMessage(`${provider} disconnected.`);
}
