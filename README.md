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

- **5 Authentic Social Overlay Styles**:
  1. **Classic TikTok Stroke Style (`stroke`)**: High-impact bold white sans-serif with heavy black outline (`-webkit-text-stroke: 4.5px #000`), drop-shadow, and full emoji support (`😭💀`).
  2. **TikTok Rounded Card Style (`card`)**: Semi-translucent elevated white pill/card container (`rgba(255,255,255,0.96)`, `border-radius: 24px`, shadow) with dark typography.
  3. **Snapchat Translucent Bar Style (`snapchat`)**: Full-width horizontal translucent black banner (`background: rgba(0, 0, 0, 0.65)`, blur) with crisp white text.
  4. **TikTok Comment Reply Sticker (`comment`)**: Authentic TikTok comment reply sticker with gradient avatar, user handle (`sarah_j`), "Replying to your video" subtitle, and speech bubble tail.
  5. **iOS Notification Storm / Barrage (`ios-barrage`)**: Rapid-fire cascading push notifications dropping from the top with synchronized authentic iPhone notification audio chimes at each arrival.
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
- `20260831_145002_video_1_stroke_c01_lowkey_thought_this_1400.mp4`
- `20260831_145002_video_1_card_c01_lowkey_thought_this_1400.mp4`
- `20260831_145002_video_2_stroke_c02_if_u_buy_groceries.mp4`
- `20260831_145002_video_3_card_c03_literally_just_got_1400.mp4`
---

## 📁 Directory Structure

```text
output/
├── 2026-08-31/
│   └── batch_14-50-02/
│       ├── captions/
│       │   ├── caption_01_lowkey_thought_this_1400_subsidy_card_was_fake/
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
│       │   ├── 20260831_145002_video_1_stroke_c01_lowkey_thought_this_1400.mp4
│       │   └── ... (all rendered MP4s)
│       ├── manifest.json
│       ├── README.md
│       └── tiktok_caption_videos_20260831_145002.zip
├── latest -> ./2026-08-31/batch_14-50-02
└── tiktok_caption_videos.zip
```

---

## 📋 Copy & Paste AI Agent Prompts (Claude, Grokbot, Codex, Cursor)

Don't want to run CLI commands by hand? Simply copy and paste any of these prompts directly into **Claude Code**, **Grokbot**, **Codex**, or **Cursor**:

### 🚀 Prompt 1: Full Batch UGC Ad Generator (All 5 Styles)
```text
Use the overlay-text-video-editor tool in this repository to generate a complete batch of video ad creatives. 
1. Use my raw video cuts in ./assets/raw_cuts/ (or cut 10-12s segments from my raw footage).
2. Render variations across all 5 styles (stroke, card, snapchat, comment, ios-barrage) for the default viral hooks.
3. Organize into date/time folders (output/YYYY-MM-DD/batch_HH-MM-SS/) and build the final .zip archive.
```

### 🔔 Prompt 2: Viral iOS Notification Storm Hook (with iPhone Audio Chimes)
```text
Generate an iOS Notification Storm video using overlay-text-video-editor.
1. Take the grocery footage in ./assets/raw_cuts/video_1.mp4.
2. Apply the 'ios-barrage' style featuring rapid cascading notifications dropping from the top slot (0.6s to 4.5s) with authentic iPhone notification chimes.
3. Output the 1080x1920 30fps MP4 video to ./output/examples/ and verify audio sync and visuals.
```

### 💬 Prompt 3: Social Proof (TikTok Comment Sticker & Snapchat Bar)
```text
Generate social proof video variants using the 'comment' and 'snapchat' overlay styles from overlay-text-video-editor.
1. Source videos: ./assets/raw_cuts/
2. Captions: "is the $910 grocery card for seniors actually legit or a scam?? 😭", "how did your receipt literally say $0.00 at checkout??"
3. Package into timestamped folders with standardized naming conventions and build a zip archive.
```

👉 **For the full prompt library, see [`PROMPTS.md`](./PROMPTS.md)**

---

## ⚡ CLI Command Cheatsheet

```bash
# 1. Run full standard batch (all 6 viral hooks, all cuts, all 5 styles):
bun run start

# 2. Render only the iOS notification barrage storm with audio chimes:
bun run start --styles ios-barrage

# 3. Render classic TikTok stroke and rounded card styles:
bun run start --styles "stroke,card"

# 4. Render with custom inline captions:
bun run start --captions "Stop scrolling 💀, Claim your $1400 subsidy card 🛒"

# 5. Render from a text file containing captions (one per line):
bun run start -f captions.txt

# 6. Attach a custom campaign batch name:
bun run start --batch-name summer_promo --captions "Claim your card today 💸"

# 7. Use custom video footage folder and custom output destination:
bun run start -d ./my_raw_footage -o ./campaign_dist

# 8. Set custom rendering concurrency (e.g. 4 parallel FFmpeg workers):
bun run start --concurrency 4

# 9. Render directly into output root without nested date subfolders:
bun run start --no-date-folder
```

## 💻 Programmatic API

```typescript
import { VideoEditor, batchRender } from './src/editor';

const manifest = await batchRender({
  captions: [
    "lowkey thought this $1400 subsidy card was fake until my Walmart receipt literally said $0.00 😭💀",
    "if u buy groceries and haven't claimed ur $910 grocery card for seniors yet u are literally throwing away money 😭",
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

- *"Cut 10 seconds from these raw videos and add TikTok stroke captions for my $1400 subsidy card hook."*
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
