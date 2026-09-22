import { AppError } from '../middleware/errorHandler.js';

export interface PngValidationResult {
  width: number;
  height: number;
  colorType: number;
  hasAlpha: boolean;
}

/**
 * Validates that a buffer is a 1080x1080 PNG image with transparency/alpha.
 */
export function validatePngFrame(buffer: Buffer): PngValidationResult {
  if (!buffer || buffer.length < 30) {
    throw new AppError(400, 'Invalid file: File is empty or truncated');
  }

  // PNG magic bytes check: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < pngHeader.length; i++) {
    if (buffer[i] !== pngHeader[i]) {
      throw new AppError(400, 'Invalid image format: File must be a valid PNG image');
    }
  }

  // Read IHDR chunk
  // Chunk type starts at offset 12 ("IHDR" = 0x49 0x48 0x44 0x52)
  const ihdrHeader = Buffer.from([0x49, 0x48, 0x44, 0x52]);
  if (!buffer.subarray(12, 16).equals(ihdrHeader)) {
    throw new AppError(400, 'Invalid PNG: Missing IHDR header chunk');
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer[25]; // 0=Gray, 2=RGB, 3=Indexed, 4=Gray+Alpha, 6=RGBA

  if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
    throw new AppError(
      400,
      `Invalid frame dimensions: Image dimensions must be between 1x1 and 10000x10000 pixels (received ${width}x${height})`,
    );
  }

  // Color types with alpha: 6 (RGBA), 4 (Grayscale+Alpha)
  // Color types 2/3 can have tRNS chunk for transparency.
  let hasAlpha = colorType === 6 || colorType === 4;

  if (!hasAlpha) {
    // Search for 'tRNS' chunk if not native alpha color type
    let offset = 8; // skip PNG signature
    while (offset < buffer.length - 8) {
      const chunkLength = buffer.readUInt32BE(offset);
      const chunkType = buffer.toString('ascii', offset + 4, offset + 8);

      if (chunkType === 'tRNS') {
        hasAlpha = true;
        break;
      }
      if (chunkType === 'IDAT') {
        // IDAT comes after metadata chunks
        break;
      }

      offset += 12 + chunkLength; // 4 (len) + 4 (type) + len (data) + 4 (crc)
    }
  }

  if (!hasAlpha) {
    throw new AppError(
      400,
      'Invalid frame image: The campaign frame PNG must contain transparency (RGBA / alpha channel)',
    );
  }

  return { width, height, colorType: colorType!, hasAlpha };
}
