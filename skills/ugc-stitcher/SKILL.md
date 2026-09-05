---
name: ugc-stitcher
description: "Multi-clip UGC video stitcher for AI agents (OpenClaw, Hermes, Grokbot, Codex, Claude Code). Combines reaction hooks with app/product demonstrations, applies auto color grading, dynamic animated overlays (zoom punch, highlight rings), and preserves original audio."
homepage: https://github.com/ArielleTolome/overlay-text-video-editor
metadata:
  tags: [ugc, video-stitcher, reaction-hooks, openclaw, hermes, grokbot, codex, claude-code]
  requires:
    bins: [bun, ffmpeg, ffprobe]
    optional_bins: [yt-dlp]
triggers:
  - "stitch video"
  - "reaction hook"
  - "ugc stitcher"
  - "app demo video"
  - "openclaw video"
  - "hermes video"
  - "grok video"
---

# UGC Video Stitcher Skill

Stitch scroll-stopping 2-block UGC videos:
1. **Block 1: Reaction Hook** (2.5s - 3.0s) — Stops the scroll with authentic creator emotion (`jaw-drop`, `shook`, `hyped`, `belly-laugh`, `mind-blown`).
2. **Block 2: Product / App Demonstration** (4s - 10s) — Shows app gameplay, screen recordings, website features, or lifestyle B-roll.

---

## ⚡ Commands

```bash
# 1. List available local reaction hook emotions
bun run start --list-hooks

# 2. View proven reaction hook text presets
bun run start --reaction-hooks

# 3. Stitch a reaction hook + app demo (with auto-matched reaction text):
bun run start --stitch \
  --hook jaw-drop \
  --demo /path/to/demo.mp4 \
  --hook-dur 2.5 --demo-dur 6.0 \
  --auto-hook-text \
  -o output/stitched_ad.mp4

# 4. Auto color grade + dynamic zoom punch + self-evaluation:
bun run start --stitch \
  --hook shook \
  --demo /path/to/demo.mp4 \
  --grade vibrant_pop \
  --zoom-punch \
  --self-eval \
  -o output/graded_ad.mp4

# 5. Check persistent session memory & learned preferences:
bun run start --session
```

---

## 🛠️ Prerequisites
- **Bun**: `curl -fsSL https://bun.sh/install | bash`
- **FFmpeg**: `brew install ffmpeg` (macOS) or `sudo apt install -y ffmpeg` (Linux)
