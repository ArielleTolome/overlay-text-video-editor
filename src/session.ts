import * as fs from 'node:fs';
import * as path from 'node:path';

export interface UserPreferences {
  defaultColorGrade?: string;
  defaultMusicVolume?: number;
  favoriteHooks?: string[];
  preferredStyles?: string[];
  lastAppName?: string;
  lastNiche?: string;
}

export interface RunRecord {
  id: string;
  timestamp: string;
  outputVideo: string;
  duration: number;
  hookEmotion?: string;
  demoClip?: string;
  colorGrade?: string;
  viralityScore?: number;
  evalPassed?: boolean;
}

export interface SessionData {
  version: string;
  lastUpdated: string;
  preferences: UserPreferences;
  runs: RunRecord[];
  topHooks: Record<string, number>; // emotion -> count
}

export class SessionMemory {
  private filePath: string;
  private markdownPath: string;
  private data: SessionData;

  constructor(outputDir?: string) {
    const baseDir = outputDir || path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    this.filePath = path.join(baseDir, 'session_memory.json');
    this.markdownPath = path.join(baseDir, 'project.md');
    this.data = this.load();
  }

  private load(): SessionData {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw) as SessionData;
      } catch {
        // fallback to empty state
      }
    }
    return {
      version: '1.9.0',
      lastUpdated: new Date().toISOString(),
      preferences: {
        defaultColorGrade: 'neutral_punch',
        defaultMusicVolume: 0.2,
        favoriteHooks: ['jaw-drop', 'shook'],
      },
      runs: [],
      topHooks: {},
    };
  }

  public save(): void {
    this.data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    this.exportMarkdown();
  }

  public getPreferences(): UserPreferences {
    return this.data.preferences;
  }

  public updatePreferences(prefs: Partial<UserPreferences>): void {
    this.data.preferences = { ...this.data.preferences, ...prefs };
    this.save();
  }

  public recordRun(run: Omit<RunRecord, 'id' | 'timestamp'>): RunRecord {
    const record: RunRecord = {
      ...run,
      id: `run_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.data.runs.push(record);

    if (run.hookEmotion) {
      this.data.topHooks[run.hookEmotion] = (this.data.topHooks[run.hookEmotion] || 0) + 1;
    }
    this.save();
    return record;
  }

  public getRuns(): RunRecord[] {
    return this.data.runs;
  }

  public exportMarkdown(): string {
    const { preferences, runs, topHooks } = this.data;
    const lines: string[] = [
      '# Project Session Memory & Learning Log',
      '',
      `*Last Updated: ${this.data.lastUpdated}*`,
      '',
      '## ⚙️ Learned Preferences',
      `- **Default Color Grade:** \`${preferences.defaultColorGrade || 'neutral_punch'}\``,
      `- **Default Music Volume:** \`${preferences.defaultMusicVolume ?? 0.2}\``,
      `- **Top Hook Emotions:** ${Object.keys(topHooks).length > 0 ? Object.entries(topHooks).map(([k, v]) => `\`${k}\` (${v}x)`).join(', ') : 'None yet'}`,
      '',
      '## 📜 Recent Video Runs',
      '| Time | Output Video | Duration | Hook | Virality | Evaluated |',
      '|---|---|---|---|---|---|',
    ];

    const recent = runs.slice(-10).reverse();
    if (recent.length === 0) {
      lines.push('| - | No runs recorded yet | - | - | - | - |');
    } else {
      for (const r of recent) {
        const timeStr = r.timestamp.slice(0, 19).replace('T', ' ');
        const hookStr = r.hookEmotion || 'None';
        const vScore = r.viralityScore !== undefined ? `${r.viralityScore}/100` : '-';
        const evalStr = r.evalPassed === undefined ? '-' : (r.evalPassed ? '✅ Pass' : '⚠️ Review');
        lines.push(`| ${timeStr} | \`${path.basename(r.outputVideo)}\` | ${r.duration.toFixed(1)}s | ${hookStr} | ${vScore} | ${evalStr} |`);
      }
    }

    const content = lines.join('\n') + '\n';
    fs.writeFileSync(this.markdownPath, content, 'utf8');
    return content;
  }
}
