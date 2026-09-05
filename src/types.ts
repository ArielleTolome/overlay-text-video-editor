export type CaptionStyle = 
  | 'stroke' 
  | 'card' 
  | 'black-contour' 
  | 'twotone' 
  | 'bw-stacked' 
  | 'minimal-vlog' 
  | 'typewriter' 
  | 'neon' 
  | 'capcut-bounce' 
  | 'capcut-redbox' 
  | 'snapchat' 
  | 'comment' 
  | 'ios-barrage'
  | 'ios-notes'
  | 'cta-pill'
  | 'crimson-alert'
  | 'staggered-stack';

export type CaptionPlacement = 'top' | 'center' | 'chest' | 'bottom';

export interface ClipSegment {
  path: string;
  start?: number; // seconds
  duration?: number; // seconds
  speed?: number; // speed multiplier (e.g. 1.0, 2.0)
  label?: string; // 'hook' | 'demo' | 'cta' | string
}

export interface TextOverlaySegment {
  text: string;
  start: number;
  end: number;
  style?: CaptionStyle;
  placement?: CaptionPlacement;
  emphasisWords?: string[];
}

export interface StitchOptions {
  hookClip: string | ClipSegment;
  demoClips?: (string | ClipSegment)[];
  ctaClip?: string | ClipSegment;
  hookDuration?: number;
  demoDuration?: number;
  ctaDuration?: number;
  outputVideo: string;
  targetDuration?: number;
  textOverlays?: TextOverlaySegment[];
  ttsText?: string;
  ttsVoice?: string;
  musicSource?: string;
  musicVolume?: number;
  verbose?: boolean;
  colorGrade?: string;
  zoomPunch?: { startTime?: number; duration?: number; zoomFactor?: number };
  highlightRing?: { x: number; y: number; radius?: number; color?: string; label?: string; startTime?: number; endTime?: number };
  selfEval?: boolean;
}

export interface AIEngineConfig {
  cliproxyUrl?: string;
  geminiApiKey?: string;
  fishAudioUrl?: string;
  fishAudioApiKey?: string;
}

export interface ScriptConcept {
  appName: string;
  niche: string;
  hookEmotion: string;
  hookText: string;
  demoVoiceover: string;
  ctaText: string;
  emphasisWords: string[];
}

export interface ViralityReport {
  overallScore: number;
  hookStrength: number;
  emotionalImpact: number;
  pacingFlow: number;
  textReadability: number;
  completionLikelihood: number;
  shareability: number;
  topStrength: string;
  topWeakness: string;
  improvementTip: string;
}
export interface EditorOptions {
  /** List of captions to process. Defaults to DEFAULT_CAPTIONS */
  captions?: string[];
  /** Path to a file containing captions (one per line or JSON array) */
  captionsFile?: string;
  /** List of video file paths to process */
  videos?: string[];
  /** Directory containing raw video cuts. Defaults to 'assets/raw_cuts' */
  videosDir?: string;
  /** Styles to generate. Defaults to all 17 styles */
  styles?: CaptionStyle[];
  /** Vertical placement zone ('top', 'center', 'chest', 'bottom'). Defaults to style native placement */
  placement?: CaptionPlacement;
  /** Optional secondary follow-up caption or CTA text to appear sequentially */
  secondaryCaption?: string;
  /** Delay in seconds before secondary caption appears (e.g. 4.0). Defaults to 4.0 */
  secondaryDelay?: number;
  /** Placement of secondary caption ('below', 'above', 'bottom'). Defaults to 'below' */
  secondaryPlacement?: 'below' | 'above' | 'bottom';
  /** Style of secondary caption ('pill', 'card', 'stroke', etc.). Defaults to 'cta-pill' */
  secondaryStyle?: CaptionStyle;
  /** Output directory. Defaults to 'output' */
  outputDir?: string;
  /** Whether to organize outputs into date and time folders. Defaults to true */
  organizeByDate?: boolean;
  /** Optional custom batch name or prefix */
  batchName?: string;
  /** Whether to package output into a zip archive. Defaults to true */
  zip?: boolean;
  /** Name of the zip file. Defaults to 'tiktok_caption_videos.zip' (with timestamp variant) */
  zipName?: string;
  /** Number of concurrent FFmpeg rendering processes. Defaults to 2 */
  concurrency?: number;
  /** Path to custom stroke template HTML */
  strokeTemplatePath?: string;
  /** Path to custom card template HTML */
  cardTemplatePath?: string;
  /** Path to custom snapchat template HTML */
  snapchatTemplatePath?: string;
  /** Path to custom comment template HTML */
  commentTemplatePath?: string;
  /** Path to custom iOS barrage template HTML */
  iosBarrageTemplatePath?: string;
  /** Path to custom two-tone template HTML */
  twotoneTemplatePath?: string;
  /** Path to custom black contour template HTML */
  blackContourTemplatePath?: string;
  /** Path to custom B&W stacked template HTML */
  bwStackedTemplatePath?: string;
  /** Path to custom minimal vlog template HTML */
  minimalVlogTemplatePath?: string;
  /** Path to custom typewriter template HTML */
  typewriterTemplatePath?: string;
  /** Path to custom neon template HTML */
  neonTemplatePath?: string;
  /** Path to custom CapCut bounce template HTML */
  capcutBounceTemplatePath?: string;
  /** Path to custom CapCut red box template HTML */
  capcutRedboxTemplatePath?: string;
  /** Path to custom iOS notes template HTML */
  iosNotesTemplatePath?: string;
  /** Path to custom CTA pill template HTML */
  ctaPillTemplatePath?: string;
  /** Path to custom crimson alert template HTML */
  crimsonAlertTemplatePath?: string;
  /** Path to custom staggered stack template HTML */
  staggeredStackTemplatePath?: string;
  /** Custom notification audio file path */
  sfxPath?: string;
  verbose?: boolean;
  stitchMode?: boolean;
  hookClip?: string;
  demoClip?: string;
  ctaClip?: string;
  hookDuration?: number;
  demoDuration?: number;
  hookText?: string;
  ctaText?: string;
  ttsText?: string;
  musicSource?: string;
  musicVolume?: number;
  generateScript?: boolean;
  appName?: string;
  niche?: string;
  scoreVirality?: boolean;
  listHooks?: boolean;
  colorGrade?: string;
  zoomPunch?: boolean;
  highlight?: string;
  selfEval?: boolean;
  showSession?: boolean;
  autoHookText?: boolean;
  listReactionHooks?: boolean;
}

