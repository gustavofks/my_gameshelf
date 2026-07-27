export interface ParsedRom {
  title: string;
  region: string | null;
  discNumber: number | null;
  revision: string | null;
  /** True when stripping tags left nothing, so the raw name was kept as title. */
  fallbackUsed: boolean;
}

const REGION_MAP: Record<string, string> = {
  usa: 'USA',
  us: 'USA',
  u: 'USA',
  'north america': 'USA',
  europe: 'EUR',
  eur: 'EUR',
  eu: 'EUR',
  e: 'EUR',
  japan: 'JPN',
  jpn: 'JPN',
  j: 'JPN',
  world: 'WORLD',
  w: 'WORLD',
  brazil: 'BRA',
  korea: 'KOR',
  australia: 'AUS',
};

const TAG_PATTERN = /[([]([^)\]]*)[)\]]/g;

/**
 * Scene releases prefix the title with a catalogue number, as in
 * "0102 - Nintendogs". Requires the " - " separator so titles that legitimately
 * start with digits ("1080 Snowboarding") are left alone.
 */
const RELEASE_PREFIX = /^\d{3,5}\s*-\s*/;

export function parseRomFilename(
  filename: string,
  knownExtensions: string[],
): ParsedRom {
  const withoutExtension = stripKnownExtension(filename, knownExtensions);
  const base = withoutExtension.replace(RELEASE_PREFIX, '');

  let region: string | null = null;
  let discNumber: number | null = null;
  let revision: string | null = null;

  for (const match of base.matchAll(TAG_PATTERN)) {
    const tag = match[1].trim();

    const disc = /^disc\s+(\d+)$/i.exec(tag);
    if (disc) {
      discNumber = Number(disc[1]);
      continue;
    }

    const rev = /^rev\s+([a-z0-9]+)$/i.exec(tag);
    if (rev) {
      revision = rev[1].toUpperCase();
      continue;
    }

    if (region === null) {
      // "(USA, Europe)" lists several regions; the first known one wins.
      for (const token of tag.split(',')) {
        const mapped = REGION_MAP[token.trim().toLowerCase()];
        if (mapped) {
          region = mapped;
          break;
        }
      }
    }
  }

  const stripped = base.replace(TAG_PATTERN, '').replace(/\s+/g, ' ').trim();
  const fallbackUsed = stripped.length === 0;
  const title = fallbackUsed ? base.trim() : stripped;

  return { title, region, discNumber, revision, fallbackUsed };
}

function stripKnownExtension(
  filename: string,
  knownExtensions: string[],
): string {
  const lower = filename.toLowerCase();
  for (const extension of knownExtensions) {
    if (lower.endsWith(extension.toLowerCase())) {
      return filename.slice(0, filename.length - extension.length);
    }
  }
  return filename;
}
