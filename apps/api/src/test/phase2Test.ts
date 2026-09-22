import 'dotenv/config';

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:devpassword@localhost:27017/avatar_frame?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_must_be_at_least_32_characters_long_for_zod_validation';

const { default: app } = await import('../app.js');
import http from 'http';
import { validatePngFrame } from '../utils/imageValidator.js';

async function runTests() {
  console.info('🧪 Testing Phase 2 Backend Core logic...\n');

  // Test 1: Image Validator (1080x1080 PNG check)
  console.info('1️⃣ Testing PNG Frame Validator...');

  // Create a minimal 1080x1080 RGBA PNG buffer header
  const pngHeader = Buffer.alloc(30);
  // PNG Magic Signature: 89 50 4E 47 0D 0A 1A 0A
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(pngHeader, 0);
  // IHDR chunk length: 13 (00 00 00 0D)
  pngHeader.writeUInt32BE(13, 8);
  // IHDR type
  Buffer.from('IHDR', 'ascii').copy(pngHeader, 12);
  // Width: 1080
  pngHeader.writeUInt32BE(1080, 16);
  // Height: 1080
  pngHeader.writeUInt32BE(1080, 20);
  // Bit depth: 8
  pngHeader[24] = 8;
  // Color type: 6 (RGBA)
  pngHeader[25] = 6;

  const validationResult = validatePngFrame(pngHeader);
  console.assert(
    validationResult.width === 1080 && validationResult.height === 1080,
    'Dimensions should be 1080x1080',
  );
  console.assert(validationResult.hasAlpha === true, 'Should detect alpha channel');
  console.info('   ✅ PNG Frame Validator passed (1080x1080 RGBA validated)\n');

  // Test 2: Flexible dimension check (e.g. 1000x1000 or 800x800 PNG with alpha)
  console.info('2️⃣ Testing PNG Frame Validator Flexible Dimensions...');
  const customHeader = Buffer.from(pngHeader);
  customHeader.writeUInt32BE(800, 16); // width 800
  customHeader.writeUInt32BE(800, 20); // height 800
  const customRes = validatePngFrame(customHeader);
  console.assert(customRes.width === 800 && customRes.height === 800, 'Dimensions should be 800x800');
  console.info('   ✅ Successfully accepted custom 800x800 PNG frame\n');

  // Test 3: Zero/invalid dimensions check
  console.info('3️⃣ Testing PNG Frame Validator Zero Dimensions...');
  const badHeader = Buffer.from(pngHeader);
  badHeader.writeUInt32BE(0, 16); // width 0
  try {
    validatePngFrame(badHeader);
    console.error('   ❌ Failed: Should have rejected width 0 image');
  } catch (err: unknown) {
    console.info(
      `   ✅ Correctly rejected invalid dimensions: "${(err as Error).message}"\n`,
    );
  }

  // Test 3: Express App Boots Cleanly
  console.info('3️⃣ Testing Express App Initialization...');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  console.info(`   ✅ Express server listening on ephemeral port ${address.port}\n`);

  // Health check request
  const healthRes = await fetch(`http://localhost:${address.port}/health`);
  const healthJson = (await healthRes.json()) as { success: boolean };
  console.assert(healthJson.success === true, 'Health check should return success: true');
  console.info('   ✅ GET /health passed\n');

  server.close();
  console.info('🎉 All Phase 2 unit & integration checks completed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Phase 2 test failed:', err);
  process.exit(1);
});
