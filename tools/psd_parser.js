#!/usr/bin/env node
/**
 * PSD 전체 파싱 스크립트 (ag-psd 기반)
 * 사용법: node psd_parser.js <psd파일경로> [출력json경로]
 * 예: node psd_parser.js 코끼리카페.psd ec_psd_full.json
 */

const fs = require('fs');
const path = require('path');
const { readPsd } = require('ag-psd');

const inputPath = process.argv[2];
if (!inputPath) {
    console.error('사용법: node psd_parser.js <psd파일경로> [출력json경로]');
    process.exit(1);
}
const outputPath = process.argv[3] || inputPath.replace(/\.psd$/i, '_parsed.json');

console.log(`PSD 파싱 시작: ${inputPath}`);
const buffer = fs.readFileSync(inputPath);
const psd = readPsd(buffer, {
    skipLayerImageData: true,
    skipCompositeImageData: true,
    skipThumbnail: true
});

// ─── 유틸리티 ───
function rgbToHex(r, g, b) {
    const toHex = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseFillColor(vectorFill) {
    if (!vectorFill) return null;
    if (vectorFill.type === 'color' && vectorFill.color) {
        const c = vectorFill.color;
        return { type: 'color', hex: rgbToHex(c.r, c.g, c.b), r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) };
    }
    if (vectorFill.type === 'gradient') {
        return {
            type: 'gradient',
            gradientType: vectorFill.style,
            angle: vectorFill.angle,
            stops: (vectorFill.colorStops || []).map(s => ({
                position: s.location,
                color: s.color ? rgbToHex(s.color.r, s.color.g, s.color.b) : null,
                opacity: s.color ? s.color.a : 1
            }))
        };
    }
    if (vectorFill.type === 'pattern') {
        return { type: 'pattern', name: vectorFill.name || 'unknown' };
    }
    return { type: vectorFill.type || 'unknown', raw: JSON.stringify(vectorFill).substring(0, 200) };
}

function parseStroke(vectorStroke) {
    if (!vectorStroke) return null;
    const result = {
        enabled: vectorStroke.strokeEnabled || false,
        width: null,
        color: null
    };
    if (vectorStroke.lineWidth) {
        result.width = vectorStroke.lineWidth.value || vectorStroke.lineWidth;
    }
    if (vectorStroke.content && vectorStroke.content.color) {
        const c = vectorStroke.content.color;
        result.color = rgbToHex(c.r, c.g, c.b);
    }
    return result;
}

function parseBorderRadius(vectorOrigination) {
    if (!vectorOrigination) return null;
    const list = vectorOrigination.keyDescriptorList || vectorOrigination;
    if (!Array.isArray(list)) return null;
    for (const item of list) {
        if (item.keyOriginRRectRadii) {
            const r = item.keyOriginRRectRadii;
            const tl = r.topLeft?.value ?? r.topLeft ?? 0;
            const tr = r.topRight?.value ?? r.topRight ?? 0;
            const bl = r.bottomLeft?.value ?? r.bottomLeft ?? 0;
            const br = r.bottomRight?.value ?? r.bottomRight ?? 0;
            if (tl === tr && tr === bl && bl === br) {
                return { all: tl };
            }
            return { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br };
        }
    }
    return null;
}

function parseTransform(transform) {
    if (!transform || !Array.isArray(transform)) return null;
    // transform = [xx, xy, yx, yy, tx, ty]
    const xx = transform[0], xy = transform[1];
    const yx = transform[2], yy = transform[3];
    const tx = transform[4], ty = transform[5];
    const scaleX = Math.sqrt(xx * xx + xy * xy);
    const scaleY = Math.sqrt(yx * yx + yy * yy);
    return { scaleX, scaleY, tx, ty, raw: transform };
}

