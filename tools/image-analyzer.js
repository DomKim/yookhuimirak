#!/usr/bin/env node
/**
 * image-analyzer.js — 이미지 내용 자동 분석
 *
 * 사용법:
 *   node tools/image-analyzer.js <이미지경로>
 *   node tools/image-analyzer.js <이미지폴더> --prefix con06
 *
 * 분석 항목:
 *   1. 가장자리 투명도 → shadow/padding 영역 감지
 *   2. 가장자리 색상 → 흰 테두리/stroke 감지
 *   3. border-radius 감지 (모서리 투명 패턴)
 *   4. 내장 shadow 감지 (반투명 가장자리)
 *   5. 완성형/소스 추정 (테두리+radius+shadow 복합 판단)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

var args = process.argv.slice(2);
var target = args[0];
var prefix = '';
var outPath = '';
var prefixIdx = args.indexOf('--prefix');
if (prefixIdx >= 0 && args[prefixIdx + 1]) prefix = args[prefixIdx + 1];
var outIdx = args.indexOf('--out');
if (outIdx >= 0 && args[outIdx + 1]) outPath = args[outIdx + 1];

if (!target) {
  console.error('사용법: node tools/image-analyzer.js <이미지경로|폴더> [--prefix conXX]');
  process.exit(1);
}

async function analyzeImage(filePath) {
  var img = sharp(filePath);
  var meta = await img.metadata();
  var w = meta.width;
  var h = meta.height;
  var channels = meta.channels;
  var hasAlpha = meta.hasAlpha;

  var result = {
    file: path.basename(filePath),
    width: w,
    height: h,
    hasAlpha: hasAlpha,
    border: { detected: false, color: null, thickness: 0 },
    shadow: { detected: false, padding: 0 },
    radius: { detected: false, estimated: 0 },
    composite: false,
    sourceType: 'unknown',
    hints: {
      panelLike: false
    }
  };

  var raw = await img.raw().toBuffer();
  var pixelSize = channels;

  function getPixel(x, y) {
    var idx = (y * w + x) * pixelSize;
    return {
      r: raw[idx],
      g: raw[idx + 1],
      b: raw[idx + 2],
      a: hasAlpha ? raw[idx + 3] : 255
    };
  }

  // ── 1. 가장자리 투명도 분석 (상하좌우 5px) ──
  var edgeAlphas = { top: [], bottom: [], left: [], right: [] };
  var sampleCount = Math.min(w, 50);
  var step = Math.max(1, Math.floor(w / sampleCount));

  for (var x = 0; x < w; x += step) {
    for (var row = 0; row < Math.min(5, h); row++) {
      edgeAlphas.top.push(getPixel(x, row).a);
      edgeAlphas.bottom.push(getPixel(x, h - 1 - row).a);
    }
  }
  sampleCount = Math.min(h, 50);
  step = Math.max(1, Math.floor(h / sampleCount));
  for (var y = 0; y < h; y += step) {
    for (var col = 0; col < Math.min(5, w); col++) {
      edgeAlphas.left.push(getPixel(col, y).a);
      edgeAlphas.right.push(getPixel(w - 1 - col, y).a);
    }
  }

  var avgAlpha = {};
  ['top', 'bottom', 'left', 'right'].forEach(function(side) {
    var sum = 0;
    edgeAlphas[side].forEach(function(a) { sum += a; });
    avgAlpha[side] = sum / edgeAlphas[side].length;
  });

  // shadow 감지: 가장자리 반투명 (alpha 10~200)
  var semiTransCount = 0;
  var totalEdge = 0;
  ['top', 'bottom', 'left', 'right'].forEach(function(side) {
    edgeAlphas[side].forEach(function(a) {
      totalEdge++;
      if (a > 10 && a < 200) semiTransCount++;
    });
  });
  if (semiTransCount / totalEdge > 0.15) {
    result.shadow.detected = true;
    // padding 추정: 첫 불투명 픽셀까지 거리
    var padTop = 0;
    for (var py = 0; py < Math.min(h / 4, 30); py++) {
      var midX = Math.floor(w / 2);
      if (getPixel(midX, py).a < 200) padTop++;
      else break;
    }
    result.shadow.padding = padTop;
  }

  // ── 2. 가장자리 색상 분석 (stroke/border 감지) ──
  var edgeColors = [];
  // 상단 중앙 10px 샘플
  for (var ex = Math.floor(w * 0.3); ex < Math.floor(w * 0.7); ex += Math.max(1, Math.floor(w * 0.4 / 10))) {
    for (var ey = 0; ey < Math.min(3, h); ey++) {
      var p = getPixel(ex, ey);
      if (p.a > 200) edgeColors.push(p);
    }
  }
  // 좌측 중앙 샘플
  for (var ey2 = Math.floor(h * 0.3); ey2 < Math.floor(h * 0.7); ey2 += Math.max(1, Math.floor(h * 0.4 / 10))) {
    for (var ex2 = 0; ex2 < Math.min(3, w); ex2++) {
      var p2 = getPixel(ex2, ey2);
      if (p2.a > 200) edgeColors.push(p2);
    }
  }

  if (edgeColors.length > 0) {
    // 흰색 테두리 감지
    var whiteCount = 0;
    edgeColors.forEach(function(c) {
      if (c.r > 240 && c.g > 240 && c.b > 240) whiteCount++;
    });
    if (whiteCount / edgeColors.length > 0.6) {
      result.border.detected = true;
      result.border.color = '#ffffff';
      // thickness 추정
      var thickness = 0;
      var midY = Math.floor(h / 2);
      for (var tx = 0; tx < Math.min(w / 4, 20); tx++) {
        var tp = getPixel(tx, midY);
        if (tp.r > 240 && tp.g > 240 && tp.b > 240 && tp.a > 200) thickness++;
        else break;
      }
      result.border.thickness = thickness;
    }
    // 단색 테두리 감지 (흰색 아닌 경우)
    if (!result.border.detected) {
      var colorMap = {};
      edgeColors.forEach(function(c) {
        var hex = '#' + [c.r, c.g, c.b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join('');
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      });
      var sorted = Object.entries(colorMap).sort(function(a, b) { return b[1] - a[1]; });
      if (sorted.length > 0 && sorted[0][1] / edgeColors.length > 0.6) {
        // 내부 색상과 다른지 확인
        var innerP = getPixel(Math.floor(w / 2), Math.floor(h / 2));
        var innerHex = '#' + [innerP.r, innerP.g, innerP.b].map(function(v) { return v.toString(16).padStart(2, '0'); }).join('');
        if (sorted[0][0] !== innerHex) {
          result.border.detected = true;
          result.border.color = sorted[0][0];
        }
      }
    }
  }

  // ── 3. border-radius 감지 (모서리 투명 패턴) ──
  if (hasAlpha) {
    var cornerTransparent = 0;
    var cornerTotal = 0;
    var checkSize = Math.min(Math.floor(Math.min(w, h) / 4), 15);
    for (var cx = 0; cx < checkSize; cx++) {
      for (var cy = 0; cy < checkSize; cy++) {
        cornerTotal++;
        // 좌상 모서리
        if (getPixel(cx, cy).a < 50) cornerTransparent++;
      }
    }
    if (cornerTransparent / cornerTotal > 0.3) {
      result.radius.detected = true;
      // radius 추정: 대각선으로 첫 불투명 픽셀까지 거리
      var rad = 0;
      for (var d = 0; d < checkSize * 2; d++) {
        var dx = Math.min(d, w - 1);
        var dy = Math.min(d, h - 1);
        if (getPixel(dx, dy).a < 50) rad++;
        else break;
      }
      result.radius.estimated = rad;
    }
  }

  // ── 4. 완성형/소스 판단 ──
  var compositeScore = 0;
  if (result.border.detected) compositeScore += 2;
  if (result.shadow.detected) compositeScore += 2;
  if (result.radius.detected) compositeScore += 1;
  // 작은 이미지(아이콘/버튼)면 완성형 가능성 높음
  if (w < 300 && h < 300) compositeScore += 1;

  if (compositeScore >= 3) {
    result.composite = true;
    result.sourceType = '완성형';
  } else if (compositeScore >= 1) {
    result.sourceType = '완성형 가능성';
  } else {
    result.sourceType = '소스';
  }

  // ── 5. 패널형 시각 박스 힌트 (판정이 아니라 보조 신호) ──
  var aspect = h ? (w / h) : 0;
  if (!hasAlpha &&
      w >= 900 &&
      h >= 260 && h <= 760 &&
      aspect >= 1.8 && aspect <= 4.5 &&
      !result.shadow.detected) {
    result.hints.panelLike = true;
  }

  return result;
}

async function main() {
  var files = [];
  var stat = fs.statSync(target);

  if (stat.isDirectory()) {
    var all = fs.readdirSync(target).filter(function(f) {
      return /\.(png|jpg|jpeg)$/i.test(f);
    });
    if (prefix) {
      all = all.filter(function(f) { return f.startsWith(prefix); });
    }
    files = all.map(function(f) { return path.join(target, f); });
  } else {
    files = [target];
  }

  if (files.length === 0) {
    console.error('분석할 이미지 없음');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════╗');
  console.log('║  IMAGE ANALYZER — 이미지 내용 분석    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('대상: ' + files.length + '개\n');

  var allResults = [];
  for (var i = 0; i < files.length; i++) {
    var r = await analyzeImage(files[i]);
    allResults.push(r);
    console.log('── ' + r.file + ' (' + r.width + '×' + r.height + ') ──');
    console.log('  sourceType: ' + r.sourceType + (r.composite ? ' ⚠️ CSS 효과 중복 주의' : ''));
    if (r.hints && r.hints.panelLike) {
      console.log('  hint: panelLike');
    }
    if (r.border.detected) {
      console.log('  border: ✅ 감지 (color:' + r.border.color + ', thickness:~' + r.border.thickness + 'px)');
    } else {
      console.log('  border: 없음');
    }
    if (r.shadow.detected) {
      console.log('  shadow: ✅ 감지 (padding:~' + r.shadow.padding + 'px)');
    } else {
      console.log('  shadow: 없음');
    }
    if (r.radius.detected) {
      console.log('  radius: ✅ 감지 (estimated:~' + r.radius.estimated + 'px)');
    } else {
      console.log('  radius: 없음');
    }
    console.log('');
  }

  // --out 지정 시 JSON 파일로 저장
  if (outPath) {
    var outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      images: allResults
    }, null, 2));
    console.log('📄 분석 결과 저장: ' + outPath);
  }
}

main().catch(function(e) { console.error(e); process.exit(1); });