export interface RenderedVideoItem {
  id: string;
  standardFlatFileName: string;
  date: string;
  time: string;
  timestamp: string;
  captionIndex: number;
  captionText: string;
  captionSlug: string;
  captionShortSlug: string;
  style: CaptionStyle;
  placement?: CaptionPlacement;
  secondaryCaption?: string;
  secondaryDelay?: number;
  rawVideoName: string;
  videoTag: string;
  outputPath: string;
  flatOutputPath: string;
  relativeOutput: string;
  relativeFlatOutput: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
  renderedAt: string;
}

export interface CaptionGroupResult {
  index: number;
  slug: string;
  text: string;
  folderPath: string;
  captionFilePath: string;
  metadataFilePath: string;
  videos: RenderedVideoItem[];
}

export interface BatchManifest {
  batchId: string;
  batchName?: string;
  createdAt: string;
  date: string;
  time: string;
  timestamp: string;
  totalVideos: number;
  totalCaptions: number;
  totalRawVideos: number;
  styles: CaptionStyle[];
  outputDirectory: string;
  batchDirectory: string;
  zipFile?: string;
  zipSizeBytes?: number;
  namingConvention: {
    captionFolderPattern: string;
    allVideosPattern: string;
    exampleCaptionFolder: string;
    exampleAllVideos: string;
  };
  captions: {
    index: number;
    slug: string;
    text: string;
    videos: {
      style: CaptionStyle;
      rawVideo: string;
      outputVideo: string;
      sizeBytes: number;
      duration: number;
    }[];
  }[];
  allVideos: {
    filename: string;
    captionSlug: string;
    style: CaptionStyle;
    rawVideo: string;
    path: string;
    sizeBytes: number;
    duration: number;
  }[];
}

export const REACTION_HOOK_PRESETS: Record<string, string[]> = {
  'jaw-drop': [
    "my honest reaction after finding this app 💀",
    "wait... tell me why nobody told me this existed 😭",
    "my jaw literally hit the floor when it did this",
    "I was today years old when I found out about this...",
    "wait until the end because this makes zero sense 😳",
  ],
  'shook': [
    "POV: you realize you've been doing it wrong your whole life 😳",
    "I lowkey thought this was fake until I tried it myself",
    "how did I not know about this until today?!",
    "still trying to process that this actually works",
    "tell me this isn't black magic...",
  ],
  'belly-laugh': [
    "not me finding the ultimate life cheat code at 2am 💀",
    "I'm never doing this manually ever again 😂",
    "me laughing at everyone who still does this the hard way",
    "the fact that this actually works has me crying 😭",
  ],
  'hyped': [
    "gatekeeping this should literally be illegal 😭✨",
    "stop whatever you're doing and watch this right now",
    "okay but why is NO ONE talking about this app?!",
    "this literally saved me 4 hours of work in 10 seconds",
    "found the secret hack everyone on TikTok is using 💅",
  ],
  'mind-blown': [
    "my brain genuinely cannot comprehend how this works 🤯",
    "this one feature just changed the game forever",
    "I tested 10 different apps and this one blew my mind",
    "you have to see what happens when you tap this...",
  ],
  'obsessed': [
    "I am officially never deleting this app",
    "I've been using this for 3 days and I'm already obsessed",
    "if you don't have this downloaded yet, what are you doing",
    "this replaced 3 different apps on my phone",
  ],
  'emotional': [
    "POV: after months of searching I finally found the one 🥹",
    "I could literally cry tears of joy right now",
    "this took all my anxiety away in under a minute",
    "for anyone who's been struggling with this like me...",
  ],
  'unboxing': [
    "let's see if the hype on TikTok is actually real 👀",
    "everyone has been tagging me in this, so here we go",
    "honest review: is it worth the hype?",
  ],
  'pov': [
    "POV: you just discovered the best kept secret on the internet",
    "POV: you finally found the hack that actually works",
    "POV: your daily routine just got 10x easier",
  ],
  'reaction': [
    "my unfiltered reaction to using this for the first time",
    "I did NOT expect it to work this well",
    "watch until the end to see what it actually did",
  ],
};

export function getReactionHookForEmotion(emotion: string, index = 0): string {
  const key = emotion.toLowerCase().trim();
  const list = REACTION_HOOK_PRESETS[key] || REACTION_HOOK_PRESETS['jaw-drop']!;
  const safeIndex = Math.abs(index) % list.length;
  return list[safeIndex] || list[0]!;
}

export const DEFAULT_CAPTIONS: string[] = [
  "my honest reaction after finding this app 💀",
  "POV: you realize you've been doing it wrong your whole life 😳",
  "gatekeeping this should literally be illegal 😭✨",
  "not me finding the ultimate life cheat code at 2am 💀",
  "I was today years old when I found out about this...",
  "how did I not know about this until today?!",
];
