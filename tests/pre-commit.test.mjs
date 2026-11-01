import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const file = 'docs/zh/2026/11/article with spaces.md'
const body = '\nFirst paragraph.\n\nSecond paragraph.\n\nThird paragraph.\n\nFourth paragraph.\n'
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' })

function commit(cwd) {
  assert.equal(git(cwd, 'rev-parse', '--show-toplevel').trim(), realpathSync(cwd))
  return git(cwd, '-c', 'commit.gpgsign=false', 'commit', '-qm', 'test: fixture')
}

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'blog-pre-commit-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  git(cwd, 'init', '-q')
  git(cwd, 'config', 'user.name', 'Hook Test')
  git(cwd, 'config', 'user.email', 'hook-test@example.invalid')
  git(cwd, 'config', 'core.hooksPath', '.git/hooks')
  writeFileSync(join(cwd, 'package.json'), readFileSync(join(root, 'package.json')))
  writeFileSync(join(cwd, '.gitignore'), 'node_modules/\n')
  symlinkSync(join(root, 'node_modules'), join(cwd, 'node_modules'), 'dir')
  mkdirSync(join(cwd, 'docs/zh/2026/11'), { recursive: true })
  writeFileSync(join(cwd, file), `# Initial\n${body}`)
  git(cwd, 'add', '.')
  commit(cwd)
  const hook = join(cwd, '.git/hooks/pre-commit')
  writeFileSync(hook, '#!/bin/sh\nnode ./node_modules/yorkie/src/runner.js pre-commit\n')
  chmodSync(hook, 0o755)
  return cwd
}

test('pre-commit includes formatted Markdown in the commit', (t) => {
  const cwd = fixture(t)
  writeFileSync(join(cwd, file), `#  Ready\n${body}`)
  git(cwd, 'add', '--', file)
  commit(cwd)
  assert.equal(git(cwd, 'show', `HEAD:${file}`), `# Ready\n${body}`)
  assert.equal(git(cwd, 'status', '--porcelain'), '')
})

test('pre-commit leaves unstaged-only Markdown unchanged', (t) => {
  const cwd = fixture(t)
  const draft = '#  Private draft\n'
  writeFileSync(join(cwd, file), draft)
  writeFileSync(join(cwd, 'notes.txt'), 'Staged non-Markdown change\n')
  git(cwd, 'add', 'notes.txt')
  commit(cwd)
  assert.equal(readFileSync(join(cwd, file), 'utf8'), draft)
  assert.equal(git(cwd, 'show', `HEAD:${file}`), `# Initial\n${body}`)
})

test('pre-commit preserves unstaged edits in a partially staged file', (t) => {
  const cwd = fixture(t)
  writeFileSync(join(cwd, file), `#  Ready\n${body}`)
  git(cwd, 'add', '--', file)
  writeFileSync(join(cwd, file), `#  Ready\n${body}\nPrivate draft.\n`)
  commit(cwd)
  assert.equal(git(cwd, 'show', `HEAD:${file}`), `# Ready\n${body}`)
  assert.equal(readFileSync(join(cwd, file), 'utf8'), `# Ready\n${body}\nPrivate draft.\n`)
  assert.match(git(cwd, 'diff', '--', file), /\+Private draft\./)
})

test('pre-commit rejects formatting errors without losing staged or unstaged edits', (t) => {
  const cwd = fixture(t)
  const staged = `#  Ready\n${body}`
  writeFileSync(join(cwd, '.prettierrc.json'), '{ invalid config')
  writeFileSync(join(cwd, file), staged)
  git(cwd, 'add', '--', file)
  writeFileSync(join(cwd, file), `${staged}\nPrivate draft.\n`)
  const head = git(cwd, 'rev-parse', 'HEAD')
  const index = git(cwd, 'diff', '--cached')
  const worktree = git(cwd, 'diff')
  assert.throws(() => commit(cwd), /Command failed/)
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), head)
  assert.equal(git(cwd, 'diff', '--cached'), index)
  assert.equal(git(cwd, 'diff'), worktree)
})
