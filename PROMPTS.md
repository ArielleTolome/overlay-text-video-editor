# 📋 AI Agent Copy & Paste Prompt Library & Command Guide

Ready-to-use copy and paste prompts for **Claude Code**, **Grokbot**, **Codex**, **Cursor**, and terminal CLIs. Simply copy any prompt below, paste it into your AI agent or terminal, and the engine will handle video cutting, overlay generation, audio chime synchronization, date/time packaging, and zip archiving automatically.

---

## 🤖 1. Ready-to-Paste AI Agent Prompts

### Prompt A: Full Multi-Style Batch Video Ad Campaign (All 5 Styles)
> **Best for**: Generating a complete media-buying test bundle ($N$ captions $\times$ $M$ video cuts $\times$ 5 styles) organized into date/time folders with a master zip file.

```text
Please use the overlay-text-video-editor tool in this repository to generate a complete batch of video ad creatives. 

1. Use my raw video cuts in ./assets/raw_cuts/ (or cut 10-12s segments from my raw footage in ./assets/).
2. Render variations for the following viral hook captions across all 5 styles (stroke, card, snapchat, comment, ios-barrage):
   - "lowkey thought this $1400 subsidy card was fake until my Walmart receipt literally said $0.00 😭💀"
   - "if u buy groceries and haven't claimed ur $910 grocery card for seniors yet u are literally throwing away money 😭"
   - "literally just got $1400 worth of groceries for free because of this subsidy card 😭🛒"
   - "stop paying full price for groceries when everyone is using this $910 grocery card 💀💸"
   - "pov: you finally claimed the $1400 subsidy card before it ran out 😭✨"
   - "i was today years old when i found out anyone can get this $910 grocery card 💀🛒"
3. Organize the output into a timestamped directory (output/YYYY-MM-DD/batch_HH-MM-SS/) with captions subfolders, all_videos flat directory, metadata.json for each caption, README index report, and a deliverable .zip archive.
4. Verify the rendered video quality, audio synchronization, and provide me with the path to the final zip file.
```

---

### Prompt B: Viral iOS Notification Storm Hook (with iPhone Audio Chimes)
> **Best for**: Creating high-urgency "leaked sauce" viral ads where notifications rapidly slide down from the top and cover each other with authentic iPhone dings.

```text
Please generate an iOS Notification Storm video using the overlay-text-video-editor engine.

1. Take the raw grocery shopping footage in ./assets/raw_cuts/video_1.mp4.
2. Apply the 'ios-barrage' style featuring rapid cascading notifications dropping from the top slot every 0.7-0.8s:
   - Alert 1 (0.6s): "Alex 🔥: BRO WHERE THE F*** IS THE LINK??? SEND IT RN"
   - Alert 2 (1.3s): "Mom ❤️: call me right now how was your Walmart receipt $0.00?? 😭" (covers Alert 1 as it fades)
   - Alert 3 (2.0s): "Chase Alert 💳: Walmart Supercenter: $0.00 (Subsidy Card Discount -$1,400.00 Applied ✅)"
   - Alert 4 (2.8s): "Tyler 💀: DUDE IT ACTUALLY WORKED WTF I GOT $1400 IN GROCERIES"
   - Alert 5 (3.6s): "emily_v ✨: replied to story: HOW DID YOU GET THIS SEND LINK 😭"
   - Alert 6 (4.5s): "Sarah 🛒: literally got 2 carts full for $0.00 thank you sm 🙏" (holds to end)
3. Mix the authentic iPhone notification chime at each alert drop timestamp over the ambient store audio.
4. Output the 1080x1920 30fps MP4 video to ./output/examples/ and verify the audio sync and visual frames.
```

---

### Prompt C: Social Proof (TikTok Comment Reply & Snapchat Bar)
> **Best for**: Objection handling and authentic testimonial hooks.

```text
Please generate social proof video variants using the 'comment' and 'snapchat' overlay styles from overlay-text-video-editor.

1. Source videos: ./assets/raw_cuts/
2. Captions:
   - "is the $910 grocery card for seniors actually legit or a scam?? 😭"
   - "how did your receipt literally say $0.00 at checkout??"
   - "POV: you finally stopped paying full price for groceries 🛒✨"
3. Render both 'comment' (TikTok comment sticker with user avatar and reply bubble) and 'snapchat' (full-width translucent black banner) styles.
4. Package into timestamped folders with standardized naming conventions and build a zip archive.
```

---

### Prompt D: Custom Campaign with Specific Product & Angle
> **Best for**: E-commerce products, physical goods, app downloads, or custom retail campaigns.

