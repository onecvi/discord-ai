import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

esbuild.build({
    entryPoints: [path.join(__dirname, 'index.mjs')],
    bundle: true,
    minify: true,
    outfile: path.join(__dirname, 'dist', 'bundle.js'),
    platform: 'node',
    target: 'node16',
    sourcemap: true,
    format: 'esm',
    external: [
        'discord.js',
        'dotenv',
        'fs',
        'path'
    ],
}).then(() => {
    console.log('Build completed successfully.');
}).catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});