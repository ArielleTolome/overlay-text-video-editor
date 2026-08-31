# TikTok Caption Video Editor & HyperFrames Overlay Engine

[![Bun](https://img.shields.io/badge/Bun-1.4.0-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Hardware_Accelerated-green?logo=ffmpeg)](https://ffmpeg.org)
[![HyperFrames](https://img.shields.io/badge/HyperFrames-v0.8.20-purple)](https://hyperframes.heygen.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An automated, AI-assisted video editing engine that takes raw vertical footage (b-roll, UGC, lifestyle, e-commerce) and renders authentic TikTok-style text and card caption overlays using **HyperFrames**, **Headless Chromium / Puppeteer**, and **FFmpeg**.

Batch-renders across $N$ captions $\times$ $M$ raw video cuts $\times$ $K$ overlay styles with deterministic timestamped directory hierarchies, standardized naming conventions, and instant ZIP deliverables.

---

## ✨ Features

- **4 Authentic Social Overlay Styles**:
  1. **Classic TikTok Stroke Style (`stroke`)**: High-impact bold white sans-serif with heavy black outline (`-webkit-text-stroke: 4.5px #000`), drop-shadow, and full emoji support (`😭💀`).
  2. **TikTok Rounded Card Style (`card`)**: Semi-translucent elevated white pill/card container (`rgba(255,255,255,0.96)`, `border-radius: 24px`, shadow) with dark typography.
  3. **Snapchat Translucent Bar Style (`snapchat`)**: Full-width horizontal translucent black banner (`background: rgba(0, 0, 0, 0.65)`, blur) with crisp white text.
  4. **TikTok Comment Reply Sticker (`comment`)**: Authentic TikTok comment reply sticker with gradient avatar, user handle (`sarah_j`), "Replying to your video" subtitle, and speech bubble tail.
- **HyperFrames HTML/CSS Composition**: Pixel-perfect web typography and emoji rasterization rendered at 1080x1920 using headless Chrome.
- **Hardware-Accelerated Compositing**: Multi-threaded FFmpeg pipeline (`h264_videotoolbox` on Apple Silicon / `libx264` on Linux/x86) achieving up to 10x real-time rendering.
- **Date & Time Organization**: Organizes batches into structured folders (`output/YYYY-MM-DD/batch_HH-MM-SS/`) with automatic `output/latest` symlink and root zip deliverables.
- **Standardized Video Naming Conventions**: Clean, searchable filenames for ad managers, media buyers, and automated publishing.
- **Instant ZIP Packaging & Reports**: Generates per-caption `metadata.json`, `manifest.json`, markdown catalog reports, and zipped distribution bundles.

---

## 🏷️ Standardized Naming Conventions

All output videos strictly follow standardized naming rules:

### 1. In Caption Subfolders (`captions/<caption_slug>/`):
```text
[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4
```
*Examples:*
- `20260831_145002_video_1_stroke_c01.mp4`
- `20260831_145002_video_1_card_c01.mp4`
- `20260831_145002_video_2_stroke_c02.mp4`
- `20260831_145002_video_3_card_c03.mp4`

### 2. In Flat Collection (`all_videos/`):
```text
[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4
```
*Examples:*
- `20260831_145002_video_1_stroke_c01_lowkey_thought_this_500.mp4`
- `20260831_145002_video_1_card_c01_lowkey_thought_this_500.mp4`
- `20260831_145002_video_2_stroke_c02_if_u_buy_groceries.mp4`
- `20260831_145002_video_3_card_c03_literally_just_got_500.mp4`

---

## 📁 Directory Structure

```text
output/
├── 2026-08-31/
│   └── batch_14-50-02/
│       ├── captions/
│       │   ├── caption_01_lowkey_thought_this_500_grocery_card_was_fake/
│       │   │   ├── caption.txt
│       │   │   ├── metadata.json
│       │   │   ├── 20260831_145002_video_1_stroke_c01.mp4
│       │   │   ├── 20260831_145002_video_1_card_c01.mp4
│       │   │   ├── 20260831_145002_video_2_stroke_c01.mp4
│       │   │   ├── 20260831_145002_video_2_card_c01.mp4
│       │   │   ├── 20260831_145002_video_3_stroke_c01.mp4
│       │   │   └── 20260831_145002_video_3_card_c01.mp4
│       │   └── ...
│       ├── all_videos/
│       │   ├── 20260831_145002_video_1_stroke_c01_lowkey_thought_this_500.mp4
│       │   └── ... (all rendered MP4s)
│       ├── manifest.json
│       ├── README.md
│       └── tiktok_caption_videos_20260831_145002.zip
├── latest -> ./2026-08-31/batch_14-50-02
└── tiktok_caption_videos.zip
```

---

## 🚀 Quickstart

### Prerequisites
- [Bun](https://bun.sh) (v1.2+) or Node.js (v20+)
- [FFmpeg](https://ffmpeg.org) installed and available in your `PATH`

### Installation
```bash
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git
cd overlay-text-video-editor
bun install
```

### CLI Usage

```bash
# Run default batch (all 6 viral hooks across 3 raw video cuts in both styles):
bun run start

# Pass custom captions inline:
bun run start --captions "Stop scrolling 💀, Claim your $500 allowance 🛒"

# Pass captions from a text file:
bun run start -f captions.txt

# Attach a campaign batch name:
bun run start --batch-name summer_promo

# Render specific style only:
bun run start --styles stroke --concurrency 4

# Custom video cuts directory and output destination:
bun run start -d ./my_raw_cuts -o ./dist
```

---

## 💻 Programmatic API

```typescript
import { VideoEditor, batchRender } from './src/editor';

const manifest = await batchRender({
  captions: [
    "lowkey thought this $500 grocery card was fake until my Walmart receipt literally said $0.00 😭💀",
    "if u buy groceries and haven't claimed ur $500 allowance card yet u are literally throwing away money 😭",
  ],
  videosDir: './assets/raw_cuts',
  styles: ['stroke', 'card'],
  outputDir: './output',
  organizeByDate: true,
  batchName: 'ugc_hooks',
  concurrency: 4,
  zip: true,
});

console.log(`Rendered ${manifest.totalVideos} videos to ${manifest.batchDirectory}`);
```

---

## 🤖 Grokbot & AI Agent Skill Integration

This repository includes a standardized `SKILL.md` designed for direct integration with **Grokbot**, **Claude Code**, **Codex**, and autonomous AI coding agents.

### Installing as an Agent Skill

#### 1. For Grokbot & Custom Agent Frameworks:
Copy or link `SKILL.md` into your agent skills folder:
```bash
# In your Grokbot workspace:
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git ~/.grok/skills/tiktok-caption-video-editor
```

#### 2. For Claude Code:
```bash
git clone https://github.com/ArielleTolome/overlay-text-video-editor.git ~/.claude/skills/tiktok-caption-video-editor
```

#### 3. Natural Language Prompts Supported by the Skill:
- *"Cut 10 seconds from these raw videos and add TikTok stroke captions for my $500 grocery card hook."*
- *"Generate TikTok card overlays for these 5 captions and package them in a zip file organized by date and time."*
- *"Batch render all captions in both styles with standardized naming conventions."*

---

## 🧪 Testing

Run the automated test suite:
```bash
bun test
```

---

## 📄 License

MIT License. Copyright (c) 2026 Ariel Tolome.
