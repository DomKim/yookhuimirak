#!/usr/bin/env node
/**
 * section-finder.js — PSD 섹션 자동 탐지
 *
 * PSD 그룹명이 "conXX"가 아니어도, 이미지 파일명(conXX_*.png)과
 * PSD children Y좌표를 매칭하여 올바른 섹션 그룹을 찾아냄.
 *
 * Usage:
 *   node tools/section-finder.js <parsed.json> <섹션번호|이미지prefix>
 *   node tools/section-finder.js <parsed.json> --list
 *
 * Examples:
 *   node tools/section-finder.js psd/parsed.json con06
 *   node tools/section-finder.js psd/parsed.json 06
 *   node tools/section-finder.js psd/parsed.json --list    ← 전체 섹션 목록
 *
 * Output: 매칭된 PSD 그룹명 (psd-to-spec에 전달할 이름)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node section-finder.js <parsed.json> <섹션번호|--list>');
  process.exit(1);
}

const parsedPath = args[0];
const query = args[1];
const parsed = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

// ── Get min Y of all children recursively ──
function getMinY(layer) {
  let minY = Infinity;
  if (layer.top > 0) minY = Math.min(minY, layer.top);
  if (layer.children) {
    for (const child of layer.children) {
      minY = Math.min(minY, getMinY(child));
    }
  }
  return minY;
}

function getMaxY(layer) {
  let maxY = -Infinity;
  if (layer.top > 0 && layer.height > 0) maxY = Math.max(maxY, layer.top + layer.height);
  if (layer.children) {
    for (const child of layer.children) {
      maxY = Math.max(maxY, getMaxY(child));
    }
  }
  return maxY;
}

// ── Collect all top-level groups with Y ranges ──
const groups = [];
for (const l of (parsed.layers || [])) {
  if (l.kind === 'group') {
    const minY = getMinY(l);
    const maxY = getMaxY(l);
    if (minY < Infinity && maxY > -Infinity) {
      groups.push({ name: l.name, minY, maxY, childCount: (l.children || []).length });
    }
  }
}
groups.sort((a, b) => a.minY - b.minY);

// ── --list: show all sections ──
if (query === '--list') {
  console.log('PSD 섹션 목록 (Y순):');
  groups.forEach((g, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${g.name.padEnd(20)} Y: ${g.minY}~${g.maxY} (${g.childCount} children)`);
  });
  process.exit(0);
}

// ── Find section by name first ──
const sectionQuery = query.replace(/^con/, '').replace(/^0+/, '') || query;
const directMatch = groups.find(g => g.name === query || g.name === `con${query}` || g.name === `con${query.padStart(2, '0')}`);

if (directMatch) {
  console.log(directMatch.name);
  console.error(`✅ 이름 매칭: "${directMatch.name}" (Y: ${directMatch.minY}~${directMatch.maxY})`);
  process.exit(0);
}

// ── Fallback: match by image file names ──
// Look for images/*/conXX_*.png and find their Y coordinates in PSD
console.error(`⚠️ "${query}" 이름 매칭 실패 — 이미지 기반 탐색 시작...`);

const projectDir = path.dirname(path.resolve(parsedPath));
// Search for image files matching the section prefix
const conNum = query.replace(/\D/g, '');
const imgPrefix = `con${conNum.padStart(2, '0')}`;

// Find image files
let imageFiles = [];
const imgDirs = [
  path.join(projectDir, 'images'),
  path.join(projectDir, '..', 'images')
];

for (const imgDir of imgDirs) {
  if (!fs.existsSync(imgDir)) continue;
  // Search recursively
  const searchDir = (dir) => {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          searchDir(path.join(dir, entry.name));
        } else if (entry.name.startsWith(imgPrefix) && /\.(png|jpg|jpeg)$/i.test(entry.name)) {
          imageFiles.push(entry.name);
        }
      }
    } catch {}
  };
  searchDir(imgDir);
}

if (imageFiles.length === 0) {
  console.error(`❌ "${imgPrefix}_*" 이미지 파일 없음. PSD 그룹 목록:`);
  groups.forEach((g, i) => {
    console.error(`  ${i + 1}. ${g.name} (Y: ${g.minY}~${g.maxY})`);
  });
  console.error(`\n→ 정확한 그룹명을 지정하세요: node tools/psd-to-spec.js ${parsedPath} "<그룹명>"`);
  process.exit(1);
}

console.error(`📷 이미지 파일 ${imageFiles.length}개: ${imageFiles.slice(0, 5).join(', ')}${imageFiles.length > 5 ? '...' : ''}`);

// Find PSD layers matching these image file names
const imageYs = [];
function searchLayers(layers) {
  for (const l of layers) {
    if (l.kind !== 'group') {
      // Check if this layer's exported image matches
      const possibleNames = imageFiles.map(f => f.replace(/\.(png|jpg|jpeg)$/i, ''));
      if (possibleNames.some(n => l.name && l.name.includes(n)) ||
          (l.possibleFile && imageFiles.includes(l.possibleFile))) {
        if (l.top > 0) imageYs.push(l.top);
      }
    }
    if (l.children) searchLayers(l.children);
  }
}
searchLayers(parsed.layers || []);

if (imageYs.length === 0) {
  // Fallback: use index-based matching
  // "con06" → 6th content section (skip submain, header, footer)
  const contentGroups = groups.filter(g =>
    !['header', 'footer', '하단바', '서브메인', 'submain'].includes(g.name.toLowerCase())
  );
  const idx = parseInt(conNum, 10);
  if (idx > 0 && idx <= contentGroups.length) {
    const match = contentGroups[idx - 1];
    console.log(match.name);
    console.error(`✅ 인덱스 매칭: ${idx}번째 섹션 → "${match.name}" (Y: ${match.minY}~${match.maxY})`);
    process.exit(0);
  }

  console.error(`❌ 이미지 Y좌표 매칭 실패. PSD 그룹 목록:`);
  groups.forEach((g, i) => console.error(`  ${i + 1}. ${g.name} (Y: ${g.minY}~${g.maxY})`));
  process.exit(1);
}

// Find which group contains the most image Y coordinates
const avgY = imageYs.reduce((a, b) => a + b, 0) / imageYs.length;
console.error(`📍 이미지 Y좌표 평균: ${Math.round(avgY)} (${imageYs.length}개 매칭)`);

let bestGroup = null;
let bestScore = 0;
for (const g of groups) {
  const contained = imageYs.filter(y => y >= g.minY - 50 && y <= g.maxY + 50).length;
  if (contained > bestScore) {
    bestScore = contained;
    bestGroup = g;
  }
}

if (bestGroup && bestScore > 0) {
  console.log(bestGroup.name);
  console.error(`✅ 이미지 Y매칭: "${bestGroup.name}" (Y: ${bestGroup.minY}~${bestGroup.maxY}, ${bestScore}/${imageYs.length} 이미지 포함)`);
} else {
  // Final fallback: closest group to average Y
  let closest = null;
  let closestDist = Infinity;
  for (const g of groups) {
    const mid = (g.minY + g.maxY) / 2;
    const dist = Math.abs(mid - avgY);
    if (dist < closestDist) { closestDist = dist; closest = g; }
  }
  if (closest) {
    console.log(closest.name);
    console.error(`⚠️ 근접 매칭: "${closest.name}" (Y: ${closest.minY}~${closest.maxY}) — 검증 필요`);
  } else {
    console.error('❌ 매칭 실패');
    process.exit(1);
  }
}
