import fs from 'fs';

const p = 'c:/Users/Keem/Desktop/docbuilder/docbuilder-frontend/data/db.json';
let content = fs.readFileSync(p, 'utf8');
const count = (content.match(/"usr-admin"/g) || []).length;
content = content.replaceAll('"usr-admin"', '"01a0fa5c-e3e4-7013-a331-93a672d1fc20"');
fs.writeFileSync(p, content, 'utf8');
console.log('Replaced', count, 'occurrences of "usr-admin" in data/db.json');
