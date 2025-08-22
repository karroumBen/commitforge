import { exec } from "child_process";
import * as util from "util";
import * as vscode from "vscode";

const execAsync = util.promisify(exec);

// Get workspace root (first folder in VSCode workspace)
function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}

async function runGitCommand(command: string) {
  const cwd = getWorkspaceRoot();
  if (!cwd) throw new Error("No workspace folder found.");
  return await execAsync(command, { cwd });
}

// ✅ Get staged files
export async function getStagedFiles(): Promise<string[]> {
  const { stdout } = await runGitCommand("git diff --cached --name-only");
  return stdout.split("\n").filter((line) => line.trim().length > 0);
}

// ✅ Get staged diff for a specific file
export async function getDiff(file: string): Promise<string> {
  const { stdout } = await runGitCommand(`git diff --cached -- "${file}"`);
  return stdout;
}

export async function insertCommitMessage(message: string) {
  try {
    // Get the built-in Git extension
    const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
    if (!gitExtension) {
      vscode.window.showErrorMessage("Git extension not found.");
      return;
    }

    const git = gitExtension.getAPI(1);

    // Get the first repository
    const repo = git.repositories[0];
    if (!repo) {
      vscode.window.showErrorMessage("No Git repository found.");
      return;
    }

    // ✅ Set the commit message into the Source Control input box
    repo.inputBox.value = message;

    vscode.window.showInformationMessage("Commit message inserted!");
  } catch (err) {
    vscode.window.showErrorMessage(`Could not access SCM input box: ${err}`);
  }
}
