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

### 🎬 Prompt 4: Multi-Clip UGC Stitcher (Reaction Hook + App Gameplay Demo + CTA)
```text
Use the UGC stitcher in overlay-text-video-editor to produce a high-converting 3-block ad video.
1. Pick a reaction hook (e.g. 'jaw-drop' or 'shook' from the local hook library).
2. Cut in my app gameplay/screen recording from ./assets/raw_cuts/video_1.mp4.
3. Generate a 3-block script via CLIProxyAPI / Gemini and voiceover with Fish Audio.
4. Mix in trending TikTok background music ducked under the speech at 20% volume.
5. Score virality and export the finished 1080x1920 30fps MP4.
```
---

## 🚀 Quick CLI Execution Recipes

```bash
# Default batch run (all 17 styles across default cuts and captions):
bun run start

# Sequential two-phase captions with timed CTA pill popping at 4.5s:
bun run start --captions "POV: Walmart gave me a grocery giftcard 😭" --secondary-caption "tap below before it gets patched 👇" --secondary-delay 4.5

# Apple Notes Checklist Card with top placement (perfect for headroom B-roll):
bun run start --styles ios-notes --placement top --captions "REMOTE DATA ENTRY 29/HR | Laptop provided | Flexible schedule"

# High-urgency Ruby Translucent Glass Alert:
bun run start --styles crimson-alert --placement chest --captions "URGENT: Claim before spots close tonight 🚨"

# Two-phase staggered card stack:
bun run start --styles staggered-stack --captions "pov: testing mobile games paid my rent 🤭 // link is below girlies 👇"

# iOS notification barrage with authentic audio chimes:
bun run start --styles ios-barrage

# Custom video cuts directory and campaign batch name:
bun run start -d ./my_raw_footage --batch-name promo_campaign -o ./campaign_dist

# Multi-clip UGC stitcher (reaction hook + app demo + text overlays + virality score):
bun run start --stitch --hook jaw-drop --demo assets/raw_cuts/video_1.mp4 --hook-dur 2.5 --demo-dur 4.0 --hook-text "my honest reaction after finding this app 💀" --cta-text "try it free on App Store 👇" --score

# Full automated UGC pipeline (CLIProxyAPI script + Fish Audio TTS + ducked music):
bun run start --stitch --hook shook --demo assets/raw_cuts/video_2.mp4 --generate-script --app-name "BitePal" --niche "grocery" --music assets/reference_videos/format-01-reaction-cz8qqcpn.mp4 --music-vol 0.20 --score
```
---

## 🎨 Overlay Styles (17 Authentic TikTok, CapCut & Social Styles)

### TikTok Native Text Styles:
1. **Classic TikTok Stroke (`stroke`)**: High-impact bold white sans-serif with heavy black outline (`-webkit-text-stroke: 4.5px #000`), drop-shadow, and full emoji support (`😭💀`).
2. **TikTok Stepped Contour Badge (`card`)**: Authentic white stepped contour badge where each line of text gets its own tight white rounded pill container (`background: #ffffff; color: #000000; border-radius: 20px`).
3. **TikTok Inverted Black Contour (`black-contour`)**: Dark mode stepped contour badge: Solid black pills hugging each line with bold crisp white text (`background: #000000; color: #ffffff;`).
4. **TikTok Two-Tone Stacked Block (`twotone`)**: Dual-tone stacked badge: Top block in solid black with uppercase white text, Bottom block in solid white with purple accent text (`#9b27dc`).
5. **TikTok Native Typewriter (`typewriter`)**: Monospaced typewriter font (`Courier Prime`) with tight black background blocks per line.
6. **TikTok Native Neon Glow (`neon`)**: Glowing uppercase neon tube text with multi-layer pink/cyan bloom (`text-shadow: 0 0 18px #ff0055`).
7. **TikTok Comment Reply Sticker (`comment`)**: Realistic comment reply sticker with gradient user avatar (`sarah_j`), "Replying to your video" subtitle, dark body text, and speech bubble tail.

### CapCut & Social Formats:
8. **CapCut Alternating B&W Stack (`bw-stacked`)**: Alternating black and white stacked rectangular blocks per line (Line 1 black/white, Line 2 white/black).
9. **CapCut Minimalist Black Vlog Capsule (`minimal-vlog`)**: Clean frosted black capsule pill (`background: rgba(16, 16, 20, 0.92); border-radius: 999px;`) with uppercase tracking typography.
10. **CapCut Viral Yellow Bounce (`capcut-bounce`)**: CapCut's #1 viral auto-caption style with ultra-bold uppercase text, 5px black stroke, and **vibrant bouncing yellow (`#ffe600`) keyword highlights**.
11. **CapCut Red Box Highlight (`capcut-redbox`)**: Dramatic high-contrast white text with critical focus words wrapped in a **vibrant red rectangular pill box (`background: #e50914;`)**.
12. **Snapchat Translucent Bar (`snapchat`)**: Full-width horizontal translucent black banner (`background: rgba(0, 0, 0, 0.65)`, blur) with clean white text centered across the video.
13. **iOS Notification Storm / Barrage (`ios-barrage`)**: Fast-paced cascading notification bombardment dropping from the top with synchronized authentic iPhone notification audio chimes.
14. **Apple Notes Checklist Card (`ios-notes`)**: Authentic Apple Notes UI with yellow navigation header (`< Notes`, share icon, circle menu), yellow marker highlighter accent on key figures, and circular radio checklist items.
15. **Floating Action CTA Pill (`cta-pill`)**: High-converting capsule action pill (`border-radius: 9999px`) with bouncing pointer emoji (`👇`, `🔗`, `👉`) designed to sit right above feed action buttons.
16. **Ruby Translucent Glass Badge (`crimson-alert`)**: Deep crimson translucent glass card (`background: rgba(190, 18, 60, 0.88)`, `backdrop-filter: blur(24px)`) with glowing alert badge for extreme scroll-stopping power.
17. **TikTok Staggered Two-Phase Stack (`staggered-stack`)**: Primary hook card at $t=0$ accompanied by a synchronized secondary follow-up card or CTA pill stacked directly beneath.
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
