#!/usr/bin/env bash
# Push pisal-vercel to github.com/graddeman22-tech/pisal
# Usage: GITHUB_TOKEN=your_pat bash push-to-github.sh

set -e

REPO="https://${GITHUB_TOKEN}@github.com/graddeman22-tech/pisal.git"
TMPDIR=$(mktemp -d)

echo "📦 Copying pisal-vercel to temp directory..."
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.git' \
  "$(dirname "$0")/" "$TMPDIR/"

echo "🔧 Initializing git..."
cd "$TMPDIR"
git init
git add -A
git commit -m "chore: Pisal Enterprises - Full stack Vercel-ready build with Supabase"
git branch -M main

echo "🚀 Pushing to GitHub..."
git remote add origin "$REPO"
git push -u origin main --force

echo "✅ Done! Visit: https://github.com/graddeman22-tech/pisal"
echo ""
echo "Next step: Go to vercel.com → Import Git Repository → graddeman22-tech/pisal"
echo "Add environment variable: DATABASE_URL = your Supabase connection string"
rm -rf "$TMPDIR"
