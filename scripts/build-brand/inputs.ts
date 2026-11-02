// Hashes everything build-brand reads. The stored hash lets the preview and the
// tests notice when someone changed the config but didn't rebuild.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walkFiles(path) : [path];
    })
    .sort();
}

export function hashBrandInputs(root: string): string {
  const paths = [
    ...walkFiles(join(root, 'brand-files')).filter(
      (path) => !relative(root, path).startsWith('brand-files/generated/')
    ),
    ...walkFiles(join(root, 'scripts/build-brand')),
    join(root, 'src/brand/brand.config.server.ts'),
    join(root, 'src/brand/types.ts'),
    join(root, 'src/lib/color.ts'),
    join(root, 'src/lib/theme.ts'),
    join(root, 'src/lib/tokens.ts'),
    join(root, 'src/lib/brand-files.ts')
  ].sort();
  const hash = createHash('sha256');
  for (const path of paths) {
    hash.update(relative(root, path));
    hash.update(readFileSync(path));
  }
  return hash.digest('hex');
}