```text
I want to run a batch video render for my campaign [YOUR_CAMPAIGN_NAME].

1. Raw video footage folder: [PATH_TO_YOUR_VIDEOS]
2. My hook captions:
   - "[HOOK 1 - e.g., I literally stopped paying full price for groceries]"
   - "[HOOK 2 - e.g., POV: you found the secret $1400 subsidy card]"
   - "[HOOK 3 - e.g., Why is nobody talking about this grocery hack? 😭]"
3. Styles to render: stroke, card, snapchat, comment, ios-barrage
4. Batch tag: [YOUR_CAMPAIGN_NAME]
5. Please execute via overlay-text-video-editor, package into an organized zip file, and output the summary table.
```

---

## ⚡ 2. Terminal CLI Command Cheatsheet

### 🔹 Quick One-Liners

```bash
# 1. Run full standard batch (all 6 viral hooks, all cuts, all 5 styles):
bun run start

# 2. Render only the iOS notification barrage storm with audio chimes:
bun run start --styles ios-barrage

# 3. Render classic TikTok stroke and rounded card styles:
bun run start --styles "stroke,card"

# 4. Render with custom inline captions:
bun run start --captions "Stop scrolling 💀, Claim your $1400 subsidy card 🛒, Free Walmart hack 😭"

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

# 10. Run the test suite:
bun test
```

---

## 🎛️ 3. Full CLI Options Reference

| Flag | Short | Default | Description |
|---|---|---|---|
| `--captions` | | Default 6 hooks | Comma-separated list of captions in quotes |
| `--captions-file` | `-f` | `""` | Path to text file (one per line) or JSON array of captions |
| `--videos` | | `""` | Comma-separated list of specific video file paths |
| `--videos-dir` | `-d` | `assets/raw_cuts` | Directory containing raw 1080x1920 video cuts |
| `--styles` | | `all` | Styles to render: `stroke`, `card`, `snapchat`, `comment`, `ios-barrage` |
| `--output` | `-o` | `output` | Output root directory |
| `--organize-by-date` | | `true` | Groups batches into `output/YYYY-MM-DD/batch_HH-MM-SS/` |
| `--no-date-folder` | | `false` | Disables date/time folder hierarchy (renders directly into output) |
| `--batch-name` | `-b` | `""` | Custom name or campaign tag prefix for the batch |
| `--zip` | | `true` | Packages all outputs into a standalone `.zip` archive |
| `--no-zip` | | `false` | Disables zip archive creation |
| `--zip-name` | | `tiktok_caption_videos.zip` | Custom filename for the zip archive |
| `--concurrency` | `-c` | `3` | Number of concurrent FFmpeg hardware renderers |
| `--sfx` | | `assets/sfx/...` | Path to custom notification chime audio file |
| `--verbose` | `-v` | `false` | Enables verbose debug logging |
| `--help` | `-h` | | Displays help menu and usage examples |

---

## 🏷️ 4. Standardized Output Naming Conventions

All output videos strictly follow standardized naming rules:

### In Caption Folders (`captions/<caption_slug>/`):
```text
[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG].mp4
```
*Examples:*
- `20260831_145002_video_1_stroke_c01.mp4`
- `20260831_145002_video_1_card_c01.mp4`
- `20260831_145002_video_1_snapchat_c01.mp4`
- `20260831_145002_video_1_comment_c01.mp4`
- `20260831_145002_video_1_ios-barrage_c01.mp4`

### In Flat Collection (`all_videos/`):
```text
[YYYYMMDD]_[HHMMSS]_[RAW_VIDEO]_[STYLE]_[CAPTION_TAG]_[SLUG].mp4
```
*Examples:*
- `20260831_145002_video_1_stroke_c01_lowkey_thought_this_1400.mp4`
- `20260831_145002_video_2_comment_c02_if_u_buy_groceries.mp4`
- `20260831_145002_video_3_ios-barrage_c03_literally_just_got_1400.mp4`

---

## 💡 5. Best Practices for Viral UGC Videos

1. **Safe Zone Placement**: All overlay styles in this engine are positioned between `top: 110px` (notifications) and `top: 38%–48%` (captions/cards) so they never overlap TikTok/Reels UI buttons (like, comment, share, audio disc).
2. **Audio Volume Balance**: Ambient store audio is retained at 100%, and the iPhone notification chimes are mixed with a +1.8x boost to cleanly cut through background murmurs.
3. **Contrast & Readability**: Every overlay uses high-contrast borders (`-webkit-text-stroke: 4.5px #000`), frosted glass (`rgba(24, 24, 28, 0.92)`), and drop shadows to remain legible across bright and dark backgrounds.
