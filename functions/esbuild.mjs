import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'lib/index.js',
  sourcemap: true,
  // Keep firebase-* external — Firebase runtime provides them
  external: ['firebase-functions', 'firebase-admin'],
  // Resolve workspace package imports
  alias: {
    '@petpawsphere/db': '../packages/db/src/index.ts',
  },
});

console.log('Functions bundled successfully → lib/index.js');
