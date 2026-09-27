#!/usr/bin/env node
// Prints the CSP script-src hash for the inline pre-paint theme script in the
// built index.html. Paste it into Caddyfile.web after changing that script.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

try {
	const html = readFileSync('build/index.html', 'utf8');
	const match = html.match(/<script>([\s\S]*?)<\/script>/);
	if (!match) throw new Error('no inline script found');
	const hash = createHash('sha256').update(match[1]).digest('base64');
	console.log(`script-src 'self' 'sha256-${hash}'`);
} catch (err) {
	console.error(`Run \`pnpm build\` first (${err.message}).`);
	process.exit(1);
}
