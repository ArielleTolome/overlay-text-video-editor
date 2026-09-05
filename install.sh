#!/usr/bin/env bash
# ==============================================================================
# TikTok Caption Video Editor — Automated Agent Skill Installer
# Compatible with: OpenClaw, Hermes Agent, Grokbot, Claude Code, Codex, OMP
# ==============================================================================

set -e

REPO_URL="https://github.com/ArielleTolome/overlay-text-video-editor.git"
SKILL_NAME="tiktok-caption-video-editor"
DEFAULT_INSTALL_DIR="${HOME}/.skills/${SKILL_NAME}"

echo ""
echo "🎬 Installing TikTok Caption Video Editor Skill for AI Agents..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check Prerequisites
echo "🔍 Checking prerequisites..."

if command -v bun >/dev/null 2>&1; then
  echo "  ✓ Bun: $(bun --version) found"
else
  echo "  ⚠️  Bun is required but not installed."
  echo "     Install with: curl -fsSL https://bun.sh/install | bash"
fi

if command -v ffmpeg >/dev/null 2>&1; then
  echo "  ✓ FFmpeg: found"
else
  echo "  ⚠️  FFmpeg is required but not installed."
  echo "     macOS: brew install ffmpeg"
  echo "     Linux: sudo apt install -y ffmpeg"
fi

# 2. Determine target repository location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"
IS_LOCAL_REPO=false

if [ -f "${SCRIPT_DIR}/SKILL.md" ] && [ -f "${SCRIPT_DIR}/package.json" ]; then
  SOURCE_DIR="${SCRIPT_DIR}"
  IS_LOCAL_REPO=true
  echo "  ✓ Using existing local repository at: ${SOURCE_DIR}"
else
  SOURCE_DIR="${DEFAULT_INSTALL_DIR}"
  echo "  📥 Cloning repository to ${SOURCE_DIR}..."
  mkdir -p "$(dirname "${SOURCE_DIR}")"
  if [ -d "${SOURCE_DIR}/.git" ]; then
    git -C "${SOURCE_DIR}" pull --ff-only
  else
    git clone "${REPO_URL}" "${SOURCE_DIR}"
  fi
fi

# 3. Install Bun Dependencies
echo "📦 Installing dependencies..."
cd "${SOURCE_DIR}"
if command -v bun >/dev/null 2>&1; then
  bun install --frozen-lockfile || bun install
fi

# 4. Link into detected AI Agent skill directories
INSTALLED_TARGETS=()

# OpenClaw
if [ -d "${HOME}/.openclaw" ] || command -v claw >/dev/null 2>&1; then
  mkdir -p "${HOME}/.openclaw/skills"
  ln -sfn "${SOURCE_DIR}" "${HOME}/.openclaw/skills/${SKILL_NAME}"
  INSTALLED_TARGETS+=("OpenClaw (~/.openclaw/skills/${SKILL_NAME})")
fi

# ClawHub
if [ -d "${HOME}/.claw" ]; then
  mkdir -p "${HOME}/.claw/skills"
  ln -sfn "${SOURCE_DIR}" "${HOME}/.claw/skills/${SKILL_NAME}"
  INSTALLED_TARGETS+=("ClawHub (~/.claw/skills/${SKILL_NAME})")
fi

# Hermes Agent
if [ -d "${HOME}/.hermes" ] || command -v hermes >/dev/null 2>&1; then
  mkdir -p "${HOME}/.hermes/skills"
  ln -sfn "${SOURCE_DIR}" "${HOME}/.hermes/skills/${SKILL_NAME}"
  INSTALLED_TARGETS+=("Hermes Agent (~/.hermes/skills/${SKILL_NAME})")
fi

# Grokbot / Grok Agent
if [ -d "${HOME}/.grok" ] || [ -d "${HOME}/.agent" ]; then
  mkdir -p "${HOME}/.grok/skills"
  ln -sfn "${SOURCE_DIR}" "${HOME}/.grok/skills/${SKILL_NAME}"
  INSTALLED_TARGETS+=("Grokbot (~/.grok/skills/${SKILL_NAME})")
fi

# Claude Code
if [ -d "${HOME}/.claude" ]; then
  mkdir -p "${HOME}/.claude/skills"
  ln -sfn "${SOURCE_DIR}" "${HOME}/.claude/skills/${SKILL_NAME}"
  INSTALLED_TARGETS+=("Claude Code (~/.claude/skills/${SKILL_NAME})")
fi

# Codex / Oh My Pi
if [ -n "${CODEX_HOME}" ] || [ -d "${HOME}/.codex" ] || [ -d "${HOME}/.omp" ]; then
  OMP_DIR="${CODEX_HOME:-${HOME}/.omp/agent}/skills"
  mkdir -p "${OMP_DIR}"
  ln -sfn "${SOURCE_DIR}" "${OMP_DIR}/${SKILL_NAME}"
  INSTALLED_TARGETS+=("Codex / OMP (${OMP_DIR}/${SKILL_NAME})")
fi

# Default fallback if no known agent directory found yet
if [ ${#INSTALLED_TARGETS[@]} -eq 0 ]; then
  mkdir -p "${HOME}/.skills"
  ln -sfn "${SOURCE_DIR}" "${HOME}/.skills/${SKILL_NAME}"
  INSTALLED_TARGETS+=("Global Skills (~/.skills/${SKILL_NAME})")
fi

echo ""
echo "🎉 Skill installed successfully into:"
for target in "${INSTALLED_TARGETS[@]}"; do
  echo "  • ${target}"
done

echo ""
echo "✨ Ready to use in your AI Agent! Examples:"
echo "  > \"Add TikTok captions to my video in assets/raw_cuts/video_1.mp4\""
echo "  > \"Stitch a jaw-drop reaction hook with my app gameplay demo\""
echo "  > \"Create an iOS notification storm ad with chimes\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
