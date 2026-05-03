#!/usr/bin/env node
/**
 * PSD-to-Spec 변환기
 * psd_parser.js가 출력한 parsed.json → 특정 섹션의 구조화된 spec.json
 *
 * 사용법: node psd-to-spec.js <parsed.json 경로> <섹션 레이어명> [출력 경로]
 * 예: node psd-to-spec.js 04_office_parsed.json "con03" spec_con03.json
 */

const fs = require('fs');
const path = require('path');

// ─── CLI 인자 ───
const inputPath = process.argv[2];
const sectionName = process.argv[3];
if (!inputPath || !sectionName) {
    console.error('사용법: node psd-to-spec.js <parsed.json 경로> <섹션 레이어명> [출력 경로]');
    process.exit(1);
}
const outputPath = process.argv[4] || `spec_${sectionName}.json`;

// ─── 파일 읽기 ───
if (!fs.existsSync(inputPath)) {
    console.error(`파일을 찾을 수 없습니다: ${inputPath}`);
    process.exit(1);
}
const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// ─── 캔버스 자동 감지 (CLAUDE.md → PSD 문서폭 → 1905 fallback) ───
function detectCanvas() {
    // 1) CLAUDE.md에서 캔버스 크기 읽기
    let dir = path.dirname(path.resolve(inputPath));
    for (let i = 0; i < 10; i++) {
        const claudePath = path.join(dir, 'CLAUDE.md');
        if (fs.existsSync(claudePath)) {
            const md = fs.readFileSync(claudePath, 'utf-8');
            const m = md.match(/캔버스\s*(?:크기)?[*:\s]*(\d{3,5})/);
            if (m) return parseInt(m[1], 10);
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    // 2) parsed.json 문서 width
    const docW = parsed.width && typeof parsed.width === 'object' ? parsed.width.width : parsed.width;
    if (docW && docW > 100) return docW;
    // 3) fallback
    return 1905;
}
const canvasWidth = detectCanvas();

// ─── fontWeight 매핑 ───
// 순서 중요: 긴 키워드 → 짧은 키워드 (ExtraBold가 Bold보다 먼저 매칭되어야 800 반환)
const WEIGHT_MAP = [
    ['Thin', 100],
    ['ExtraLight', 200],
    ['UltraLight', 200],
    ['Light', 300],
    ['Regular', 400],
    ['Medium', 500],
    ['SemiBold', 600],
    ['DemiBold', 600],
    ['ExtraBold', 800],
    ['UltraBold', 800],
    ['Black', 900],
    ['Heavy', 900],
    ['Bold', 700],
    ['-Bd', 700],   // YPairingFontOTF-Bd 등
    ['-Bld', 700],
    ['-bBd', 700],  // SDHeirofLight-bBd
];

function fontFamilyToWeight(fontFamily, isBold) {
    if (!fontFamily) return isBold ? 700 : 400;
    for (const [suffix, weight] of WEIGHT_MAP) {
        if (fontFamily.includes(suffix)) return weight;
    }
    return isBold ? 700 : 400;
}

// ─── 코멘트 색상 ───
const COMMENT_COLORS = ['#00baff', '#00ff06', '#f0ff00'];
function isCommentColor(hex) {
    if (!hex) return false;
    return COMMENT_COLORS.includes(hex.toLowerCase());
}

// ─── 이미지 판단 ───
const IMAGE_NAME_PATTERNS = [/^DSC/i, /^레이어/i, /^Layer\s/i, /^IMG/i, /^image/i, /^사진/i, /^photo/i];
function isImageLayer(node) {
    if (node.smartObject) return true;
    for (const pat of IMAGE_NAME_PATTERNS) {
        if (pat.test(node.name)) return true;
    }
    return false;
}

// ─── effects 추출 (dropShadow, innerShadow 등) ───
function extractEffects(node) {
    if (!node.effects || !Array.isArray(node.effects)) return null;
    const enabled = node.effects.filter(e => e.enabled);
    if (enabled.length === 0) return null;

    return enabled.map(e => {
        const result = { type: e.type };

        if (e.type === 'dropShadow' || e.type === 'innerShadow') {
            const angle = e.angle || 120;
            const dist = (e.distance && e.distance.value) || 0;
            const blur = (e.size && e.size.value) || 0;
            const spreadPct = e.spread || 0;
            const cssSpread = Math.round(blur * spreadPct / 100);
            const color = e.color || '#000000';
            const opacity = e.opacity ?? 0.5;

            // PSD angle → CSS offset (angle = light direction, shadow = opposite)
            const rad = angle * Math.PI / 180;
            const offsetX = Math.round(-dist * Math.cos(rad) * 100) / 100;
            const offsetY = Math.round(dist * Math.sin(rad) * 100) / 100;

            result.offsetX_px = offsetX;
            result.offsetY_px = offsetY;
            result.blur_px = blur;
            result.spread_px = cssSpread;
            result.color = color;
            result.opacity = opacity;
            result.inset = e.type === 'innerShadow';

            // vw 변환
            result.offsetX_vw = (Math.round(offsetX / canvasWidth * 100 * 10000) / 10000).toFixed(4);
            result.offsetY_vw = (Math.round(offsetY / canvasWidth * 100 * 10000) / 10000).toFixed(4);
            result.blur_vw = (Math.round(blur / canvasWidth * 100 * 10000) / 10000).toFixed(4);
            result.spread_vw = (Math.round(cssSpread / canvasWidth * 100 * 10000) / 10000).toFixed(4);

            // CSS 문자열 생성
            const insetStr = result.inset ? 'inset ' : '';
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            result.css = `${insetStr}${result.offsetX_vw}vw ${result.offsetY_vw}vw ${result.blur_vw}vw ${result.spread_vw}vw rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        if (e.type === 'outerGlow' || e.type === 'innerGlow') {
            result.color = e.color || '#ffffff';
            result.opacity = e.opacity ?? 0.35;
            result.blur_px = (e.size && e.size.value) || 0;
            result.blur_vw = (Math.round(result.blur_px / canvasWidth * 100 * 10000) / 10000).toFixed(4);
        }

        if (e.type === 'strokeEffect') {
            result.size_px = (e.size && e.size.value) || 1;
            result.position = e.position || 'outside';
            result.color = e.color || '#000000';
            result.opacity = e.opacity ?? 1;
        }

        if (e.type === 'colorOverlay') {
            result.color = e.color || '#000000';
            result.opacity = e.opacity ?? 1;
            result.blendMode = e.blendMode || 'normal';
        }

        return result;
    });
}

// ─── letterSpacing 보정 ───
function resolveLetterSpacing(style) {
    if (!style) return '0em';
    if (style.letterSpacingEm != null) return `${style.letterSpacingEm}em`;
    if (style.tracking != null) return `${style.tracking / 1000}em`;
    return '0em';
}

// ─── letterSpacing from styleRun ───
function resolveLetterSpacingRun(run, parentStyle) {
    if (run.tracking != null) return `${run.tracking / 1000}em`;
    if (parentStyle) return resolveLetterSpacing(parentStyle);
    return '0em';
}

// ─── 네이밍 정규화 (con06/con6/6/06 → 동일 취급) ───
function normSec(n) {
    // 이름 전체 소문자 + 숫자의 선행 0만 제거 (bcon03 → bcon3, b3_title은 그대로)
    return String(n).toLowerCase().replace(/0*(\d+)/g, (_, d) => String(Number(d)));
}

// ─── 섹션 찾기 ───
function findSection(layers, name) {
    const nameNorm = normSec(name);
    // 정규화된 숫자 비교 (con06 === con6 === 6)
    for (const layer of layers) {
        if (layer.name && normSec(layer.name) === nameNorm) return layer;
    }
    // 부분 매칭 시도 (fallback)
    const lower = name.toLowerCase();
    for (const layer of layers) {
        if (layer.name && layer.name.toLowerCase().includes(lower)) return layer;
    }
    return null;
}

const section = findSection(parsed.layers || [], sectionName);
if (!section) {
    console.error(`섹션 "${sectionName}"을 찾을 수 없습니다.`);
    console.error('사용 가능한 최상위 레이어:');
    (parsed.layers || []).forEach(l => console.error(`  - "${l.name}" (${l.kind}, visible: ${l.visible})`));
    process.exit(1);
}

// ─── 결과 컨테이너 ───
const spec = {
    section: sectionName,
    canvas: canvasWidth,
    sectionY: {
        top: section.top || 0,
        bottom: section.bottom || 0
    },
    background: null,
    groups: [],
    texts: [],
    rects: [],
    images: [],
    comments: []
};

// ─── 배경 추정 ───
function detectBackground(sectionNode) {
    const children = sectionNode.children || sectionNode.layers || [];
    // 섹션 자체에 fill이 있으면
    if (sectionNode.fill) {
        if (sectionNode.fill.type === 'color') {
            return { type: 'color', fill: sectionNode.fill.hex, src: null };
        }
        if (sectionNode.fill.type === 'gradient') {
            return { type: 'gradient', fill: sectionNode.fill, src: null };
        }
    }
    // 첫 번째 자식(가장 뒤) 중 섹션과 비슷한 크기의 rect 찾기
    for (const child of children) {
        if (child.hidden || child.visible === false) continue;
        if (child.kind === 'group' || child.text) continue;
        const cw = child.width || 0;
        const ch = child.height || 0;
        const sw = sectionNode.width || canvasWidth;
        const sh = sectionNode.height || 0;
        if (cw >= sw * 0.8 && ch >= sh * 0.8) {
            if (child.fill && child.fill.type === 'color') {
                return { type: 'color', fill: child.fill.hex, src: null };
            }
            if (child.fill && child.fill.type === 'gradient') {
                return { type: 'gradient', fill: child.fill, src: null };
            }
            if (isImageLayer(child)) {
                return { type: 'image', fill: null, src: child.name };
            }
        }
    }
    return { type: 'color', fill: '#ffffff', src: null };
}
spec.background = detectBackground(section);

// ─── 배경 rect 치수 별도 저장 (pt/pb 계산용) ───
// 조건: 사각형 형태 + solid color fill + 전폭 + sectionY 범위 내
{
    const secY = spec.sectionY;
    const secH = secY.bottom - secY.top;
    const candidates = [];
    const findBgRects = (layers) => {
        for (const child of (layers || [])) {
            if (child.hidden || child.visible === false) continue;
            if (child.text || child.kind === 'group') continue;
            const cw = child.width || 0;
            const ch = child.height || 0;
            const cn = (child.name || '').toLowerCase();
            // 1) 전폭 + 높이 100+
            if (cw < canvasWidth * 0.9 || ch < 100) { if (child.children) findBgRects(child.children); continue; }
            // 2) 비배경 제외: 타원, 그레이디언트, 이미지 레이어
            if (/타원|원형|ellipse|circle/i.test(cn)) continue;
            if (/그레이디언트|gradient/i.test(cn)) continue;
            if (/^(dsc|img|photo|레이어\s*\d)/i.test(cn)) continue;
            // 3) fill이 gradient이면 제외
            if (child.fill && child.fill.type === 'gradient') continue;
            // 4) 높이가 섹션의 2.5배 초과 → 페이지 전체 배경
            if (secH > 200 && ch > secH * 2.5) continue;
            // 5) sectionY 범위와 30%+ 겹침
            const cy = child.top || 0;
            const overlap = Math.max(0, Math.min(cy + ch, secY.bottom) - Math.max(cy, secY.top));
            if (secH > 200 && overlap < secH * 0.3) continue;
            candidates.push({ y: cy, h: ch, bottom: cy + ch, name: child.name, overlap });
            if (child.children) findBgRects(child.children);
        }
    };
    findBgRects(section.children || section.layers || []);
    // 겹침 비율 높은 순 → 같으면 면적 큰 순
    candidates.sort((a, b) => b.overlap - a.overlap || (b.h - a.h));
    if (candidates.length > 0) {
        const best = candidates[0];
        spec.bgRect = { y: best.y, h: best.h, bottom: best.bottom, name: best.name };
    }
}

// ─── 이미지 파일 스캔 (possibleFile 크기 매칭용) ───
let imageCounter = 0;
const imageFiles = [];
// images/ 하위 폴더에서 섹션명으로 시작하는 파일 탐색
const projectRoot = path.resolve(path.dirname(inputPath), '..');
const imagesDir = path.join(projectRoot, 'images');
if (fs.existsSync(imagesDir)) {
    // 루트 + 서브디렉토리(1단계만) 스캔
    const scanDir = (dir, depth) => {
        if (depth > 1) return; // symlink 순환 방지
        let entries;
        try { entries = fs.readdirSync(dir); } catch { return; }
        entries.forEach(f => {
            const fullPath = path.join(dir, f);
            let stat;
            try { stat = fs.statSync(fullPath); } catch { return; }
            if (stat.isDirectory()) { scanDir(fullPath, depth + 1); return; }
            // con06_1.png / con6_1.png 둘 다 매칭
            const fNorm = normSec(f.split('_')[0] || '');
            const secNorm = normSec(sectionName);
            if (fNorm !== secNorm || !f.includes('_')) return;
            if (!/\.(png|jpg|jpeg)$/i.test(f)) return;
            try {
                const buf = fs.readFileSync(fullPath);
                let fw = 0, fh = 0;
                if (buf[0] === 0x89 && buf[1] === 0x50) { fw = buf.readUInt32BE(16); fh = buf.readUInt32BE(20); }
                else if (buf[0] === 0xFF && buf[1] === 0xD8) {
                    let ji = 2;
                    while (ji < buf.length - 8) {
                        if (buf[ji] !== 0xFF) { ji++; continue; }
                        const m = buf[ji+1];
                        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
                            fh = buf.readUInt16BE(ji+5); fw = buf.readUInt16BE(ji+7); break;
                        }
                        ji += 2 + buf.readUInt16BE(ji+2);
                    }
                }
                if (fw > 0) imageFiles.push({ file: f, width: fw, height: fh, matched: false });
            } catch(e) {}
        });
    };
    scanDir(imagesDir, 0);
}

function matchPossibleFile(psdW, psdH, clipW, clipH, layerName) {
    if (imageFiles.length === 0) { imageCounter++; return `${sectionName}_${imageCounter}.png`; }

    // 1) 이름 기반 직접 매칭 (PSD 레이어명 = 파일명)
    if (layerName) {
        const nameMatch = imageFiles.find(f => !f.matched && f.file.replace(/\.(png|jpg|jpeg)$/i, '') === layerName);
        if (nameMatch) { nameMatch.matched = true; return nameMatch.file; }
        // 부분 매칭: 파일명이 레이어명으로 시작
        const partMatch = imageFiles.find(f => !f.matched && f.file.replace(/\.(png|jpg|jpeg)$/i, '').startsWith(layerName));
        if (partMatch) { partMatch.matched = true; return partMatch.file; }
    }

    // 2) 크기 기반 매칭 — w,h 각각 ±20% 이내 + aspect ratio 유사
    const targets = [];
    if (clipW > 0 && clipH > 0) targets.push({ w: clipW, h: clipH });
    targets.push({ w: psdW, h: psdH });

    for (const t of targets) {
        const tAR = t.w / Math.max(t.h, 1);
        const exact = imageFiles.find(f => {
            if (f.matched) return false;
            const wOk = Math.abs(f.width - t.w) <= t.w * 0.2;
            const hOk = Math.abs(f.height - t.h) <= t.h * 0.2;
            const fAR = f.width / Math.max(f.height, 1);
            const arOk = Math.abs(fAR - tAR) < 0.3;
            return wOk && hOk && arOk;
        });
        if (exact) { exact.matched = true; return exact.file; }
    }
    // 매칭 실패 → TODO (근사 매칭 하지 않음 — AI 추론에 위임)
    return 'TODO';
}

// ─── 재귀 탐색 ───
function processNode(node, parentGroup) {
    // hidden 제외
    if (node.visible === false) return;

    const children = node.children || node.layers || [];

    // 코멘트 판별: fill 색상이 코멘트 색인 rect
    if (node.kind !== 'group' && !node.text && node.fill && isCommentColor(node.fill.hex)) {
        // 코멘트 rect — 자식 텍스트도 코멘트로
        const commentText = collectCommentTexts(children);
        spec.comments.push({
            text: commentText || node.name,
            x: node.left,
            y: node.top
        });
        return; // texts/rects에서 제외
    }

    // 그룹 내 코멘트 색 rect 확인 (그룹 자체가 코멘트인 경우)
    if (node.kind === 'group') {
        // 그룹 전체가 코멘트인지 확인 (자식에 코멘트 색 rect가 있고, 나머지는 텍스트뿐)
        const commentRect = children.find(c => c.visible !== false && c.fill && isCommentColor(c.fill.hex) && !c.text && c.kind !== 'group');
        if (commentRect) {
            const textParts = children.filter(c => c.visible !== false && c.text);
            const otherRects = children.filter(c => c.visible !== false && !c.text && c.kind !== 'group' && c !== commentRect && !isCommentColor(c.fill?.hex));
            // 코멘트 rect + 텍스트만 있으면 그룹 전체를 코멘트로
            if (otherRects.length === 0 && textParts.length > 0) {
                const commentContent = textParts.map(t => t.text?.content || t.name).join(' ');
                spec.comments.push({
                    text: commentContent,
                    x: commentRect.left,
                    y: commentRect.top
                });
                return;
            }
        }
        // 일반 그룹 → 그룹 트리에 추가 + 자식 재귀
        var groupChildren = [];
        children.forEach(function(c) {
            if (c.visible === false) return;
            var childInfo = { name: c.name, type: c.kind || (c.text ? 'text' : 'layer') };
            if (c.top !== undefined) { childInfo.x = c.left; childInfo.y = c.top; childInfo.w = (c.right||0)-(c.left||0); childInfo.h = (c.bottom||0)-(c.top||0); }
            groupChildren.push(childInfo);
        });
        if (groupChildren.length > 0) {
            // bbox 계산: children 좌표 범위 (재귀 — children이 (0,0,0,0)이면 후손까지 탐색)
            var bboxLeft = Infinity, bboxTop = Infinity, bboxRight = -Infinity, bboxBottom = -Infinity;
            function expandBbox(layers) {
                if (!layers) return;
                layers.forEach(function(c) {
                    var cx = c.left !== undefined ? c.left : (c.x !== undefined ? c.x : undefined);
                    var cy = c.top !== undefined ? c.top : (c.y !== undefined ? c.y : undefined);
                    var cw = c.width || c.w || ((c.right||0) - (c.left||0)) || 0;
                    var ch = c.height || c.h || ((c.bottom||0) - (c.top||0)) || 0;
                    if (cx !== undefined && cw > 0 && cx > 0) {
                        if (cx < bboxLeft) bboxLeft = cx;
                        if (cy < bboxTop) bboxTop = cy;
                        if (cx + cw > bboxRight) bboxRight = cx + cw;
                        if (cy + ch > bboxBottom) bboxBottom = cy + ch;
                    }
                    // 재귀: 자식의 자식까지
                    if (c.children || c.layers) expandBbox(c.children || c.layers);
                });
            }
            // PSD raw children에서 재귀 bbox 계산
            expandBbox(children);
            var bbox = (bboxLeft < Infinity) ? { x: bboxLeft, y: bboxTop, w: bboxRight - bboxLeft, h: bboxBottom - bboxTop } : null;

            spec.groups.push({
                name: node.name,
                parentGroup: parentGroup ? parentGroup.name : null,
                childCount: groupChildren.length,
                children: groupChildren,
                bbox: bbox,
                x: node.left || 0,
                y: node.top || 0,
                w: (node.right||0) - (node.left||0),
                h: (node.bottom||0) - (node.top||0)
            });
        }
        for (const child of children) {
            processNode(child, node);
        }
        return;
    }

    // 텍스트 레이어
    if (node.text && node.text.content) {
        processTextNode(node);
        return;
    }

    // 이미지 레이어
    if (isImageLayer(node)) {
        const img = {
            name: node.name,
            x: node.left,
            y: node.top,
            w: node.width,
            h: node.height,
            clippingRect: null,
            possibleFile: null, // 클리핑 확정 후 매칭
            effects: extractEffects(node)
        };
        // 클리핑 rect 찾기: 같은 그룹 내에서 이미지보다 작은 rect (clipping 마스크)
        if (parentGroup) {
            const siblings = parentGroup.children || parentGroup.layers || [];
            for (const sib of siblings) {
                if (sib === node || sib.visible === false) continue;
                if (sib.text || sib.kind === 'group' || isImageLayer(sib)) continue;
                if (sib.clipping || (sib.width <= node.width && sib.height <= node.height)) {
                    const br = sib.borderRadius;
                    img.clippingRect = {
                        x: sib.left,
                        y: sib.top,
                        w: sib.width,
                        h: sib.height,
                        borderRadius: br ? (br.all ?? br) : 0
                    };
                    break;
                }
            }
        }
        // possibleFile 크기 매칭
        const clipW = img.clippingRect ? img.clippingRect.w : 0;
        const clipH = img.clippingRect ? img.clippingRect.h : 0;
        img.possibleFile = matchPossibleFile(node.width, node.height, clipW, clipH, node.name);
        spec.images.push(img);
        return;
    }

    // 일반 rect/shape 레이어
    if (node.kind === 'layer' || (!node.text && !node.children)) {
        const br = node.borderRadius;
        spec.rects.push({
            name: node.name,
            x: node.left,
            y: node.top,
            w: node.width,
            h: node.height,
            fill: node.fill ? (node.fill.hex || node.fill) : (node.fillColor || null),
            borderRadius: br ? (br.all ?? br) : 0,
            stroke: node.stroke && node.stroke.enabled ? {
                width: node.stroke.width,
                color: node.stroke.color
            } : null,
            opacity: node.opacity ?? 1,
            effects: extractEffects(node)
        });
    }
}

// ─── 코멘트 텍스트 수집 ───
function collectCommentTexts(children) {
    const texts = [];
    for (const c of (children || [])) {
        if (c.text && c.text.content) texts.push(c.text.content);
        if (c.children || c.layers) {
            const sub = collectCommentTexts(c.children || c.layers);
            if (sub) texts.push(sub);
        }
    }
    return texts.join(' ').trim() || null;
}

// ─── 텍스트 노드 처리 ───
function processTextNode(node) {
    const txt = node.text;
    const content = txt.content || '';
    const lineBreaks = (content.match(/\n/g) || []).length;
    const lines = lineBreaks + 1;
    const parentStyle = txt.style || {};

    // segments 생성
    const segments = [];

    if (txt.styleRuns && txt.styleRuns.length > 0) {
        // styleRuns가 있으면 각 run을 segment로
        let offset = 0;
        for (const run of txt.styleRuns) {
            const segText = content.substring(offset, offset + run.length);
            offset += run.length;

            // 빈 텍스트(마지막 개행 등) 건너뛰기
            if (!segText.trim() && segText === '\n') continue;

            const fontFamily = run.fontFamily || parentStyle.fontFamily || null;
            const fontSize = run.fontSizeActualPx || parentStyle.fontSizeActualPx || 0;
            const fontWeight = fontFamilyToWeight(fontFamily, run.bold);

            // color 보정: null이면 부모 상속
            let color = run.color;
            if (!color) color = parentStyle.color;
            if (!color) color = '#000000';

            // lineHeight 계산
            let lineHeight, lineHeightSource;
            const runLeading = run.leading;
            const parentAutoLeading = parentStyle.autoLeading;

            if (parentAutoLeading === false && parentStyle.lineHeightPx) {
                lineHeight = Math.round((parentStyle.lineHeightPx / fontSize) * 1000) / 1000;
                lineHeightSource = 'fixed (lineHeightPx÷fontSize)';
            } else {
                // auto leading
                if (lines > 1) {
                    lineHeight = Math.round((node.height / lines / fontSize) * 1000) / 1000;
                    lineHeightSource = 'auto (h÷lines÷fontSize)';
                } else {
                    lineHeight = Math.round((node.height / fontSize) * 1000) / 1000;
                    lineHeightSource = 'auto (h÷lines÷fontSize)';
                }
            }

            segments.push({
                text: segText,
                fontSize_px: Math.round(fontSize * 100) / 100,
                fontSize_vw: (Math.round((fontSize / canvasWidth * 100) * 10000) / 10000).toFixed(4),
                fontWeight,
                fontFamily: fontFamily || 'Pretendard-Regular',
                color,
                lineHeight,
                lineHeight_source: lineHeightSource,
                letterSpacing: resolveLetterSpacingRun(run, parentStyle)
            });
        }

        // mixed fontSize 체크 — styleRuns에서 fontSize가 다르면 lineHeight를 "mixed"로
        const uniqueSizes = [...new Set(txt.styleRuns.map(r => r.fontSizeActualPx).filter(Boolean))];
        if (uniqueSizes.length > 1 && parentStyle.autoLeading !== false) {
            for (const seg of segments) {
                seg.lineHeight = 'mixed';
                seg.lineHeight_source = 'mixed (다른 fontSize 혼합, 원본 h=' + node.height + ')';
            }
        }
    } else {
        // styleRuns 없음 → 단일 segment
        const fontFamily = parentStyle.fontFamily || null;
        const fontSize = parentStyle.fontSizeActualPx || 0;
        const fontWeight = fontFamilyToWeight(fontFamily, parentStyle.bold);
        const color = parentStyle.color || '#000000';

        let lineHeight, lineHeightSource;
        if (parentStyle.autoLeading === false && parentStyle.lineHeightPx) {
            lineHeight = Math.round((parentStyle.lineHeightPx / fontSize) * 1000) / 1000;
            lineHeightSource = 'fixed (lineHeightPx÷fontSize)';
        } else {
            if (lines > 1) {
                lineHeight = Math.round((node.height / lines / fontSize) * 1000) / 1000;
            } else {
                lineHeight = Math.round((node.height / fontSize) * 1000) / 1000;
            }
            lineHeightSource = 'auto (h÷lines÷fontSize)';
        }

        segments.push({
            text: content,
            fontSize_px: Math.round(fontSize * 100) / 100,
            fontSize_vw: (Math.round((fontSize / canvasWidth * 100) * 10000) / 10000).toFixed(4),
            fontWeight,
            fontFamily: fontFamily || 'Pretendard-Regular',
            color,
            lineHeight,
            lineHeight_source: lineHeightSource,
            letterSpacing: resolveLetterSpacing(parentStyle)
        });
    }

    const textEntry = {
        name: node.name,
        content,
        lineBreaks,
        x: node.left,
        y: node.top,
        w: node.width,
        h: node.height,
        segments
    };
    // 텍스트 레이어인데 이미지 파일명 패턴(conXX_)이면 possibleFile도 매칭
    if (normSec(node.name.split('_')[0] || '') === normSec(sectionName) && node.name.includes('_')) {
        const imgFile = matchPossibleFile(node.width, node.height, 0, 0, node.name);
        if (imgFile && !imgFile.endsWith('.png') === false) textEntry.possibleFile = imgFile;
    }
    spec.texts.push(textEntry);
}

// ─── 탐색 실행 ───
const sectionChildren = section.children || section.layers || [];
for (const child of sectionChildren) {
    processNode(child, section);
}

// ─── sectionY 보정: 자식 요소들의 실제 min/max y ───
// 캔버스 전체를 덮는 배경/그라데이션 레이어는 제외
function computeSectionY() {
    let minY = Infinity, maxY = -Infinity;
    const canvasH = parsed.height || 21922;
    const allItems = [...spec.texts, ...spec.rects, ...spec.images];
    for (const item of allItems) {
        const y = item.y || item.top || 0;
        const h = item.h || item.height || 0;
        // 좌표가 0이고 크기도 0인 빈 레이어 → 제외
        if (y === 0 && h === 0) continue;
        // 캔버스 80% 이상 차지하는 아이템 = 배경 → sectionY 계산에서 제외
        if (h > canvasH * 0.8) continue;
        // y=0이고 높이가 섹션보다 훨씬 큰 아이템 = 전체 배경 → 제외
        if (y === 0 && h > 2000) continue;
        if (y < minY) minY = y;
        if (y + h > maxY) maxY = y + h;
    }
    if (minY === Infinity) { minY = 0; maxY = 0; }
    return { top: minY, bottom: maxY };
}
spec.sectionY = computeSectionY();

// ─── segments 병합: 같은 스타일이면 합치기 ───
for (const txt of spec.texts) {
    if (!txt.segments || txt.segments.length <= 1) continue;
    const merged = [];
    for (const seg of txt.segments) {
        const prev = merged[merged.length - 1];
        if (prev &&
            prev.fontSize_px === seg.fontSize_px &&
            prev.fontWeight === seg.fontWeight &&
            prev.fontFamily === seg.fontFamily &&
            prev.color === seg.color &&
            prev.letterSpacing === seg.letterSpacing) {
            prev.text += seg.text;
        } else {
            merged.push({ ...seg });
        }
    }
    txt.segments = merged;
}

// ─── 저장 ───
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');

// ─── 요약 출력 ───
console.log(`psd-to-spec 변환 완료`);
console.log(`섹션: "${sectionName}" (y: ${spec.sectionY.top} ~ ${spec.sectionY.bottom})`);
console.log(`캔버스: ${canvasWidth}px`);
console.log(`배경: ${spec.background.type} ${spec.background.fill || spec.background.src || ''}`);
const effectCount = [...spec.rects, ...spec.images].filter(r => r.effects && r.effects.length > 0).length;
console.log(`그룹 ${spec.groups.length}개, 텍스트 ${spec.texts.length}개, rect ${spec.rects.length}개, 이미지 ${spec.images.length}개, 코멘트 ${spec.comments.length}개 (제외됨), effects ${effectCount}개`);
console.log(`출력: ${outputPath}`);
