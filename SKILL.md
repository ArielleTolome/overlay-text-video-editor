---
name: tiktok-caption-video-editor
description: "Automated AI video editor that cuts raw portrait videos, designs & renders authentic TikTok-style text/card caption overlays with HyperFrames and FFmpeg, and packages organized caption video batches with zip archives."
triggers:
  - "video captions"
  - "tiktok captions"
  - "tiktok text overlay"
  - "hyperframes video"
  - "ugc video editor"
  - "video overlay generator"
  - "grokbot video editor"
tags:
  - video-editing
  - tiktok
  - hyperframes
  - captions
  - grokbot
  - ai-agents
---

# TikTok Caption Video Editor & HyperFrames Overlay Engine

An automated AI video editing skill for **Grokbot**, **Claude Code**, **Codex**, and autonomous agents. This skill cuts 10–15s clips from raw vertical footage, renders pixel-perfect TikTok-style text and card caption overlays via **HyperFrames**, composites them using hardware-accelerated **FFmpeg**, and packages the outputs into date/time organized directories with standardized filenames and distribution zip archives.

---

## ⚡ When to Use This Skill

Activate this skill when:
- The user asks to add TikTok, Reels, or Shorts text captions/overlays to videos.
- The user provides raw b-roll clips and a list of hook captions or marketing angles to test.
- The user wants batch video variations ($N$ captions $\times$ $M$ video cuts $\times$ $K$ styles).
- The user requires organized date/time folders and standardized filenames for ad testing.

---

## 🛠️ Prerequisites

- **Bun** (recommended: `curl -fsSL https://bun.sh/install | bash`) or **Node.js** (v20+)
- **FFmpeg** (`brew install ffmpeg` on macOS, or `apt-get install ffmpeg` on Linux)

---

## 📦 Installation for Grokbot & AI Agents

### Option 1: Git Clone
```bash
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git
cd overlay-text-video-editor
bun install
```

### Option 2: Add to Agent Skills Directory
Copy this `SKILL.md` and repository into your agent's skill library:
- **Grokbot / Custom Agents**: Place in `~/.grok/skills/tiktok-caption-video-editor/` or `.agent/skills/`
- **Claude Code**: Place in `~/.claude/skills/tiktok-caption-video-editor/`
- **Codex / OpenClaw**: Place in `~/.omp/agent/skills/tiktok-caption-video-editor/`

---

## 🚀 Quick Execution Recipes

### 1. Default Batch Run
Renders all 6 default viral hook captions across all raw cuts in `assets/raw_cuts/` in both styles:
```bash
bun run start
```

### 2. Custom Captions (Inline or File)
```bash
# Inline comma-separated captions
bun run start --captions "Stop scrolling 💀, Claim your $500 allowance 🛒, Free grocery hack 😭"

# From a text file (one caption per line)
bun run start -f captions.txt
```

### 3. Custom Batch Name & Campaign Tag
```bash
bun run start --batch-name grocery_promo --captions "Claim your card today 💸"
```

### 4. Specific Style Only
```bash
# Classic TikTok stroke text only
bun run start --styles stroke --concurrency 4

# Rounded card pill style only
bun run start --styles card
```

### 5. Custom Raw Videos and Output Location
```bash
bun run start -d ./my_raw_footage -o ./campaign_output
```

---

## 🎨 Overlay Styles

1. **Classic TikTok Stroke Style (`stroke`)**:
   - High-impact bold white sans-serif with heavy black outline (`-webkit-text-stroke: 4px #000`), drop-shadow, and full emoji support (`😭💀`).
   - Vertical position: upper-chest height (`top: 35-42%`), centered horizontally.
   - Ideal for: High-energy hooks, viral organic TikTok content, UGC reactions.

2. **TikTok Rounded Card Style (`card`)**:
   - Elevated rounded white container (`rgba(255,255,255,0.96)`, `border-radius: 24px`, soft elevation shadow) with dark typography (`#111111`, font-weight 700).
   - Vertical position: upper-chest height (`top: 35-42%`), centered horizontally.
   - Ideal for: Clean aesthetic ads, TikTok shop callouts, testimonial cards.

---

## 🏷️ Standardized Naming Conventions

All rendered videos follow standardized, timestamped naming conventions:

- **In Caption Subfolders (`captions/<caption_slug>/`)**:
  - `[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4`
  - *Example*: `20260831_145002_video_1_stroke_c01.mp4`
  - *Example*: `20260831_145002_video_1_card_c01.mp4`

- **In Flat Directory (`all_videos/`)**:
  - `[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4`
  - *Example*: `20260831_145002_video_1_stroke_c01_lowkey_thought_this_500.mp4`

---

## 📂 Output Folder Structure

```text
output/
├── 2026-08-31/
│   └── batch_14-50-02/
│       ├── captions/
│       │   ├── caption_01_lowkey_thought_this_500_grocery_card_was_fake/
│       │   │   ├── caption.txt
│       │   │   ├── metadata.json
│       │   │   ├── 20260831_145002_video_1_stroke_c01.mp4
│       │   │   └── ...
│       │   └── ...
│       ├── all_videos/
│       │   ├── 20260831_145002_video_1_stroke_c01_lowkey_thought_this_500.mp4
│       │   └── ...
│       ├── manifest.json
│       ├── README.md
│       └── tiktok_caption_videos_20260831_145002.zip
├── latest -> ./2026-08-31/batch_14-50-02
└── tiktok_caption_videos.zip
```

---

## 💻 Programmatic Agent Invocation

```typescript
import { batchRender } from './src/editor';

const manifest = await batchRender({
  captions: [
    "lowkey thought this $500 grocery card was fake until my Walmart receipt literally said $0.00 😭💀",
    "if u buy groceries and haven't claimed ur $500 allowance card yet u are literally throwing away money 😭"
  ],
  videosDir: './assets/raw_cuts',
  styles: ['stroke', 'card'],
  outputDir: './output',
  organizeByDate: true,
  batchName: 'grokbot_campaign',
  concurrency: 4,
  zip: true,
});

console.log(`Rendered ${manifest.totalVideos} videos across ${manifest.totalCaptions} captions.`);
```
