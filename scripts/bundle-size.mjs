#!/usr/bin/env node
// Sums gzipped JS shipped by the build and warns when it exceeds the budget
// (150 KB). Run after `pnpm build`. Exit code is always 0 — it's a guardrail
// with a loud message, not a gate.
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUILD = 'build';
const BUDGET_BYTES = 150 * 1024;

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
}

const files = walk(BUILD).filter((f) => f.endsWith('.js'));
let total = 0;
for (const file of files) {
	const raw = readFileSync(file);
	total += gzipSync(raw).length;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`JS shipped (gzipped): ${kb(total)} across ${files.length} file(s)`);
if (total > BUDGET_BYTES) {
	console.warn(
		`⚠ bundle exceeds the ${kb(BUDGET_BYTES)} budget by ${kb(total - BUDGET_BYTES)} — check what grew`
	);
} else {
	console.log(`within the ${kb(BUDGET_BYTES)} budget (${kb(BUDGET_BYTES - total)} left)`);
}
