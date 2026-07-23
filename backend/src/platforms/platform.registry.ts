export interface PlatformDefinition {
  slug: string;
  name: string;
  extensions: string[];
}

export const PLATFORMS: PlatformDefinition[] = [
  { slug: 'nes', name: 'Nintendo Entertainment System', extensions: ['.nes'] },
  { slug: 'snes', name: 'Super Nintendo', extensions: ['.sfc', '.smc'] },
  { slug: 'n64', name: 'Nintendo 64', extensions: ['.n64', '.z64', '.v64'] },
  { slug: 'gb', name: 'Game Boy', extensions: ['.gb'] },
  { slug: 'gbc', name: 'Game Boy Color', extensions: ['.gbc'] },
  { slug: 'gba', name: 'Game Boy Advance', extensions: ['.gba'] },
  { slug: 'ds', name: 'Nintendo DS', extensions: ['.nds'] },
  { slug: 'md', name: 'Sega Mega Drive', extensions: ['.md', '.gen'] },
  { slug: 'psx', name: 'PlayStation', extensions: ['.bin', '.cue', '.iso', '.chd'] },
];

export const ALL_KNOWN_EXTENSIONS: string[] = PLATFORMS.flatMap((p) => p.extensions);