function parseTextData(textLayer) {
    if (!textLayer || !textLayer.text) return null;
    const t = textLayer.text;
    const result = {
        content: t.text || '',
        transform: null,
        style: null,
        styleRuns: []
    };

    // transform → 실제 fontSize 계산용
    if (t.transform) {
        result.transform = parseTransform(t.transform);
    }

    // 텍스트 정렬
    if (t.paragraphStyle) {
        result.textAlign = t.paragraphStyle.justification || 'left'; // left, center, right, justifyAll
    }

    // 기본 스타일
    if (t.style) {
        const s = t.style;
        const rawFontSize = s.fontSize || 0;
        const scale = result.transform ? result.transform.scaleX : 1;
        const actualFontSize = rawFontSize * scale;
        const actualFontSizeVw = actualFontSize / 1920 * 100;

        result.style = {
            fontFamily: s.font?.name || null,
            fontScript: s.font?.script || null,
            fontSynthetic: s.font?.synthetic || 0,
            fontSizeRaw: rawFontSize,
            fontSizeActualPx: Math.round(actualFontSize * 100) / 100,
            fontSizeVw: Math.round(actualFontSizeVw * 10000) / 10000,
            color: s.fillColor ? rgbToHex(s.fillColor.r, s.fillColor.g, s.fillColor.b) : null,
            colorRgb: s.fillColor ? { r: Math.round(s.fillColor.r), g: Math.round(s.fillColor.g), b: Math.round(s.fillColor.b) } : null,
            strokeColor: s.strokeColor ? rgbToHex(s.strokeColor.r, s.strokeColor.g, s.strokeColor.b) : null,
            tracking: s.tracking ?? null,
            letterSpacingEm: s.tracking ? s.tracking / 1000 : null,
            leading: s.leading ?? null,
            lineHeightPx: s.leading ? s.leading * scale : null,
            autoLeading: s.autoLeading ?? null,
            underline: s.underline ?? false,
            strikethrough: s.strikethrough ?? false,
            fontCaps: s.fontCaps ?? null, // 0=none, 1=allCaps, 2=smallCaps
            autoKerning: s.autoKerning ?? null,
            kerning: s.kerning ?? null,
            language: s.language ?? null,
            bold: (s.font?.name || '').match(/bold|Black|Heavy/i) ? true : false
        };
    }

    // 부분 스타일 (characterStyleOverrides 대응)
    if (t.styleRuns) {
        for (const run of t.styleRuns) {
            const s = run.style || {};
            const rawFontSize = s.fontSize || result.style?.fontSizeRaw || 0;
            const scale = result.transform ? result.transform.scaleX : 1;
            const actualFontSize = rawFontSize * scale;

            result.styleRuns.push({
                length: run.length || 0,
                fontFamily: s.font?.name || null,
                fontSizeRaw: rawFontSize,
                fontSizeActualPx: Math.round(actualFontSize * 100) / 100,
                color: s.fillColor ? rgbToHex(s.fillColor.r, s.fillColor.g, s.fillColor.b) : null,
                tracking: s.tracking ?? null,
                leading: s.leading ?? null,
                underline: s.underline ?? false,
                strikethrough: s.strikethrough ?? false,
                fontCaps: s.fontCaps ?? null,
                bold: (s.font?.name || '').match(/bold|Black|Heavy/i) ? true : false
            });
        }
    }

    return result;
}

function parseEffects(layer) {
    const effects = [];

    if (layer.effects) {
        const e = layer.effects;
        if (e.dropShadow && e.dropShadow.length) {
            for (const ds of e.dropShadow) {
                effects.push({
                    type: 'dropShadow',
                    enabled: ds.enabled !== false,
                    color: ds.color ? rgbToHex(ds.color.r, ds.color.g, ds.color.b) : null,
                    opacity: ds.opacity ?? 1,
                    angle: ds.angle ?? 0,
                    distance: ds.distance ?? 0,
                    spread: ds.spread ?? 0,
                    size: ds.size ?? 0
                });
            }
        }
        if (e.innerShadow && e.innerShadow.length) {
            for (const is of e.innerShadow) {
                effects.push({
                    type: 'innerShadow',
                    enabled: is.enabled !== false,
                    color: is.color ? rgbToHex(is.color.r, is.color.g, is.color.b) : null,
                    opacity: is.opacity ?? 1,
                    angle: is.angle ?? 0,
                    distance: is.distance ?? 0,
                    size: is.size ?? 0
                });
            }
        }
        if (e.outerGlow) {
            effects.push({
                type: 'outerGlow',
                enabled: e.outerGlow.enabled !== false,
                color: e.outerGlow.color ? rgbToHex(e.outerGlow.color.r, e.outerGlow.color.g, e.outerGlow.color.b) : null,
                opacity: e.outerGlow.opacity ?? 1,
                size: e.outerGlow.size ?? 0
            });
        }
        if (e.innerGlow) {
            effects.push({
                type: 'innerGlow',
                enabled: e.innerGlow.enabled !== false,
                color: e.innerGlow.color ? rgbToHex(e.innerGlow.color.r, e.innerGlow.color.g, e.innerGlow.color.b) : null,
                opacity: e.innerGlow.opacity ?? 1,
                size: e.innerGlow.size ?? 0
            });
        }
        if (e.bevelEmboss) {
            effects.push({
                type: 'bevelEmboss',
                enabled: e.bevelEmboss.enabled !== false,
                style: e.bevelEmboss.style,
                depth: e.bevelEmboss.depth,
                size: e.bevelEmboss.size
            });
        }
        if (e.satin) {
            effects.push({
                type: 'satin',
                enabled: e.satin.enabled !== false,
                color: e.satin.color ? rgbToHex(e.satin.color.r, e.satin.color.g, e.satin.color.b) : null,
                opacity: e.satin.opacity ?? 1
            });
        }
        if (e.stroke && e.stroke.length) {
            for (const st of e.stroke) {
                effects.push({
                    type: 'strokeEffect',
                    enabled: st.enabled !== false,
                    size: st.size ?? 0,
                    position: st.position,
                    color: st.color ? rgbToHex(st.color.r, st.color.g, st.color.b) : null,
                    opacity: st.opacity ?? 1
                });
            }
        }
        if (e.solidFill && e.solidFill.length) {
            for (const sf of e.solidFill) {
                effects.push({
                    type: 'colorOverlay',
                    enabled: sf.enabled !== false,
                    color: sf.color ? rgbToHex(sf.color.r, sf.color.g, sf.color.b) : null,
                    opacity: sf.opacity ?? 1,
                    blendMode: sf.blendMode
                });
            }
        }
        if (e.gradientOverlay && e.gradientOverlay.length) {
            for (const go of e.gradientOverlay) {
                effects.push({
                    type: 'gradientOverlay',
                    enabled: go.enabled !== false,
                    opacity: go.opacity ?? 1,
                    angle: go.angle,
                    blendMode: go.blendMode
                });
            }
        }
    }

    return effects.length > 0 ? effects : null;
}

