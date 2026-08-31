export type CaptionStyle = 'stroke' | 'card';

export interface EditorOptions {
  /** List of captions to process. Defaults to DEFAULT_CAPTIONS */
  captions?: string[];
  /** Path to a file containing captions (one per line or JSON array) */
  captionsFile?: string;
  /** List of video file paths to process */
  videos?: string[];
  /** Directory containing raw video cuts. Defaults to 'assets/raw_cuts' */
  videosDir?: string;
  /** Styles to generate ('stroke', 'card', or both). Defaults to ['stroke', 'card'] */
  styles?: CaptionStyle[];
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
  /** Enable verbose console logging */
  verbose?: boolean;
}

export interface RenderedVideoItem {
  id: string;
  standardFileName: string;
  standardFlatFileName: string;
  date: string;
  time: string;
  timestamp: string;
  captionIndex: number;
  captionText: string;
  captionSlug: string;
  captionShortSlug: string;
  style: CaptionStyle;
  rawVideoPath: string;
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

export const DEFAULT_CAPTIONS: string[] = [
  "lowkey thought this $500 grocery card was fake until my Walmart receipt literally said $0.00 😭💀",
  "if u buy groceries and haven't claimed ur $500 allowance card yet u are literally throwing away money 😭",
  "literally just got $500 worth of groceries for free because of this allowance card 😭🛒",
  "stop paying full price for groceries when everyone is using this $500 grocery card 💀💸",
  "pov: you finally claimed the $500 grocery allowance card before it ran out 😭✨",
  "i was today years old when i found out anyone can get this $500 grocery card 💀🛒",
];
