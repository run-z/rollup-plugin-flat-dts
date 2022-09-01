import isGlob from 'is-glob';
import micromatch from 'micromatch';

export function moduleMatcher(
  patterns: string | readonly string[] | undefined,
): (name: string) => boolean {
  const globs = patternsToGlobs(patterns);

  if (!globs.length) {
    return _name => false;
  }

  return name => micromatch.isMatch(name, globs, { dot: true });
}

function patternsToGlobs(patterns: string | readonly string[] | undefined): readonly string[] {
  return patterns
    ? Array.isArray(patterns)
      ? (patterns as readonly string[]).map(patternToGlob)
      : [patternToGlob(patterns as string)]
    : [];
}

function patternToGlob(pattern: string): string {
  return isGlob(pattern, { strict: false }) ? pattern : `${pattern}/**`;
}
