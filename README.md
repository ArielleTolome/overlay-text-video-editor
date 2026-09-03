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

- **17 Authentic Social, TikTok & CapCut Overlay Styles**:
  1. **Classic TikTok Stroke (`stroke`)**: High-impact bold white sans-serif with heavy black outline (`-webkit-text-stroke: 4.5px #000`), drop-shadow, and full emoji support (`😭💀`).
  2. **TikTok Stepped Contour Badge (`card`)**: Authentic white stepped contour badge where each line of text gets its own tight white rounded pill container (`background: #ffffff; color: #000000; border-radius: 20px`).
  3. **TikTok Inverted Black Contour (`black-contour`)**: Dark mode stepped contour badge: Solid black pills hugging each line with bold crisp white text (`background: #000000; color: #ffffff;`).
  4. **TikTok Two-Tone Stacked Block (`twotone`)**: Dual-tone stacked badge: Top block in solid black with uppercase white text, Bottom block in solid white with purple accent text (`#9b27dc`).
  5. **TikTok Native Typewriter (`typewriter`)**: Monospaced typewriter font (`Courier Prime`) with tight black background blocks per line.
  6. **TikTok Native Neon Glow (`neon`)**: Glowing uppercase neon tube text with multi-layer pink/cyan bloom (`text-shadow: 0 0 18px #ff0055`).
  7. **TikTok Comment Reply Sticker (`comment`)**: Authentic TikTok comment reply sticker with gradient avatar, user handle (`sarah_j`), and speech bubble tail.
  8. **CapCut Alternating B&W Stack (`bw-stacked`)**: Alternating black and white stacked rectangular blocks per line (Line 1 black/white, Line 2 white/black).
  9. **CapCut Minimalist Black Vlog Capsule (`minimal-vlog`)**: Clean frosted black capsule pill (`background: rgba(16, 16, 20, 0.92); border-radius: 999px;`) with uppercase tracking typography.
  10. **CapCut Viral Yellow Bounce (`capcut-bounce`)**: CapCut's #1 viral auto-caption style with ultra-bold uppercase text, 5px black stroke, and **vibrant bouncing yellow (`#ffe600`) keyword highlights**.
  11. **CapCut Red Box Highlight (`capcut-redbox`)**: Dramatic high-contrast white text with critical focus words wrapped in a **vibrant red rectangular pill box (`background: #e50914;`)**.
  12. **Snapchat Translucent Bar (`snapchat`)**: Full-width horizontal translucent black banner (`background: rgba(0, 0, 0, 0.65)`, blur) with clean white text.
  13. **iOS Notification Storm / Barrage (`ios-barrage`)**: Rapid-fire cascading push notifications dropping from the top with synchronized authentic iPhone notification audio chimes.
  14. **Apple Notes Checklist Card (`ios-notes`)**: Authentic Apple Notes UI with yellow navigation header (`< Notes`, share icon, circle menu), yellow marker highlighter accent on key figures, and circular radio checklist items.
  15. **Floating Action CTA Pill (`cta-pill`)**: High-converting capsule action pill (`border-radius: 9999px`) with bouncing pointer emoji (`👇`, `🔗`, `👉`) designed to sit right above feed action buttons.
  16. **Ruby Translucent Glass Badge (`crimson-alert`)**: Deep crimson translucent glass card (`background: rgba(190, 18, 60, 0.88)`, `backdrop-filter: blur(24px)`) with glowing alert badge for extreme scroll-stopping power.
  17. **TikTok Staggered Two-Phase Stack (`staggered-stack`)**: Primary hook card at $t=0$ accompanied by a synchronized secondary follow-up card or CTA pill stacked directly beneath.
- **Multi-Zone B-Roll Placement Engine**: Intelligent placement presets tailored for real B-roll video compositions:
  - `--placement top` ($Y \approx 22\%$): Sky, ceiling, car windshield negative space (leaves subjects, walking actions, and faces completely unobstructed).
  - `--placement center` ($Y \approx 46\%$): High-impact ambient and product demo b-roll.
  - `--placement chest` ($Y \approx 60\%$): Selfie and emotional reaction b-roll (keeps eyes, mouth expressions, and head aesthetic 100% visible).
  - `--placement bottom` ($Y \approx 76\%$): Lower-third zone sitting directly above native platform ad controls.
- **Sequential Multi-Caption Timing Engine**: Seamlessly composite timed follow-up captions or CTA action pills that pop in after a configurable delay (e.g. at second 4–5):
  - `--secondary-caption "tap below to get it yourself 👇"`
  - `--secondary-delay 4.5` (seconds)
  - `--secondary-placement bottom`
  - `--secondary-style cta-pill`
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
# 1. Run full standard batch (all default hooks across 17 styles):
bun run start

# 2. Sequential multi-phase captions with timed CTA pill popping at 4.5s:
bun run start --captions "POV: Walmart gave me a grocery giftcard 😭" --secondary-caption "tap below before it gets patched 👇" --secondary-delay 4.5

# 3. Apple Notes Checklist Card with top placement (perfect for headroom B-roll):
bun run start --styles ios-notes --placement top --captions "REMOTE DATA ENTRY 29/HR | Laptop provided | Flexible schedule"

# 4. High-urgency Ruby Translucent Glass Alert:
bun run start --styles crimson-alert --placement chest --captions "URGENT: Claim before spots close tonight 🚨"

# 5. Two-phase staggered card stack:
bun run start --styles staggered-stack --captions "pov: testing mobile games paid my rent 🤭 // link is below girlies 👇"

# 6. Render classic TikTok stroke and rounded card styles:
bun run start --styles "stroke,card"

# 7. Render with custom inline captions:
bun run start --captions "Stop scrolling 💀, Claim your $1400 subsidy card 🛒"

# 8. Render from a text file containing captions (one per line):
bun run start -f captions.txt

# 9. Attach a custom campaign batch name:
bun run start --batch-name summer_promo --captions "Claim your card today 💸"

# 10. Use custom video footage folder and custom output destination:
bun run start -d ./my_raw_footage -o ./campaign_dist

# 11. Set custom rendering concurrency (e.g. 4 parallel FFmpeg workers):
bun run start --concurrency 4

# 12. Render directly into output root without nested date subfolders:
bun run start --no-date-folder
```

## 💻 Programmatic API

```typescript
import { VideoEditor, batchRender } from './src/editor';
const manifest = await batchRender({
  captions: [
    "lowkey thought this $1400 subsidy card was fake until my Walmart receipt literally said $0.00 😭💀",
    "REMOTE DATA ENTRY 29/HR | Laptop provided | Flexible schedule",
  ],
  videosDir: './assets/raw_cuts',
  styles: ['stroke', 'card', 'ios-notes', 'cta-pill', 'crimson-alert', 'staggered-stack'],
  placement: 'chest',
  secondaryCaption: 'tap below before it gets patched 👇',
  secondaryDelay: 4.0,
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
