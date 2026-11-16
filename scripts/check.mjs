import { readFile, access } from 'node:fs/promises';
const dist = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', dist), 'utf8');
const css = await readFile(new URL('style.css', dist), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g), ...css.matchAll(/url\('\.\/([^']+)'\)/g)];
await Promise.all(assets.map(match => access(new URL(match[1], dist))));
console.log(`Thiệp hợp lệ: ${assets.length} tham chiếu tài nguyên cục bộ. Bản phát hành sẵn có trong dist/.`);
