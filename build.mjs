#!/usr/bin/env node
// Single source of truth -> per-platform agent files.
//
// Every platform file carries the same thakol-auth knowledge between two markers:
//   <!-- BEGIN:thakol-core --> ... <!-- END:thakol-core -->
// This script injects shared/thakol-auth-agent.md between those markers so the six
// platform formats never drift. Run `node build.mjs` to regenerate, or
// `node build.mjs --check` (used in CI) to fail if any file is stale.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(root, 'shared/thakol-auth-agent.md');
const BEGIN = '<!-- BEGIN:thakol-core -->';
const END = '<!-- END:thakol-core -->';

// Files whose body between the markers is generated from SOURCE.
const TARGETS = [
  'claude/.claude/skills/thakol-auth/SKILL.md',
  'claude/.claude/agents/thakol-auth-integrator.md',
  'copilot/.github/copilot-instructions.md',
  'copilot/.github/prompts/thakol-auth.prompt.md',
  'codex/AGENTS.md',
  'cursor/.cursor/rules/thakol-auth.mdc',
  'windsurf/.windsurf/rules/thakol-auth.md',
  'gemini/GEMINI.md',
];

const check = process.argv.includes('--check');
const core = readFileSync(SOURCE, 'utf8').trim();
const stale = [];

for (const rel of TARGETS) {
  const path = join(root, rel);
  const original = readFileSync(path, 'utf8');
  const b = original.indexOf(BEGIN);
  const e = original.indexOf(END);
  if (b === -1 || e === -1 || e < b) {
    console.error(`✗ ${rel}: missing ${BEGIN} / ${END} markers`);
    stale.push(rel);
    continue;
  }
  const next = `${original.slice(0, b + BEGIN.length)}\n\n${core}\n\n${original.slice(e)}`;
  if (next !== original) {
    stale.push(rel);
    if (!check) writeFileSync(path, next);
  }
}

if (check) {
  if (stale.length) {
    console.error(`\n${stale.length} file(s) out of date. Run \`node build.mjs\` and commit.`);
    process.exit(1);
  }
  console.log(`✓ all ${TARGETS.length} platform files are in sync with ${'shared/thakol-auth-agent.md'}`);
} else {
  console.log(
    stale.length
      ? `✓ regenerated ${stale.length} file(s) from shared/thakol-auth-agent.md`
      : `✓ already up to date (${TARGETS.length} files)`,
  );
}
