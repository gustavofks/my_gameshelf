import type { PlatformDefinition } from '../../platforms/platform.registry';

export type DetectionResult =
  | { kind: 'match'; platform: PlatformDefinition }
  | { kind: 'unknown-platform' }
  | { kind: 'ignored-extension' };

export function detectPlatform(
  folderName: string,
  extension: string,
  platforms: PlatformDefinition[],
): DetectionResult {
  const slug = folderName.toLowerCase();
  const platform = platforms.find((candidate) => candidate.slug === slug);

  if (!platform) {
    return { kind: 'unknown-platform' };
  }

  if (!platform.extensions.includes(extension.toLowerCase())) {
    return { kind: 'ignored-extension' };
  }

  return { kind: 'match', platform };
}
