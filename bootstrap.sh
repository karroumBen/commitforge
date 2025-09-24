#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Catch errors in pipelines

EXT_NAME="ai-commit-forge"
EXT_VERSION=$(node -p "require('./package.json').version")
VSIX_FILE="$EXT_NAME-$EXT_VERSION.vsix"

echo "🔧 Cleaning previous builds..."
rm -rf out
rm -f $VSIX_FILE

echo "⚡ Building extension..."
npm run build

echo "📦 Packaging extension..."
npm run package

echo "💻 Installing extension..."
code --install-extension $VSIX_FILE

echo "✅ Extension $EXT_NAME version $EXT_VERSION built, packaged, and installed successfully!"
