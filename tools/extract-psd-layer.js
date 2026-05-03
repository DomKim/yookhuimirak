#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let readPsd;
try {
  require('ag-psd/initialize-canvas');
  ({ readPsd } = require('ag-psd'));
} catch (err) {
  console.error('PSD layer export 준비 실패: ' + err.message);
  console.error('힌트: `npm install canvas --no-save` 후 다시 실행하세요.');
  process.exit(1);
}

const [, , psdPathArg, layerPathArg, outPathArg] = process.argv;
if (!psdPathArg || !layerPathArg || !outPathArg) {
  console.error('사용법: node tools/extract-psd-layer.js <psd경로> <레이어경로> <출력png>');
  console.error('예시: node tools/extract-psd-layer.js psd/<PROJECT>_원본.psd "con09 > 레이어 33" images/con09_05.png');
  process.exit(1);
}

const psdPath = path.resolve(psdPathArg);
const outPath = path.resolve(outPathArg);
const targetPath = layerPathArg.split('>').map(function(part) { return part.trim(); }).filter(Boolean);

if (!fs.existsSync(psdPath)) {
  console.error('PSD 파일 없음: ' + psdPath);
  process.exit(1);
}

function findLayer(nodes, names, pathSoFar) {
  const currentPath = pathSoFar || [];
  const nextName = names[0];
  for (const node of nodes || []) {
    if (String(node.name || '') !== nextName) continue;
    if (names.length === 1) return node;
    const found = findLayer(node.children || [], names.slice(1), currentPath.concat(node.name));
    if (found) return found;
  }
  return null;
}

function collectLeafPaths(nodes, pathSoFar, out) {
  for (const node of nodes || []) {
    const next = (pathSoFar || []).concat(node.name || '(unnamed)');
    out.push(next.join(' > '));
    if (node.children) collectLeafPaths(node.children, next, out);
  }
}

console.log('PSD layer export 시작: ' + psdPath);
const psd = readPsd(fs.readFileSync(psdPath), {
  skipLayerImageData: false,
  skipCompositeImageData: true,
  skipThumbnail: true
});

const layer = findLayer(psd.children || [], targetPath, []);
if (!layer) {
  const candidates = [];
  collectLeafPaths(psd.children || [], [], candidates);
  const tail = targetPath[targetPath.length - 1];
  const hints = candidates.filter(function(item) {
    return item.includes(tail);
  }).slice(0, 10);
  console.error('레이어를 찾지 못했습니다: ' + targetPath.join(' > '));
  if (hints.length) {
    console.error('비슷한 경로:');
    hints.forEach(function(item) { console.error('  - ' + item); });
  }
  process.exit(1);
}

if (!layer.canvas || typeof layer.canvas.toBuffer !== 'function') {
  console.error('레이어 canvas 없음: ' + targetPath.join(' > '));
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, layer.canvas.toBuffer('image/png'));

console.log('✅ export 완료');
console.log('  layer: ' + targetPath.join(' > '));
console.log('  size: ' + layer.canvas.width + 'x' + layer.canvas.height);
console.log('  out:  ' + outPath);
