import { cp, mkdir, rm } from 'node:fs/promises';

const files = ['index.html', 'app.js', 'game-core.js', 'styles.css'];
await rm('www', { recursive: true, force: true });
await mkdir('www', { recursive: true });
await Promise.all(files.map((file) => cp(file, `www/${file}`)));
console.log('Web assets built in www/.');
