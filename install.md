# Agent Skill Installation Guide

Install the **TikTok Caption Video Editor & UGC Stitcher** into any autonomous AI coding agent.

Supported Agents: **OpenClaw**, **Hermes Agent**, **Grokbot**, **Claude Code**, **Codex**, **Oh My Pi**, and **Cursor**.

---

## ⚡ Quickest Install: Automated One-Liner

Run this in your terminal to automatically detect your installed agents and link the skill:

```bash
curl -fsSL https://raw.githubusercontent.com/ArielleTolome/overlay-text-video-editor/master/install.sh | bash
```

---

## 🚀 Option 1: Universal Skills CLI (Recommended)

If your agent uses the open standard `skills` package:

```bash
npx skills add ArielleTolome/overlay-text-video-editor --all
```

---

## 🐾 Option 2: OpenClaw / ClawHub

### Using Claw CLI:
```bash
claw add ArielleTolome/overlay-text-video-editor
```

### Manual OpenClaw Installation:
```bash
mkdir -p ~/.openclaw/skills
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git ~/.openclaw/skills/tiktok-caption-video-editor
cd ~/.openclaw/skills/tiktok-caption-video-editor && bun install
```

---

## 🪽 Option 3: Hermes Agent

### Using Hermes CLI:
```bash
hermes skill add ArielleTolome/overlay-text-video-editor
```

### Manual Hermes Installation:
```bash
mkdir -p ~/.hermes/skills
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git ~/.hermes/skills/tiktok-caption-video-editor
cd ~/.hermes/skills/tiktok-caption-video-editor && bun install
```

---

## 🤖 Option 4: Grokbot & Grok Agents

Place the skill into your Grokbot skills directory:

```bash
mkdir -p ~/.grok/skills
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git ~/.grok/skills/tiktok-caption-video-editor
cd ~/.grok/skills/tiktok-caption-video-editor && bun install
```

---

## 💻 Option 5: Claude Code, Codex & Oh My Pi

### Claude Code:
```bash
mkdir -p ~/.claude/skills
ln -sfn "$(pwd)" ~/.claude/skills/tiktok-caption-video-editor
```

### Codex / Oh My Pi:
```bash
mkdir -p ~/.omp/agent/skills
ln -sfn "$(pwd)" ~/.omp/agent/skills/tiktok-caption-video-editor
```

---

## 🛠️ Prerequisites

1. **Bun** runtime (fast, modern JavaScript/TypeScript engine):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
2. **FFmpeg**:
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install -y ffmpeg`
3. *(Optional)* **yt-dlp** for TikTok trending audio extraction:
   - macOS: `brew install yt-dlp`

---

## 🎯 Verification

Tell your agent:
> *"List available reaction hooks using the video editor skill"*

Your agent will run:
```bash
bun run start --list-hooks
```
And return the 10 built-in reaction hook emotions (`jaw-drop`, `hyped`, `belly-laugh`, `shook`, etc.).
