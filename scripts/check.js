const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const problems = [];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(root);

for (const file of files.filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`${path.relative(root, file)}: ${result.stderr.trim()}`);
}

for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) problems.push(`${path.relative(root, file)}: IDs duplicados: ${[...new Set(duplicates)].join(', ')}`);

  for (const match of html.matchAll(/\b(?:src|href)=["']([^"'#?]+)["']/g)) {
    const ref = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|blob:|\/\/)/.test(ref)) continue;
    const target = path.resolve(path.dirname(file), ref);
    if (!fs.existsSync(target)) problems.push(`${path.relative(root, file)}: referência ausente ${ref}`);
  }
}

const manifestPath = path.join(root, 'manifest.json');
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const icon of manifest.icons || []) {
    const target = path.join(root, icon.src.replace(/^\//, ''));
    if (!fs.existsSync(target)) problems.push(`manifest.json: ícone ausente ${icon.src}`);
  }
} catch (error) {
  problems.push(`manifest.json inválido: ${error.message}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Validação concluída: ${files.filter(file => file.endsWith('.js')).length} JS, ${files.filter(file => file.endsWith('.html')).length} HTML e manifest.`);