function parseLayer(layer, depth = 0) {
    const node = {
        name: layer.name || '(unnamed)',
        kind: layer.children ? 'group' : (layer.text ? 'text' : 'layer'),
        visible: !layer.hidden,
        top: layer.top ?? 0,
        left: layer.left ?? 0,
        width: (layer.right ?? 0) - (layer.left ?? 0),
        height: (layer.bottom ?? 0) - (layer.top ?? 0),
        right: layer.right ?? 0,
        bottom: layer.bottom ?? 0,
        opacity: layer.opacity ?? 1,
        blendMode: layer.blendMode || 'normal',
        clipping: layer.clipping || false,
    };

    // fillOpacity (opacity와 별개 — 레이어 효과에만 적용)
    if (layer.fillOpacity !== undefined && layer.fillOpacity !== 1) {
        // ag-psd는 0~255 또는 0~1로 반환
        node.fillOpacity = layer.fillOpacity > 1 ? Math.round(layer.fillOpacity / 255 * 10000) / 10000 : layer.fillOpacity;
    }

    // 마스크 정보
    if (layer.mask) {
        node.mask = {
            top: layer.mask.top ?? 0,
            left: layer.mask.left ?? 0,
            right: layer.mask.right ?? 0,
            bottom: layer.mask.bottom ?? 0,
            width: (layer.mask.right ?? 0) - (layer.mask.left ?? 0),
            height: (layer.mask.bottom ?? 0) - (layer.mask.top ?? 0),
            defaultColor: layer.mask.defaultColor ?? 0,
            disabled: layer.mask.disabled ?? false
        };
    }

    // vw 변환 (1920px 캔버스 기준)
    node.topVw = Math.round(node.top / 1920 * 100 * 10000) / 10000;
    node.leftPercent = Math.round(node.left / 1920 * 100 * 10000) / 10000;
    node.widthPercent = Math.round(node.width / 1920 * 100 * 10000) / 10000;
    node.heightVw = Math.round(node.height / 1920 * 100 * 10000) / 10000;

    // fill
    node.fill = parseFillColor(layer.vectorFill);

    // stroke
    node.stroke = parseStroke(layer.vectorStroke);

    // border-radius
    node.borderRadius = parseBorderRadius(layer.vectorOrigination);

    // text 데이터
    node.text = parseTextData(layer);

    // 레이어 효과 (drop shadow, glow, bevel 등)
    node.effects = parseEffects(layer);

    // 벡터 마스크
    if (layer.vectorMask) {
        node.vectorMask = true;
    }

    // 스마트 오브젝트
    if (layer.placedLayer) {
        node.smartObject = {
            type: layer.placedLayer.type || 'unknown',
            transform: layer.placedLayer.transform || null
        };
    }

    // adjustment layer
    if (layer.adjustment) {
        node.adjustment = {
            type: Object.keys(layer.adjustment)[0] || 'unknown'
        };
    }

    // children (재귀)
    if (layer.children) {
        node.children = layer.children.map((child, idx) => {
            const parsed = parseLayer(child, depth + 1);
            parsed.zIndex = idx; // 레이어 순서 = z-index (0=맨뒤)
            return parsed;
        });
    }

    return node;
}

