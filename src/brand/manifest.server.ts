import type { BrandManifest, ManifestFile } from '~/lib/brand-files';
import data from '../../brand-files/generated/manifest.json';

export const manifest = data as BrandManifest;

const byKey = new Map<string, ManifestFile>(manifest.files.map((f) => [f.key, f]));

export function manifestFile(key: string) {
  return byKey.get(key);
}
