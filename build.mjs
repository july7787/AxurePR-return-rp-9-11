// TypeScript 源文件（.mts / .ts）编译后回写为同名 .mjs / .js，保持运行时路径不变。
//
// 构建器本身不参与迁移：它必须在没有任何生成物时也能运行，因此保留为极小的手写 JS。
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const EMIT = join(ROOT, '.emit');
const OUTPUT = /\.(mjs|js)$/;

export function copyEmitted(from = EMIT, to = ROOT) {
  let count = 0;
  const walk = dir => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) walk(path);
      else if (item.isFile() && OUTPUT.test(item.name)) {
        const target = join(to, relative(from, path));
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(path, target);
        count += 1;
      }
    }
  };
  if (existsSync(from)) walk(from);
  return count;
}

export function build() {
  rmSync(EMIT, { recursive: true, force: true });
  const tsc = join(ROOT, 'node_modules/typescript/bin/tsc');
  if (!existsSync(tsc)) throw new Error('缺少 TypeScript 依赖：请先运行 npm install');
  const result = spawnSync(process.execPath, [tsc, '-p', join(ROOT, 'tsconfig.json')], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`TypeScript 编译失败（exit ${result.status}）`);
  const count = copyEmitted();
  if (!count) throw new Error('编译产物为空：检查 tsconfig include');
  console.log(`TypeScript build: ${count} files`);
  return count;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) build();
