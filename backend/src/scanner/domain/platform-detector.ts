import type { PlatformDefinition } from '../../platforms/platform.registry';

export type DetectionResult =
  | { kind: 'match'; platform: PlatformDefinition }
  | { kind: 'unknown-extension' };

/**
 * Resolves a file's platform from its extension alone — the folder it lives in
 * plays no part, so a mixed folder classifies each file correctly. An extension
 * no platform owns (cover art, saves, docs) is reported as unknown and ignored
 * by the caller.
 */
export function detectPlatform(
  extension: string,
  platforms: PlatformDefinition[],
): DetectionResult {
  const normalized = extension.toLowerCase();
  const platform = platforms.find((candidate) =>
    candidate.extensions.includes(normalized),
  );

  if (!platform) {
    return { kind: 'unknown-extension' };
  }

  return { kind: 'match', platform };
}
