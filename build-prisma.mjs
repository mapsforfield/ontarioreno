/**
 * Compiles Prisma 7's generated TypeScript files to JavaScript so Vercel's
 * Node.js runtime can load them. Uses a temp dir to avoid tsc's outDir exclusion.
 */
import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync } from 'fs';

const TEMP = '.prisma-compiled';

// Compile src/generated/prisma/**/*.ts → .prisma-compiled/**/*.js
execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });

// Copy compiled JS files back into the source directory
if (existsSync(TEMP)) {
  cpSync(TEMP, 'src/generated/prisma', { recursive: true });
  rmSync(TEMP, { recursive: true, force: true });
}

console.log('✓ Prisma TypeScript → JavaScript done');
