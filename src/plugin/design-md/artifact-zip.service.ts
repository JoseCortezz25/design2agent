import { strToU8, zipSync } from 'fflate';
import type { DesignMdArtifactBundle } from '@common/design-md/domain.types';

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function createArtifactZipBase64(
  artifactBundle: Pick<
    DesignMdArtifactBundle,
    'markdown' | 'dtcgJson' | 'tailwindV4Css'
  >
): string {
  const zipEntries: Record<string, Uint8Array> = {};

  if (artifactBundle.markdown != null) {
    zipEntries[artifactBundle.markdown.fileName] = strToU8(
      artifactBundle.markdown.content
    );
  }

  if (artifactBundle.dtcgJson != null) {
    zipEntries[artifactBundle.dtcgJson.fileName] = strToU8(
      artifactBundle.dtcgJson.content
    );
  }

  if (artifactBundle.tailwindV4Css != null) {
    zipEntries[artifactBundle.tailwindV4Css.fileName] = strToU8(
      artifactBundle.tailwindV4Css.content
    );
  }

  const zipBytes = zipSync(zipEntries, { level: 6 });
  return encodeBase64(zipBytes);
}
