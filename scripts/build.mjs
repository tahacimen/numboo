import { cp, mkdir, rm } from 'node:fs/promises';

const files = ['index.html', 'app.js', 'game-core.js', 'i18n.js', 'styles.css'];
const directories = ['assets'];
await rm('www', { recursive: true, force: true });
await mkdir('www', { recursive: true });
await Promise.all([
  ...files.map((file) => cp(file, `www/${file}`)),
  ...directories.map((directory) => cp(directory, `www/${directory}`, { recursive: true })),
]);
console.log('Web assets built in www/.');
