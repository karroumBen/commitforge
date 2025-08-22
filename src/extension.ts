import * as vscode from "vscode";
import { SidebarProvider } from "./sidebarProvider";
import { OAuthManager } from "./oauth";
import { OAUTH_PROVIDERS } from "./providers";
import { generateAIMessage } from "./aiUtils";
import { getStagedFiles, getDiff } from "./gitUtils";

// Constants
const COMMANDS = {
  GENERATE: "aiCommitForge.generate",
  GENERATE_TEST: "aiCommitForge.generateTestMessage",
  OPEN_CONFIG: "aiCommitForge.openConfig",
} as const;

const MESSAGES = {
  NO_STAGED_FILES: "No staged files found.",
  NO_DIFFS: "No diffs found for staged files.",
  NO_GIT_REPO: "No Git repository detected.",
  COMMIT_INSERTED: "Commit message generated and inserted.",
  EXTENSION_ACTIVATED: "AI Commit Forge activated successfully",
  EXTENSION_DEACTIVATED: "AI Commit Forge deactivated",
} as const;

interface Services {
  oauth: OAuthManager;
  sidebar: SidebarProvider;
}

/**
 * Extension activation entry point
 */
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const services = await initializeServices(context);
    registerProviders(context, services);
    registerCommands(context, services);

    console.log(MESSAGES.EXTENSION_ACTIVATED);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Extension activation failed:", errorMessage);
    await vscode.window.showErrorMessage(
      `Failed to activate AI Commit Forge: ${errorMessage}`
    );
  }
}

/**
 * Extension deactivation cleanup
 */
export function deactivate(): void {
  console.log(MESSAGES.EXTENSION_DEACTIVATED);
}

/**
 * Initialize core services
 */
async function initializeServices(
  context: vscode.ExtensionContext
): Promise<Services> {
  const oauth = new OAuthManager(context, OAUTH_PROVIDERS);
  const sidebar = new SidebarProvider(context, oauth);

  return { oauth, sidebar };
}

/**
 * Register all providers with proper error handling
 */
function registerProviders(
  context: vscode.ExtensionContext,
  services: Services
): void {
  const registrations = [
    () => vscode.window.registerUriHandler(services.oauth),
    () =>
      vscode.window.registerWebviewViewProvider(
        "aiCommitForge.sidebar",
        services.sidebar
      ),
  ];

  registrations.forEach((register) => {
    try {
      context.subscriptions.push(register());
    } catch (error) {
      console.error("Failed to register provider:", error);
    }
  });
}

/**
 * Register all extension commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  services: Services
): void {
  const commandHandlers = new Map([
    [COMMANDS.GENERATE, () => handleGenerateCommit(context)],
    [COMMANDS.GENERATE_TEST, () => handleTestGeneration(context)],
    [COMMANDS.OPEN_CONFIG, handleOpenConfig],
  ]);

  commandHandlers.forEach((handler, commandId) => {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
      try {
        await handler();
      } catch (error) {
        await handleCommandError(commandId, error);
      }
    });

    context.subscriptions.push(disposable);
  });
}

/**
 * Handle main commit message generation
 */
async function handleGenerateCommit(
  context: vscode.ExtensionContext
): Promise<void> {
  const stagedFiles = await getStagedFiles();

  if (!validateStagedFiles(stagedFiles)) {
    return;
  }

  const combinedDiff = await buildCombinedDiff(stagedFiles);

  if (!validateDiff(combinedDiff)) {
    return;
  }

  const commitMessage = await generateCommitMessage(
    context,
    stagedFiles,
    combinedDiff
  );
  await insertIntoGitSCM(commitMessage);

  await vscode.window.showInformationMessage(MESSAGES.COMMIT_INSERTED);
}

/**
 * Handle test message generation
 */
async function handleTestGeneration(
  context: vscode.ExtensionContext
): Promise<void> {
  const testMessage = await generateAIMessage({
    context,
    fileName: "test",
    diff: "Added a function and updated docs.",
  });

  await vscode.window.showInformationMessage(
    `Test generation successful: ${testMessage}`
  );
}

/**
 * Handle opening configuration
 */
function handleOpenConfig(): void {
  vscode.commands.executeCommand("workbench.view.extension.aiCommitForge");
}

/**
 * Validate staged files
 */
function validateStagedFiles(stagedFiles: string[]): boolean {
  if (stagedFiles.length === 0) {
    vscode.window.showInformationMessage(MESSAGES.NO_STAGED_FILES);
    return false;
  }
  return true;
}

/**
 * Validate diff content
 */
function validateDiff(diff: string): boolean {
  if (!diff.trim()) {
    vscode.window.showInformationMessage(MESSAGES.NO_DIFFS);
    return false;
  }
  return true;
}

/**
 * Build combined diff from staged files
 */
async function buildCombinedDiff(stagedFiles: string[]): Promise<string> {
  const diffPromises = stagedFiles.map(async (file) => {
    const diff = await getDiff(file);
    return diff?.trim() ? `\n# File: ${file}\n${diff}\n` : null;
  });

  const diffs = await Promise.all(diffPromises);

  return diffs.filter((diff): diff is string => diff !== null).join("");
}

/**
 * Generate AI commit message
 */
async function generateCommitMessage(
  context: vscode.ExtensionContext,
  stagedFiles: string[],
  diff: string
): Promise<string> {
  return generateAIMessage({
    context,
    fileName: stagedFiles.join(", "),
    diff,
  });
}

/**
 * Insert commit message into Git SCM input
 */
async function insertIntoGitSCM(message: string): Promise<void> {
  const repository = await getGitRepository();

  if (!repository) {
    throw new Error(MESSAGES.NO_GIT_REPO);
  }

  repository.inputBox.value = message;
}

/**
 * Get Git repository with proper error handling
 */
async function getGitRepository(): Promise<any> {
  const gitExtension = vscode.extensions.getExtension("vscode.git");

  if (!gitExtension) {
    throw new Error("Git extension not found");
  }

  const gitApi = gitExtension.exports?.getAPI(1);

  if (!gitApi?.repositories?.length) {
    return null;
  }

  return gitApi.repositories[0];
}

/**
 * Handle command execution errors
 */
async function handleCommandError(
  commandId: string,
  error: unknown
): Promise<void> {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";

  console.error(`Command ${commandId} failed:`, errorMessage);

  await vscode.window.showErrorMessage(`Command failed: ${errorMessage}`, {
    modal: false,
  });
}
