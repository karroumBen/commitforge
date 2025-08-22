import * as vscode from "vscode";
import { OAuthManager } from "./oauth";
import { OAUTH_PROVIDERS } from "./providers";
import { getActiveProvider, setActiveProvider, setApiKey } from "./secrets";

export class SidebarProvider implements vscode.WebviewViewProvider {
  constructor(
    private context: vscode.ExtensionContext,
    private oauth: OAuthManager
  ) {}

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };
    view.webview.html = this.html();

    view.webview.onDidReceiveMessage(async (msg) => {
      try {
        switch (msg.type) {
          case "init": {
            const active = getActiveProvider(this.context);
            view.webview.postMessage({ type: "active", provider: active });
            break;
          }
          case "set-active":
            await setActiveProvider(this.context, msg.provider);
            vscode.window.showInformationMessage(
              `Active provider: ${msg.provider}`
            );
            break;

          // API-key providers
          case "connect-openai":
            await setApiKey(this.context, "openai");
            break;
          case "connect-gemini":
            await setApiKey(this.context, "gemini");
            break;

          // OAuth providers
          case "connect-vertex":
            await this.oauth.start("vertex");
            vscode.window.showInformationMessage("Vertex connected.");
            await setActiveProvider(this.context, "vertex");
            break;
          case "connect-github":
            await this.oauth.start("github");
            vscode.window.showInformationMessage("GitHub connected.");
            await setActiveProvider(this.context, "github");
            break;

          case "disconnect":
            await this.context.secrets.delete(`aich.${msg.provider}.tokens`);
            await this.context.secrets.delete(`aich.${msg.provider}.apiKey`);
            vscode.window.showInformationMessage(
              `${msg.provider} disconnected.`
            );
            break;

          case "test":
            // Simple smoke test — calls generation with a tiny prompt
            await vscode.commands.executeCommand(
              "aiCommitHelper.generateTestMessage"
            );
            break;
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(e?.message ?? String(e));
      }
    });
  }

  private html() {
    const nonce = this.nonce();
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    font-weight: var(--vscode-font-weight);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 16px;
    margin: 0;
    line-height: 1.4;
  }

  h1, h2, h3 {
    color: var(--vscode-sideBarTitle-foreground);
    margin: 0 0 16px 0;
    font-weight: 600;
  }

  .header {
    border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    padding-bottom: 12px;
    margin-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header .icon {
    width: 20px;
    height: 20px;
    opacity: 0.8;
  }

  .section {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-sideBarSectionHeader-border);
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-header {
    font-weight: 600;
    color: var(--vscode-sideBarSectionHeader-foreground);
    background: var(--vscode-sideBarSectionHeader-background);
    margin: -16px -16px 12px -16px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .field-group {
    margin-bottom: 16px;
  }

  .field-group:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--vscode-input-foreground);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input, select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--vscode-input-border);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 2px;
    font-family: inherit;
    font-size: inherit;
    transition: border-color 0.15s ease;
  }

  input:focus, select:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
    border-color: var(--vscode-focusBorder);
  }

  input::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }

  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  button {
    padding: 8px 16px;
    border: 1px solid var(--vscode-button-border);
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-radius: 2px;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    font-weight: 500;
    transition: all 0.15s ease;
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  button:hover {
    background: var(--vscode-button-hoverBackground);
  }

  button:active {
    transform: translateY(1px);
  }

  button:focus {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: 2px;
  }

  .button-primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
  }

  .button-secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    border-color: var(--vscode-button-secondaryBackground);
  }

  .button-secondary:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .button-danger {
    background: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground);
    border-color: var(--vscode-inputValidation-errorBorder);
  }

  .button-icon {
    padding: 6px;
    min-width: 32px;
  }

  .inline-group {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .inline-group input, 
  .inline-group select {
    flex: 1;
  }

  .inline-group button {
    flex-shrink: 0;
  }

  .help-text {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-top: 4px;
    line-height: 1.3;
  }

  .help-text code {
    background: var(--vscode-textCodeBlock-background);
    color: var(--vscode-textPreformat-foreground);
    padding: 2px 4px;
    border-radius: 2px;
    font-family: var(--vscode-editor-font-family);
    font-size: 10px;
  }

  .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .status-connected {
    background: var(--vscode-testing-iconPassed);
  }

  .status-disconnected {
    background: var(--vscode-testing-iconFailed);
  }

  .divider {
    height: 1px;
    background: var(--vscode-sideBarSectionHeader-border);
    margin: 20px 0;
  }

  .provider-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
  }

  .provider-option:last-child {
    border-bottom: none;
  }

  .provider-info {
    flex: 1;
  }

  .provider-name {
    font-weight: 500;
    color: var(--vscode-foreground);
  }

  .provider-type {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="header">
    <h2>
      <svg class="icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 7 7A7 7 0 0 0 8 1zm0 13a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"/>
        <path d="M8 4a4 4 0 1 0 4 4A4 4 0 0 0 8 4zm0 7a3 3 0 1 1 3-3A3 3 0 0 1 8 11z"/>
      </svg>
      AI Providers
    </h2>
  </div>

  <div class="section">
    <div class="section-header">Active Configuration</div>
    
    <div class="field-group">
      <label for="active">Current Provider</label>
      <div class="inline-group">
        <select id="active">
          <option value="gemini">🔸 Gemini (API Key)</option>
          <option value="openai">🤖 OpenAI (API Key)</option>
          <option value="vertex">🔵 Vertex AI (OAuth)</option>
          <option value="github">🐙 GitHub Copilot (OAuth)</option>
          <option value="ollama">🏠 Ollama (Local)</option>
        </select>
        <button id="saveActive" class="button-primary">Apply</button>
      </div>
      <div class="help-text">Selected provider will be used for commit message generation</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">API Key Providers</div>
    
    <div class="provider-option">
      <div class="provider-info">
        <div class="provider-name">🔸 Google Gemini</div>
        <div class="provider-type">API Key Required</div>
      </div>
      <button id="connectGemini" class="button-secondary">Connect</button>
    </div>
    
    <div class="provider-option">
      <div class="provider-info">
        <div class="provider-name">🤖 OpenAI GPT</div>
        <div class="provider-type">API Key Required</div>
      </div>
      <button id="connectOpenAI" class="button-secondary">Connect</button>
    </div>
  </div>

  <div class="section">
    <div class="section-header">OAuth2 Providers</div>
    
    <div class="provider-option">
      <div class="provider-info">
        <div class="provider-name">🔵 Google Vertex AI</div>
        <div class="provider-type">OAuth2 Authentication</div>
      </div>
      <button id="connectVertex" class="button-secondary">Connect</button>
    </div>
    
    <div class="provider-option">
      <div class="provider-info">
        <div class="provider-name">🐙 GitHub Copilot</div>
        <div class="provider-type">OAuth2 Authentication</div>
      </div>
      <button id="connectGitHub" class="button-secondary">Connect</button>
    </div>
    
    <div class="help-text">
      OAuth redirect URI: <code>vscode://abenkarroum.ai-commit-forge/callback</code>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Local Runtime</div>
    
    <div class="field-group">
      <label for="ollamaUrl">Ollama Server URL</label>
      <div class="inline-group">
        <input 
          id="ollamaUrl" 
          type="url" 
          placeholder="http://localhost:11434"
          value="http://localhost:11434" 
        />
        <button id="saveOllama" class="button-secondary">Save</button>
      </div>
      <div class="help-text">Configure your local Ollama server endpoint</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="button-group">
    <button id="test" class="button-primary">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
        <path d="M8 0L6.3 1.7l3.6 3.6L2 13.2 2.8 14l7.9-7.9 3.6 3.6L16 8V0H8z"/>
      </svg>
      Test Generation
    </button>
    <button id="disconnect" class="button-danger">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
        <path d="M2.5 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-11zM3 2h10v12H3V2z"/>
        <path d="M5 4h6v1H5V4zm0 2h6v1H5V6zm0 2h6v1H5V8zm0 2h4v1H5v-1z"/>
      </svg>
      Disconnect Current
    </button>
  </div>

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  
  // Enhanced event handlers with better UX
  document.getElementById('saveActive').onclick = () => {
    const provider = document.getElementById('active').value;
    const button = document.getElementById('saveActive');
    
    button.textContent = 'Applying...';
    button.disabled = true;
    
    vscode.postMessage({ type: 'set-active', provider });
    
    setTimeout(() => {
      button.textContent = 'Apply';
      button.disabled = false;
    }, 1000);
  };

  // API Key connections
  document.getElementById('connectGemini').onclick = () => {
    const button = document.getElementById('connectGemini');
    button.textContent = 'Connecting...';
    button.disabled = true;
    vscode.postMessage({ type: 'connect-gemini' });
    setTimeout(() => {
      button.textContent = 'Connect';
      button.disabled = false;
    }, 1500);
  };

  document.getElementById('connectOpenAI').onclick = () => {
    const button = document.getElementById('connectOpenAI');
    button.textContent = 'Connecting...';
    button.disabled = true;
    vscode.postMessage({ type: 'connect-openai' });
    setTimeout(() => {
      button.textContent = 'Connect';
      button.disabled = false;
    }, 1500);
  };

  // OAuth connections
  document.getElementById('connectVertex').onclick = () => {
    const button = document.getElementById('connectVertex');
    button.textContent = 'Authenticating...';
    button.disabled = true;
    vscode.postMessage({ type: 'connect-vertex' });
    setTimeout(() => {
      button.textContent = 'Connect';
      button.disabled = false;
    }, 2000);
  };

  document.getElementById('connectGitHub').onclick = () => {
    const button = document.getElementById('connectGitHub');
    button.textContent = 'Authenticating...';
    button.disabled = true;
    vscode.postMessage({ type: 'connect-github' });
    setTimeout(() => {
      button.textContent = 'Connect';
      button.disabled = false;
    }, 2000);
  };

  // Ollama configuration
  document.getElementById('saveOllama').onclick = () => {
    const url = document.getElementById('ollamaUrl').value || '';
    const button = document.getElementById('saveOllama');
    
    button.textContent = 'Saving...';
    button.disabled = true;
    
    vscode.postMessage({ type: 'save-ollama', url });
    
    setTimeout(() => {
      button.textContent = 'Save';
      button.disabled = false;
    }, 1000);
  };

  // Actions
  document.getElementById('disconnect').onclick = () => {
    const provider = document.getElementById('active').value;
    const button = document.getElementById('disconnect');
    
    button.textContent = 'Disconnecting...';
    button.disabled = true;
    
    vscode.postMessage({ type: 'disconnect', provider });
    
    setTimeout(() => {
      button.textContent = 'Disconnect Current';
      button.disabled = false;
    }, 1000);
  };

  document.getElementById('test').onclick = () => {
    const button = document.getElementById('test');
    button.textContent = 'Testing...';
    button.disabled = true;
    
    vscode.postMessage({ type: 'test' });
    
    setTimeout(() => {
      button.textContent = 'Test Generation';
      button.disabled = false;
    }, 2000);
  };

  // Initialize
  vscode.postMessage({ type: 'init' });

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'active':
        document.getElementById('active').value = message.provider;
        break;
    }
  });
</script>
</body>
</html>`;
  }

  private nonce() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < 32; i++)
      s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
}
