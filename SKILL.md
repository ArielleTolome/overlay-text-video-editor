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

## 📋 Copy & Paste AI Agent Prompts (Claude, Grokbot, Codex, Cursor)

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

---

## 🚀 Quick CLI Execution Recipes

```bash
# Default batch run (all 5 styles across default cuts and captions):
bun run start

# iOS notification barrage with authentic audio chimes:
bun run start --styles ios-barrage

# Custom captions inline:
bun run start --captions "Stop scrolling 💀, Claim your $1400 subsidy card 🛒, Free Walmart hack 😭"
# Specific styles (e.g. snapchat and comment):
bun run start --styles "snapchat,comment"

# Custom video cuts directory and campaign batch name:
bun run start -d ./my_raw_footage --batch-name promo_campaign -o ./campaign_dist
```
---

## 🎨 Overlay Styles (10 Authentic Social & CapCut Styles)

### TikTok Native Text Styles:
1. **Classic TikTok Stroke (`stroke`)**: High-impact bold white sans-serif with heavy black outline (`-webkit-text-stroke: 4.5px #000`), drop-shadow, and full emoji support (`😭💀`).
2. **TikTok Stepped Contour Badge (`card`)**: Authentic stepped contour badge where each line of text gets its own tight white rounded pill container (`background: #ffffff; color: #000000; border-radius: 20px`).
3. **TikTok Two-Tone Stacked Block (`twotone`)**: Dual-tone stacked badge: Top block in solid black with bold uppercase white text, Bottom block in solid white with purple accent text (`#9b27dc`).
4. **TikTok Native Typewriter (`typewriter`)**: Monospaced typewriter font (`Courier Prime`) with tight black background blocks per line for investigative / true crime / storytelling aesthetics.
5. **TikTok Native Neon Glow (`neon`)**: Glowing uppercase neon tube text with multi-layer pink/cyan bloom (`text-shadow: 0 0 18px #ff0055, 0 0 35px #ff0055`).
6. **TikTok Comment Reply Sticker (`comment`)**: Realistic comment reply sticker with gradient user avatar (`sarah_j`), "Replying to your video" subtitle, dark body text, and speech bubble tail.

### CapCut & Social Formats:
7. **CapCut Viral Yellow Bounce (`capcut-bounce`)**: CapCut's #1 viral auto-caption style with ultra-bold uppercase text, 5px black stroke, and **vibrant bouncing yellow (`#ffe600`) keyword highlights**.
8. **CapCut Red Box Highlight (`capcut-redbox`)**: Dramatic high-contrast white text with critical focus words wrapped in a **vibrant red rectangular pill box (`background: #e50914;`)**.
9. **Snapchat Translucent Bar (`snapchat`)**: Full-width horizontal translucent black banner (`background: rgba(0, 0, 0, 0.65)`, blur) with clean white text centered across the video.
10. **iOS Notification Storm / Barrage (`ios-barrage`)**: Fast-paced cascading notification bombardment dropping from the top with synchronized authentic iPhone notification audio chimes.
All rendered videos follow standardized, timestamped naming conventions:

- **In Caption Subfolders (`captions/<caption_slug>/`)**:
  - `[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4`
  - *Example*: `20260831_145002_video_1_stroke_c01.mp4`
  - *Example*: `20260831_145002_video_1_card_c01.mp4`

- **In Flat Directory (`all_videos/`)**:
  - `[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4`
  - *Example*: `20260831_145002_video_1_stroke_c01_lowkey_thought_this_1400.mp4`
---

## 📂 Output Folder Structure

```text
output/
├── 2026-08-31/
│   └── batch_14-50-02/
│       ├── captions/
│       │   ├── caption_01_lowkey_thought_this_1400_subsidy_card_was_fake/
│       │   │   ├── caption.txt
│       │   │   ├── metadata.json
│       │   │   ├── 20260831_145002_video_1_stroke_c01.mp4
│       │   │   └── ...
│       │   └── ...
│       ├── all_videos/
│       │   ├── 20260831_145002_video_1_stroke_c01_lowkey_thought_this_1400.mp4
│       │   └── ...
│       ├── manifest.json
│       ├── README.md
│       └── tiktok_caption_videos_20260831_145002.zip
```

---

## 💻 Programmatic Agent Invocation

```typescript
import { batchRender } from './src/editor';

const manifest = await batchRender({
  captions: [
    "lowkey thought this $1400 subsidy card was fake until my Walmart receipt literally said $0.00 😭💀",
    "if u buy groceries and haven't claimed ur $910 grocery card for seniors yet u are literally throwing away money 😭"
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
