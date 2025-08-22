# AI Commit Forge

[![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-Extension-blue.svg)](https://marketplace.visualstudio.com/items?itemName=abenkarroum.ai-commit-forge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**AI Commit Forge** is a powerful Visual Studio Code extension that automatically generates intelligent commit messages for your staged files using various AI providers. Say goodbye to generic commit messages and hello to descriptive, contextual commits that actually explain what changed in your code.

## 🚀 Features

- **Multiple AI Providers**: Support for OpenAI, Google Gemini, Vertex AI, GitHub Copilot, and local Ollama
- **Smart Diff Analysis**: Analyzes actual code changes to generate relevant commit messages
- **Per-File Commit Messages**: Generates individual commit messages based on specific file changes
- **OAuth2 & API Key Support**: Flexible authentication options for different providers
- **Local AI Support**: Use Ollama for completely offline commit message generation
- **VS Code Native Integration**: Seamlessly integrates with VS Code's Git SCM interface
- **User-Friendly UI**: Beautiful, VS Code-themed configuration interface

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Supported Providers](#supported-providers)
- [Configuration](#configuration)
- [Usage](#usage)
- [Commands](#commands)
- [Requirements](#requirements)
- [Extension Settings](#extension-settings)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 💾 Installation

### From VS Code Marketplace

1. Open Visual Studio Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "AI Commit Forge"
4. Click "Install"

### From VSIX Package

1. Download the `.vsix` file from releases
2. Open VS Code
3. Run `Extensions: Install from VSIX...` command
4. Select the downloaded `.vsix` file

## ⚡ Quick Start

1. **Install the extension**
2. **Open the AI Commit Forge sidebar** (click the AI icon in the Activity Bar)
3. **Choose and connect your AI provider**:
   - For API key providers (OpenAI, Gemini): Click "Connect" and enter your API key
   - For OAuth providers (Vertex, GitHub): Click "Connect" and complete OAuth flow
   - For local Ollama: Configure the server URL
4. **Set as active provider** and click "Apply"
5. **Stage some files** in Git
6. **Click the AI Commit Forge button** in the Git SCM panel or use the command palette
7. **Your commit message is automatically generated and inserted!**

## 🤖 Supported Providers

| Provider                | Authentication | Description                                                |
| ----------------------- | -------------- | ---------------------------------------------------------- |
| **🔸 Google Gemini**    | API Key        | Fast, accurate commit messages using Google's Gemini AI    |
| **🤖 OpenAI GPT**       | API Key        | High-quality commit messages using GPT models              |
| **🔵 Google Vertex AI** | OAuth2         | Enterprise-grade AI with Google Cloud integration          |
| **🐙 GitHub Copilot**   | OAuth2         | Leverage GitHub's AI directly in your workflow             |
| **🏠 Ollama**           | Local          | Completely offline AI using your local Ollama installation |

## ⚙️ Configuration

### Setting Up API Key Providers

#### Google Gemini

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open AI Commit Forge sidebar
3. Click "Connect Gemini"
4. Enter your API key when prompted

#### OpenAI

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open AI Commit Forge sidebar
3. Click "Connect OpenAI"
4. Enter your API key when prompted

### Setting Up OAuth2 Providers

#### Google Vertex AI

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Vertex AI API
3. Create OAuth2 credentials with redirect URI: `vscode://abenkarroum.ai-commit-forge/callback`
4. Add your Client ID to VS Code settings: `aiCommitHelper.vertex.clientId`
5. Click "Connect Vertex" in the sidebar

#### GitHub Copilot

1. Create a GitHub OAuth App in your [GitHub Developer Settings](https://github.com/settings/developers)
2. Set redirect URI: `vscode://abenkarroum.ai-commit-forge/callback`
3. Add your Client ID to VS Code settings: `aiCommitHelper.github.clientId`
4. Click "Connect GitHub" in the sidebar

### Setting Up Local Ollama

1. Install [Ollama](https://ollama.ai/) on your machine
2. Start Ollama server: `ollama serve`
3. Pull a model: `ollama pull codellama` (or any preferred model)
4. In AI Commit Forge sidebar, enter your Ollama URL (default: `http://localhost:11434`)
5. Click "Save"

## 🎯 Usage

### Basic Workflow

1. **Make changes to your code**
2. **Stage the files you want to commit**:

   ```bash
   git add file1.ts file2.py
   ```

   _Or use VS Code's Git interface to stage files_

3. **Generate commit message**:

   - **Method 1**: Click the AI Commit Forge button in the Git SCM title bar
   - **Method 2**: Open Command Palette (`Ctrl+Shift+P`) → "AI Commit Forge: Generate per-file commit messages"
   - **Method 3**: Use the keyboard shortcut (if configured)

4. **Review and commit**:
   - The generated message appears in the Git commit input box
   - Review the message and modify if needed
   - Commit as usual (`Ctrl+Enter` or click commit button)

### Advanced Usage

#### Testing Your Configuration

- Use "Test Generation" button in the sidebar to verify your provider setup
- This runs a small test to ensure your AI provider is working correctly

#### Switching Between Providers

- Use the dropdown in the AI Commit Forge sidebar
- Select your preferred provider and click "Apply"
- No need to restart VS Code

#### Managing Connections

- Use "Disconnect Current" to remove stored credentials
- Useful when switching accounts or troubleshooting

## 🔧 Commands

| Command                                              | Description                                        | Default Keybinding |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------ |
| `AI Commit Forge: Generate per-file commit messages` | Analyzes staged files and generates commit message | None               |
| `AI Commit Forge: Open Provider Config`              | Opens the configuration sidebar                    | None               |
| `AI Commit Forge: Test Message Generation`           | Tests your current provider setup                  | None               |

_To add keybindings, go to File → Preferences → Keyboard Shortcuts and search for "AI Commit Forge"_

## 📋 Requirements

- **Visual Studio Code** 1.80.0 or higher
- **Git** installed and configured
- **Active internet connection** (except for Ollama local setup)
- **API keys or OAuth setup** for your chosen AI provider

### Optional Requirements

- **Ollama** installed locally (for offline usage)
- **Google Cloud account** (for Vertex AI)
- **GitHub account** (for GitHub Copilot)

## ⚙️ Extension Settings

This extension contributes the following settings:

| Setting                          | Type   | Default                    | Description                          |
| -------------------------------- | ------ | -------------------------- | ------------------------------------ |
| `aiCommitHelper.activeProvider`  | string | `"gemini"`                 | Active AI provider for generation    |
| `aiCommitHelper.vertex.clientId` | string | `""`                       | OAuth Client ID for Google Vertex AI |
| `aiCommitHelper.github.clientId` | string | `""`                       | OAuth Client ID for GitHub           |
| `aiCommitHelper.ollama.url`      | string | `"http://localhost:11434"` | Ollama server URL                    |

### Accessing Settings

- **UI**: File → Preferences → Settings → Extensions → AI Commit Forge
- **JSON**: Add to your `settings.json`:
  ```json
  {
    "aiCommitHelper.activeProvider": "gemini",
    "aiCommitHelper.vertex.clientId": "your-client-id",
    "aiCommitHelper.github.clientId": "your-client-id",
    "aiCommitHelper.ollama.url": "http://localhost:11434"
  }
  ```

## 🐛 Troubleshooting

### Common Issues

#### "No staged files found"

- **Solution**: Stage your files using `git add <files>` or VS Code's Git interface before generating commit messages

#### "No Git repository detected"

- **Solution**: Ensure you're working in a Git repository. Initialize with `git init` if needed

#### "API key is invalid" / "Authentication failed"

- **Solution**:
  - Verify your API key is correct and active
  - Check your internet connection
  - For OAuth: Ensure redirect URI is properly configured

#### "Test generation failed"

- **Solution**:
  - Check your provider configuration
  - Verify API keys/OAuth setup
  - Try disconnecting and reconnecting your provider

#### Ollama "Connection refused"

- **Solution**:
  - Ensure Ollama is running: `ollama serve`
  - Check the server URL in settings
  - Verify you have a model installed: `ollama list`

### Debug Steps

1. **Check the Output panel**: View → Output → Select "AI Commit Forge"
2. **Test your provider**: Use the "Test Generation" button
3. **Verify Git status**: Ensure files are properly staged
4. **Check VS Code Developer Tools**: Help → Toggle Developer Tools

### Getting Help

- **Check our [Issues page](https://github.com/abenkarroum/ai-commit-forge/issues)** for known problems
- **Create a new issue** with:
  - VS Code version
  - Extension version
  - Provider being used
  - Error messages
  - Steps to reproduce

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/abenkarroum/ai-commit-forge.git
   cd ai-commit-forge
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Open in VS Code**:

   ```bash
   code .
   ```

4. **Start developing**:
   - Press `F5` to launch Extension Development Host
   - Make changes and test in the new VS Code window

### Build and Package

```bash
# Compile TypeScript
npm run compile

# Package extension
npm run package

# Install locally for testing
npm run install:extension
```

### Contribution Guidelines

- **Fork the repository** and create a feature branch
- **Follow TypeScript best practices** and existing code style
- **Add tests** for new functionality
- **Update documentation** as needed
- **Submit a Pull Request** with clear description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **VS Code Team** for the excellent extension API
- **AI Provider Teams** (OpenAI, Google, GitHub, Ollama) for their amazing APIs
- **Open Source Community** for inspiration and feedback

## 📞 Support

- **⭐ Star this repo** if you find it useful
- **🐛 Report issues** on our GitHub Issues page
- **💡 Request features** via GitHub Discussions
- **📧 Contact**: [abenkarroum@example.com](mailto:abenkarroum@example.com)

---

**Happy Coding! 🚀** Let AI Commit Forge make your commit messages as intelligent as your code.