// ─── 메인 파싱 ───
const result = {
    _meta: {
        source: path.basename(inputPath),
        parsedAt: new Date().toISOString(),
        tool: 'ag-psd + psd_parser.js',
        canvasWidth: 1920,
        note: 'fontSize = fontSizeRaw × transform.scaleX. All vw/% values based on 1920px canvas.'
    },
    canvas: {
        width: psd.width,
        height: psd.height
    },
    layers: []
};

if (psd.children) {
    result.layers = psd.children.map((child, idx) => {
        const parsed = parseLayer(child);
        parsed.zIndex = idx;
        return parsed;
    });
}

// ─── 주의 항목 자동 감지 ───
const warnings = [];
function detectWarnings(nodes, parentName = '') {
    for (const n of nodes) {
        const path = parentName ? `${parentName} > ${n.name}` : n.name;
        if (!n.visible) { if (n.children) detectWarnings(n.children, path); continue; }

        // 부분 텍스트 스타일 (색상/폰트/크기 혼합)
        if (n.text && n.text.styleRuns && n.text.styleRuns.length > 1) {
            const colors = [...new Set(n.text.styleRuns.map(r => r.color))];
            const fonts = [...new Set(n.text.styleRuns.map(r => r.fontFamily))];
            const sizes = [...new Set(n.text.styleRuns.map(r => r.fontSizeActualPx))];
            if (colors.length > 1) warnings.push({ type: 'MULTI_COLOR', path, text: n.text.content.substring(0,30), colors });
            if (fonts.length > 1) warnings.push({ type: 'MULTI_FONT', path, text: n.text.content.substring(0,30), fonts });
            if (sizes.length > 1) warnings.push({ type: 'MULTI_SIZE', path, text: n.text.content.substring(0,30), sizes });
        }

        // fillOpacity ≠ 1 (opacity와 별도)
        if (n.fillOpacity && n.fillOpacity < 1) {
            warnings.push({ type: 'FILL_OPACITY', path, value: n.fillOpacity });
        }

        // 마스크 사용
        if (n.mask) {
            warnings.push({ type: 'MASK', path });
        }

        // 레이어 효과 (drop shadow 등)
        if (n.effects) {
            for (const e of n.effects) {
                if (e.enabled) warnings.push({ type: 'EFFECT_' + e.type.toUpperCase(), path, detail: e });
            }
        }

        // gradient fill
        if (n.fill && n.fill.type === 'gradient') {
            warnings.push({ type: 'GRADIENT', path });
        }

        // stroke 있음
        if (n.stroke && n.stroke.enabled) {
            warnings.push({ type: 'STROKE', path, color: n.stroke.color, width: n.stroke.width });
        }

        // border-radius 비대칭
        if (n.borderRadius && !n.borderRadius.all && n.borderRadius.topLeft !== undefined) {
            warnings.push({ type: 'ASYMMETRIC_RADIUS', path, radii: n.borderRadius });
        }

        if (n.children) detectWarnings(n.children, path);
    }
}
detectWarnings(result.layers);
result._warnings = warnings;

// 통계
let stats = { groups: 0, texts: 0, shapes: 0, smartObjects: 0, effects: 0, hidden: 0 };
function countStats(nodes) {
    for (const n of nodes) {
        if (!n.visible) stats.hidden++;
        if (n.kind === 'group') stats.groups++;
        else if (n.kind === 'text') stats.texts++;
        else stats.shapes++;
        if (n.smartObject) stats.smartObjects++;
        if (n.effects) stats.effects++;
        if (n.children) countStats(n.children);
    }
}
countStats(result.layers);
result._meta.stats = stats;

// 저장
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
console.log(`\n파싱 완료!`);
console.log(`출력: ${outputPath} (${sizeMB}MB)`);
console.log(`통계: 그룹=${stats.groups}, 텍스트=${stats.texts}, 도형/이미지=${stats.shapes}, 스마트오브젝트=${stats.smartObjects}, 효과=${stats.effects}, 숨김=${stats.hidden}`);
