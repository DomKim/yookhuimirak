#!/usr/bin/env node
/**
 * position-checker.js v5 (최종)
 * spec 기반 렌더링 좌표 자동 대조
 *
 * Threshold 정책:
 *   texts X: ≤10px PASS, 11~30px WARN, >30px FAIL
 *   images X: ≤10px PASS, 11~50px WARN, >50px WARN(매핑)
 *   images W: ≤5px PASS, 5~16% WARN, >16% FAIL
 *   texts center: X 스킵
 *   Swiper 내부 images: X 스킵
 *   배경 images (w>1900): 스킵
 *   rects: 비활성 (false positive 다수)
 *
 * 사용법:
 *   node tools/position-checker.js <spec.json> <url> <selector> [--tolerance N] [--json]
 */
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
if (args.length < 3) { console.log('사용법: node tools/position-checker.js <spec> <url> <selector>'); process.exit(1); }

const specPath = path.resolve(args[0]);
const url = args[1];
const sel = args[2];
const tolIdx = args.indexOf('--tolerance');
const TOL = tolIdx !== -1 ? parseFloat(args[tolIdx + 1]) : 5;
const jsonMode = args.includes('--json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
const CANVAS = spec.canvas || 1905;
const secTop = spec.sectionY ? spec.sectionY.top : 0;

function normSec(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function planningPlanCandidates(specFilePath) {
  const out = [];
  const specAbs = path.resolve(specFilePath);
  const specDir = path.dirname(specAbs);
  const specBase = path.basename(specAbs, path.extname(specAbs));
  const baseMatch = specBase.match(/^spec_([^_]+)_(.+)$/i);
  const pageName = (baseMatch && baseMatch[1]) || '';
  const sectionName = (baseMatch && baseMatch[2]) || (spec.section || '');

  out.push(path.join(specDir, 'plan.json'));
  if (pageName && sectionName) out.push(path.join(process.cwd(), '.planning', `${pageName}_${sectionName}`, 'plan.json'));
  if (sectionName) out.push(path.join(process.cwd(), '.planning', sectionName, 'plan.json'));

  const planningRoot = path.join(process.cwd(), '.planning');
  if (fs.existsSync(planningRoot)) {
    try {
      fs.readdirSync(planningRoot)
        .map(function(d) {
          let score = 0;
          const lower = d.toLowerCase();
          const secLower = String(sectionName || '').toLowerCase();
          if (pageName && lower === `${pageName}_${secLower}`) score += 100;
          if (pageName && lower.startsWith(`${pageName}_${secLower}`)) score += 60;
          if (lower === secLower) score += 50;
          if (lower.includes(secLower)) score += 20;
          if (normSec(d) === normSec(sectionName)) score += 10;
          return { d, score };
        })
        .filter(function(item) { return item.score > 0; })
        .sort(function(a, b) { return b.score - a.score || a.d.localeCompare(b.d); })
        .forEach(function(item) {
          out.push(path.join(planningRoot, item.d, 'plan.json'));
        });
    } catch (e) {}
  }
  return Array.from(new Set(out));
}

function loadLocalPlan(specFilePath) {
  try {
    const candidates = planningPlanCandidates(specFilePath);
    for (const localPlanPath of candidates) {
      if (!fs.existsSync(localPlanPath)) continue;
      return JSON.parse(fs.readFileSync(localPlanPath, 'utf8'));
    }
  } catch (e) {}
  return null;
}

let P = 0, F = 0, W = 0, failList = [], all = [];
function PASS(m) { P++; all.push({status:'pass',msg:m}); if(!jsonMode) console.log('  ✅ '+m); }
function FAIL(m) { F++; failList.push(m); all.push({status:'fail',msg:m}); if(!jsonMode) console.log('  ❌ '+m); }
function WARN(m) { W++; all.push({status:'warn',msg:m}); if(!jsonMode) console.log('  ⚠️  '+m); }

async function run() {
  const pw = require('playwright');
  const br = await pw.chromium.launch();
  const pg = await br.newPage({ viewport: { width: CANVAS, height: 1080 } });
  await pg.goto(url); await pg.waitForTimeout(2000);

  if (!jsonMode) {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  POSITION CHECKER v5                 ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('  spec: ' + path.basename(specPath) + '  tol: ' + TOL + 'px\n');
  }

  const secBox = await pg.locator(sel).boundingBox();
  if (!secBox) { FAIL('섹션 미발견: ' + sel); done(); await br.close(); return; }

  // DOM 수집
  const dom = await pg.evaluate(function(s) {
    var sec = document.querySelector(s); if (!sec) return null;
    var sr = sec.getBoundingClientRect();
    var texts = [], images = [];

    sec.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div,th,td,label,li,button').forEach(function(el) {
      if (/\b[\w-]*probe[\w-]*\b/.test(el.className || '')) return;
      var directText = Array.prototype.slice.call(el.childNodes).filter(function(n) {
        return n.nodeType === Node.TEXT_NODE;
      }).map(function(n) { return n.textContent; }).join('').replace(/\s+/g,' ').trim();
      if (el.children.length > 0 && directText.length < 2) {
        var inlineTextOnly = Array.prototype.slice.call(el.children).every(function(child) {
          return /^(SPAN|B|STRONG|EM|I|SMALL|BR)$/.test(child.tagName) && child.children.length === 0;
        });
        if (!inlineTextOnly) return;
      }
      var t = el.textContent.replace(/\s+/g,' ').trim();
      if (t.length < 2) return;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
      var r = el.getBoundingClientRect(); if (!r.width) return;
      texts.push({
        text: t.substring(0,50),
        x: r.left-sr.left,
        y: r.top-sr.top,
        w: r.width,
        h: r.height,
        align: cs.textAlign,
        tag: el.tagName.toLowerCase(),
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight
      });
    });

    // flex/grid 부모 3단계까지 탐색
    function findFlexGrid(el) {
      var cur = el.parentElement;
      for (var i = 0; i < 3 && cur; i++) {
        var d = getComputedStyle(cur).display;
        if (d === 'flex' || d === 'inline-flex' || d === 'grid') return true;
        cur = cur.parentElement;
      }
      return false;
    }

    // positioned 요소 수집 (absol/rltv div — dot, line, ring 등)
    var elems = [];
    sec.querySelectorAll('[class]').forEach(function(el) {
      if (/\b[\w-]*probe[\w-]*\b/.test(el.className || '')) return;
      var cs = getComputedStyle(el);
      if (cs.position !== 'absolute' && cs.position !== 'relative') return;
      if (el.tagName === 'SECTION') return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // 텍스트 전용이면 스킵 (이미 texts에서 처리)
      if (el.children.length === 0 && el.textContent.trim().length > 2) return;
      var cls = el.className.split(/\s+/).filter(function(c){ return c && c !== 'absol' && c !== 'rltv' && c !== 'zin' && c !== 'mf'; });
      if (!cls.length) return;
      elems.push({
        cls: cls.join('.'),
        x: r.left - sr.left, y: r.top - sr.top,
        w: r.width, h: r.height,
        pos: cs.position
      });
    });

    sec.querySelectorAll('img').forEach(function(img) {
      if (/\b[\w-]*probe[\w-]*\b/.test(img.className || '')) return;
      if ((img.getAttribute('src')||'').indexOf('?TODO') !== -1) return;
      var cs = getComputedStyle(img);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
      var wr = (img.parentElement||img).getBoundingClientRect();
      var inFlex = findFlexGrid(img);
      var src = (img.getAttribute('src')||'').split('/').pop().split('?')[0];
      images.push({
        src: src,
        x: wr.left-sr.left, y: wr.top-sr.top, w: wr.width,
        nw: img.naturalWidth, nh: img.naturalHeight,
        rw: img.getBoundingClientRect().width, rh: img.getBoundingClientRect().height,
        swiper: !!img.closest('.swiper-wrapper'),
        flex: inFlex
      });
    });
    return { texts: texts, images: images, elems: elems };
  }, sel);

  if (!dom) { FAIL('DOM 수집 실패'); done(); await br.close(); return; }

  var sectionPrefixMatch = String(spec.section || path.basename(specPath)).match(/con\d+/);
  var sectionPrefix = sectionPrefixMatch ? sectionPrefixMatch[0] : '';
  var sectionNumMatch = sectionPrefix.match(/con0*(\d+)/);
  var compositeRe = sectionNumMatch ? new RegExp('^con0*' + sectionNumMatch[1] + '(?:[_.,]|\\b).*\\.(png|jpe?g|webp|gif)$', 'i') : null;
  var sectionImageRe = compositeRe || (spec.section ? new RegExp('^' + String(spec.section).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[_-].*\\.(png|jpe?g|webp|gif)$', 'i') : null);
  var compositeBoxes = sectionImageRe ? dom.images.filter(function(d) {
    return sectionImageRe.test(d.src) && !/(?:^|_)bg[_-]?\d*\.(png|jpe?g|webp|gif)$/i.test(d.src) && d.rw > 20 && d.rh > 10 && d.rw < 1100;
  }) : [];
  var ignoredAssetFiles = {};
  var ignoredAssetNames = {};
  var ignoredAssetReplacementByName = {};
  var localPlan = loadLocalPlan(specPath);
  var ignoredTextKeys = {};
  if (localPlan) {
    (localPlan.ignoredAssets || []).forEach(function(item) {
      var file = typeof item === 'string' ? item : item && item.file;
      if (item && item.name) {
        if (file) ignoredAssetReplacementByName[String(item.name)] = path.basename(String(file));
        else ignoredAssetNames[String(item.name)] = true;
      } else if (file) {
        ignoredAssetFiles[path.basename(String(file))] = true;
      }
    });
    (localPlan.ignoredTexts || []).forEach(function(item) {
      if (!item) return;
      if (typeof item === 'string') ignoredTextKeys[item] = true;
      if (item.name) ignoredTextKeys[String(item.name)] = true;
      if (item.content) ignoredTextKeys[String(item.content)] = true;
    });
  }
  var renderTopBaseline = secTop;
  if (localPlan && Number(localPlan.prevSectionBottom) > secTop) {
    renderTopBaseline = Number(localPlan.prevSectionBottom);
  }

  function layerBox(layer) {
    var rect = layer.clippingRect || layer;
    return {
      x: rect.x || 0,
      y: (rect.y || 0) - renderTopBaseline,
      w: rect.w || 0,
      h: rect.h || 0
    };
  }

  function insideCompositeImage(layer) {
    if (!compositeBoxes.length) return false;
    var b = layerBox(layer);
    if (!b.w || !b.h) return false;
    var cx = b.x + b.w / 2;
    var cy = b.y + b.h / 2;
    return compositeBoxes.some(function(img) {
      return cx >= img.x - 8 && cx <= img.x + img.rw + 8 &&
             cy >= img.y - 8 && cy <= img.y + img.rh + 8;
    });
  }

  function expectedFontKeys(t) {
    var keys = {};
    (t.segments || []).forEach(function(seg) {
      var ff = String(seg.fontFamily || '');
      if (/SDHeirofLight|HeirofLight/i.test(ff)) keys.heiroflight = 'HeirofLight';
      else if (/SongMyung/i.test(ff)) keys.songmyung = 'SongMyung';
      else if (/SUIT|Suit/i.test(ff)) keys.suit = 'SUIT';
      else if (/GenKJwajin|KimJwaJin/i.test(ff)) keys.kimjwajingeneral = 'KimJwaJinGeneral';
      else if (/Pretendard/i.test(ff)) keys.pretendard = 'Pretendard';
    });
    return Object.keys(keys).map(function(k){ return { key:k, label:keys[k] }; });
  }

  function renderedFontHas(rendered, expectedKey) {
    var ff = String(rendered || '').toLowerCase().replace(/["']/g, '');
    return ff.indexOf(expectedKey) !== -1;
  }

  function imageLooksLikeClippedExport(pi, m) {
    if (!pi || !pi.clippingRect || !m) return false;
    var cw = pi.clippingRect.w || 0;
    var ch = pi.clippingRect.h || 0;
    if (!cw || !ch || !m.nw) return false;
    var rawWDelta = pi.w ? Math.abs(m.nw - pi.w) / Math.max(pi.w, 1) : 999;
    var clipWDelta = Math.abs(m.nw - cw) / Math.max(cw, 1);
    var clipHDelta = m.nh ? Math.abs(m.nh - ch) / Math.max(ch, 1) : 0;
    // Exported PNGs are often cropped to clippingRect while the PSD smart object bounds stay larger.
    return clipWDelta <= 0.06 && rawWDelta > clipWDelta && clipHDelta <= 0.10;
  }

  function expectedImageX(pi, m) {
    return imageLooksLikeClippedExport(pi, m) ? pi.clippingRect.x : pi.x;
  }
  function expectedImageY(pi, m) {
    return imageLooksLikeClippedExport(pi, m) ? pi.clippingRect.y : pi.y;
  }

  function preferSpecificTextBox(candidates) {
    candidates.sort(function(a,b){ return a.w - b.w; });
    if (candidates.length > 1 && candidates[1].w > candidates[0].w * 2) {
      return [candidates[0]];
    }
    return candidates;
  }

  // ── TEXTS ──
  if (spec.texts && spec.texts.length) {
    if (!jsonMode) console.log('── texts ('+spec.texts.length+') ──');
    var pt = spec.texts.slice().sort(function(a,b){return a.y-b.y});
    var repeatedTextCounts = {};
    pt.forEach(function(t) {
      var key = String(t.content || t.name || '').replace(/\s+/g, '');
      if (!key) return;
      repeatedTextCounts[key] = (repeatedTextCounts[key] || 0) + 1;
    });

    pt.forEach(function(t, i) {
      var q = (t.content||t.name||'').replace(/\n/g,' ').substring(0,15).trim();
      if (q.length < 2) return;
      if (ignoredTextKeys[t.name] || ignoredTextKeys[t.content]) { PASS('"'+q+'" — plan ignoredTexts 스킵'); return; }
      if (insideCompositeImage(t)) { PASS('"'+q+'" — 완성형 이미지 내부 텍스트 스킵'); return; }

      // 매칭: 12자 → 8자 → 6자 fallback
      // 가장 좁은(width 작은) 매칭 요소 선택 → leaf 우선
      var candidates = [];
      [12,8,6].some(function(n) {
        var sub = q.substring(0, Math.min(n, q.length));
        candidates = dom.texts.filter(function(d){ return d.text.indexOf(sub) !== -1; });
        return candidates.length > 0;
      });
      var exactCandidates = candidates.filter(function(d){ return d.text.indexOf(q) !== -1; });
      if (exactCandidates.length > 0) candidates = exactCandidates;
      candidates = preferSpecificTextBox(candidates);
      // width가 가장 작은 걸 선택 (leaf element)
      candidates.sort(function(a,b){ return a.w - b.w; });
      var m = candidates.length > 0 ? candidates[0] : null;

      if (!m) { WARN('"'+q+'" 미발견'); return; }
      if (m.x === 0 && m.w > 1800) { WARN('"'+q+'" 매칭 불확실'); return; }
      // 짧은 텍스트(≤4자) 또는 동일 텍스트 다수 → 매칭 신뢰도 낮음
      if (q.length <= 4 && candidates.length > 1) {
        var repeatedKey = String(t.content || t.name || '').replace(/\s+/g, '');
        if ((repeatedTextCounts[repeatedKey] || 0) >= 2) {
          PASS('"'+q+'" 반복 짧은텍스트 다수매칭 — 스킵');
          return;
        }
        WARN('"'+q+'" 짧은텍스트 다수매칭 — 스킵');
        return;
      }

      var lbl = '"'+q+'"';
      var repeatedKey = String(t.content || t.name || '').replace(/\s+/g, '');
      var repeatedCount = repeatedTextCounts[repeatedKey] || 0;

      // Font family: PSD family name must map to the project's actual webfont.
      // This catches cases where an HTML class exists but its CSS font-family is missing.
      var fontKeys = expectedFontKeys(t);
      if (fontKeys.length === 1) {
        if (renderedFontHas(m.fontFamily, fontKeys[0].key)) {
          PASS(lbl+' font-family — '+fontKeys[0].label);
        } else {
          FAIL(lbl+' font-family — PSD:'+fontKeys[0].label+' 렌더:'+m.fontFamily);
        }
      } else if (fontKeys.length > 1) {
        var matchedAny = fontKeys.some(function(f){ return renderedFontHas(m.fontFamily, f.key); });
        if (matchedAny) PASS(lbl+' font-family — mixed');
        else FAIL(lbl+' font-family — PSD mixed:'+fontKeys.map(function(f){ return f.label; }).join('/')+' 렌더:'+m.fontFamily);
      }

      // X
      if (m.align === 'center') { PASS(lbl+' X — center'); }
      else {
        var dx = Math.abs(m.x - t.x);
        if (dx <= 10) PASS(lbl+' X — Δ'+dx.toFixed(1));
        else if (dx <= 30) WARN(lbl+' X — PSD:'+t.x+' 렌더:'+m.x.toFixed(1)+' Δ'+dx.toFixed(1));
        else FAIL(lbl+' X — PSD:'+t.x+' 렌더:'+m.x.toFixed(1)+' Δ'+dx.toFixed(1));
      }

      // Y gap
      if (i > 0) {
        if (repeatedCount >= 2) {
          PASS(lbl+' Ygap — 반복 동일텍스트 스킵');
          return;
        }
        function sameVerticalFlow(a, b) {
          var a1 = a.x, a2 = a.x + a.w, b1 = b.x, b2 = b.x + b.w;
          var overlap = Math.min(a2, b2) - Math.max(a1, b1);
          var minW = Math.max(1, Math.min(a.w, b.w));
          var ac = a.x + a.w / 2, bc = b.x + b.w / 2;
          return overlap >= minW * 0.2 || Math.abs(ac - bc) <= Math.max(80, minW * 0.75);
        }
        var prev = null;
        var pm = null;
        for (var pi = i - 1; pi >= 0 && !pm; pi--) {
          var prevCandidate = pt[pi];
          if (insideCompositeImage(prevCandidate)) continue;
          if (!sameVerticalFlow(t, prevCandidate)) continue;
          if (t.y - (prevCandidate.y + prevCandidate.h) > 150) continue;
          var pq = (prevCandidate.content||prevCandidate.name||'').replace(/\n/g,' ').substring(0,15).trim();
          if (pq.length < 2) continue;
          var prevCandidates = [];
          [12,8,6].some(function(n) {
            var sub = pq.substring(0, Math.min(n, pq.length));
            prevCandidates = dom.texts.filter(function(d){ return d.text.indexOf(sub) !== -1; });
            return prevCandidates.length > 0;
          });
          var exactPrevCandidates = prevCandidates.filter(function(d){ return d.text.indexOf(pq) !== -1; });
          if (exactPrevCandidates.length > 0) prevCandidates = exactPrevCandidates;
          prevCandidates = preferSpecificTextBox(prevCandidates);
          if (pq.length <= 4 && prevCandidates.length > 1) continue;
          prevCandidates.sort(function(a,b){ return a.w - b.w; });
          if (prevCandidates.length > 0) {
            prev = prevCandidate;
            pm = prevCandidates[0];
          }
        }
        if (pm && !(pm.x===0 && pm.w>1800)) {
          var pg2 = t.y-(prev.y+prev.h), rg = m.y-(pm.y+pm.h);
          var gd = Math.abs(rg-pg2);
          if (gd <= 15) PASS(lbl+' Ygap — Δ'+gd.toFixed(1));
          else if (gd <= 100) WARN(lbl+' Ygap — PSD:'+pg2+' 렌더:'+rg.toFixed(1)+' Δ'+gd.toFixed(1));
          else FAIL(lbl+' Ygap — PSD:'+pg2+' 렌더:'+rg.toFixed(1)+' Δ'+gd.toFixed(1)+' (100px 초과)');
        }
      }
    });
    if (!jsonMode) console.log('');
  }

  // ── IMAGES ──
  if (spec.images && spec.images.length) {
    if (!jsonMode) console.log('── images ('+spec.images.length+') ──');

    spec.images.forEach(function(pi) {
      var fn = pi.possibleFile; if (!fn) return;
      var replacementFile = ignoredAssetReplacementByName[pi.name];
      if (replacementFile) fn = replacementFile;
      else if (ignoredAssetNames[pi.name]) { PASS(pi.name+' — ignoredAssets(name) 근거로 스킵'); return; }
      if (ignoredAssetFiles[path.basename(String(fn))]) { PASS(fn+' — ignoredAssets 근거로 스킵'); return; }
      if (fn === 'TODO' && insideCompositeImage(pi)) { PASS(fn+' — 완성형 이미지 내부 레이어 스킵'); return; }
      // 배경 판단은 DOM 실제 렌더링 크기 기준 (PSD 크기는 매핑 오류 가능)
      var domMatch = dom.images.find(function(d){ return d.src === fn; });
      var renderW = domMatch ? domMatch.rw : 0;
      if (renderW > 1900 || (renderW === 0 && pi.w > 1900)) {
        // 배경이라도 clippingRect가 있으면 Y bottom 검증
        // clippingRect bottom과 이미지 렌더링 bottom이 일치하는지
        // secTop 대신 실제 렌더링 offset으로 보정 (타이틀 텍스트 기준)
        if (pi.clippingRect && domMatch) {
          // 가장 신뢰할 수 있는 텍스트로 PSD→렌더링 Y offset 계산
          // yOffset: PSD 절대 Y → section 렌더링 기준 변환
          // plan.json의 prevSectionBottom이 있으면 사용, 없으면 텍스트 매칭으로 추정
          var yOffset = renderTopBaseline;
          // plan.json 찾기
          var planDir = path.join(path.dirname(specPath), '..', '.planning');
          if (!fs.existsSync(planDir)) {
            var cwdPlanDir = path.join(process.cwd(), '.planning');
            if (fs.existsSync(cwdPlanDir)) planDir = cwdPlanDir;
          }
          // page 이름 추출 (spec 파일명에서: spec_franchise_con06.json → franchise)
          var specBase = path.basename(specPath, '.json');
          var specPage = specBase.replace(/^spec_/, '').replace(/_con\d+$/, '');
          var planGlob = fs.existsSync(planDir) ? fs.readdirSync(planDir).filter(function(d) { return d.includes(spec.section) && d.includes(specPage); }) : [];
          if (planGlob.length > 0) {
            try {
              var planPath = path.join(planDir, planGlob[0], 'plan.json');
              var planData = JSON.parse(fs.readFileSync(planPath, 'utf8'));
              if (planData.prevSectionBottom) { yOffset = planData.prevSectionBottom; }
            } catch(e) {}
          }
          if (yOffset === renderTopBaseline) {
            // fallback: 텍스트 매칭
            if (spec.texts && dom.texts) {
              for (var ti = 0; ti < Math.min(spec.texts.length, 5); ti++) {
                var st = spec.texts[ti];
                if (st.y <= renderTopBaseline) continue;
                var sq = (st.content||st.name||'').replace(/\n/g,' ').substring(0,8).trim();
                for (var di = 0; di < dom.texts.length; di++) {
                  if (dom.texts[di].text.indexOf(sq) !== -1 && dom.texts[di].y > 50) {
                    yOffset = st.y - dom.texts[di].y;
                    break;
                  }
                }
                if (yOffset !== renderTopBaseline) break;
              }
            }
          }
          var clipBottom = imageLooksLikeClippedExport(pi, domMatch)
            ? pi.clippingRect.y + pi.clippingRect.h - yOffset
            : pi.y + domMatch.nh - yOffset;
          var renderBottom = domMatch.y + domMatch.rh;
          var dbottom = Math.abs(renderBottom - clipBottom);
          if (dbottom <= 15) PASS(fn+' — 배경 bottom Δ'+dbottom.toFixed(1));
          else if (dbottom <= 50) WARN(fn+' bottom — clip:'+clipBottom.toFixed(0)+' 렌더:'+renderBottom.toFixed(0)+' Δ'+dbottom.toFixed(1));
          else FAIL(fn+' bottom — clip:'+clipBottom.toFixed(0)+' 렌더:'+renderBottom.toFixed(0)+' Δ'+dbottom.toFixed(1)+' (clippingRect 하단 불일치)');
        } else {
          PASS(fn+' — 배경 스킵');
        }
        return;
      }

      var m = dom.images.find(function(d){ return d.src === fn; });
      if (!m) { WARN(fn+' — DOM 미발견'); return; }
      // hidden 이미지 (width=0, display:none 등)
      if (m.rw === 0) { WARN(fn+' — hidden (w=0), 스킵'); return; }
      // PSD x=0 또는 음수 → spec 좌표 불확실
      var expectedX = expectedImageX(pi, m);
      if (expectedX <= 0) { WARN(fn+' — PSD x≤0, 스킵'); return; }

      // X
      var dx = Math.abs(m.x - expectedX);
      if (m.swiper) { PASS(fn+' — Swiper, X 스킵'); }
      else if (m.flex && dx > 50) { WARN(fn+' X — flex 내부 Δ'+dx.toFixed(1)); }
      else {
        // PSD width vs 실제 naturalWidth 비교 — 크게 다르면 매핑 오류
        var psdWmatch = pi.w > 0 ? Math.abs(m.nw - pi.w) / pi.w : 0;
        var likelyMismapping = psdWmatch > 0.5; // PSD width와 50% 이상 차이

        if (dx <= 10) PASS(fn+' X — Δ'+dx.toFixed(1));
        else if (dx <= 80) WARN(fn+' X — Δ'+dx.toFixed(1));
        else if (likelyMismapping) WARN(fn+' X — Δ'+dx.toFixed(1)+' (매핑오류)');
        else WARN(fn+' X — Δ'+dx.toFixed(1)+' (배치 확인)');
      }

      // Y (clippingRect 또는 PSD y 기준)
      var expectedY = expectedImageY(pi, m) - renderTopBaseline;
      var dy = Math.abs(m.y - expectedY);
      if (dy <= 10) PASS(fn+' Y — Δ'+dy.toFixed(1));
      else if (dy <= 50) WARN(fn+' Y — PSD:'+expectedY.toFixed(0)+' 렌더:'+m.y.toFixed(1)+' Δ'+dy.toFixed(1));
      else FAIL(fn+' Y — PSD:'+expectedY.toFixed(0)+' 렌더:'+m.y.toFixed(1)+' Δ'+dy.toFixed(1));

      // W
      var wd = Math.abs(m.rw - m.nw);
      var wp = m.nw > 0 ? wd/m.nw*100 : 999;
      if (wd <= 5) PASS(fn+' W — Δ'+wd.toFixed(1));
      else if (wp <= 16) WARN(fn+' W — 렌더:'+m.rw.toFixed(1)+' 원본:'+m.nw+' Δ'+wd.toFixed(1)+' ('+wp.toFixed(1)+'%)');
      else FAIL(fn+' W — 렌더:'+m.rw.toFixed(1)+' ≠ 원본:'+m.nw+' ('+wp.toFixed(1)+'%)');
    });
  }

  // ── POSITIONED ELEMENTS (rects/ellipses vs DOM) ──
  if (spec.rects && dom.elems && dom.elems.length) {
    if (!jsonMode) console.log('── positioned elements ('+dom.elems.length+') ──');
    var smallRects = spec.rects.filter(function(r) { return r.w < 200 && r.h < 800 && r.w > 2 && !insideCompositeImage(r); });
    var usedDomIdx = {}; // 이미 매칭된 DOM 요소 인덱스 추적
    // 크기+위치 유사도로 정렬 후 매칭 (greedy)
    var pairs = [];
    smallRects.forEach(function(sr) {
      var expectedX = sr.x;
      var expectedY = sr.y - renderTopBaseline;
      dom.elems.forEach(function(el, idx) {
        var isThinVertical = sr.w <= 8 && sr.h >= 80 && sr.h / Math.max(sr.w, 1) >= 12;
        var isThinHorizontal = sr.h <= 8 && sr.w >= 80 && sr.w / Math.max(sr.h, 1) >= 12;
        if (isThinVertical && el.w > Math.max(24, sr.w * 6)) return;
        if (isThinHorizontal && el.h > Math.max(24, sr.h * 6)) return;
        var dist = Math.abs(el.x - expectedX) + Math.abs(el.y - expectedY);
        // 크기 유사도 보너스: PSD rect w/h와 DOM w/h 비교
        var sizeDiff = Math.abs(el.w - sr.w) + Math.abs(el.h - sr.h);
        var classParts = String(el.cls || '').split('.');
        var classBonus = 0;
        if (classParts.indexOf(sr.name) !== -1) classBonus = -250;
        else if (String(el.cls || '').indexOf(sr.name) !== -1) classBonus = -120;
        pairs.push({ sr: sr, el: el, idx: idx, dist: dist, sizeDiff: sizeDiff, score: dist + sizeDiff * 0.5 + classBonus });
      });
    });
    pairs.sort(function(a,b) { return a.score - b.score; });
    var usedSpec = {};
    pairs.forEach(function(p) {
      if (usedSpec[p.sr.name + p.sr.x + p.sr.y] || usedDomIdx[p.idx]) return;
      if (p.dist > 100) return;
      usedSpec[p.sr.name + p.sr.x + p.sr.y] = true;
      usedDomIdx[p.idx] = true;
      var expectedX = p.sr.x;
      var expectedY = p.sr.y - renderTopBaseline;
      var lbl = p.sr.name.substring(0,20) + ' (' + p.el.cls + ')';
      var dx = Math.abs(p.el.x - expectedX);
      if (dx <= TOL) PASS(lbl+' X — Δ'+dx.toFixed(1));
      else if (dx <= 30) WARN(lbl+' X — PSD:'+expectedX+' 렌더:'+p.el.x.toFixed(1)+' Δ'+dx.toFixed(1));
      else FAIL(lbl+' X — PSD:'+expectedX+' 렌더:'+p.el.x.toFixed(1)+' Δ'+dx.toFixed(1));
      var dy = Math.abs(p.el.y - expectedY);
      if (dy <= TOL) PASS(lbl+' Y — Δ'+dy.toFixed(1));
      else if (dy <= 30) WARN(lbl+' Y — PSD:'+expectedY.toFixed(0)+' 렌더:'+p.el.y.toFixed(1)+' Δ'+dy.toFixed(1));
      else FAIL(lbl+' Y — PSD:'+expectedY.toFixed(0)+' 렌더:'+p.el.y.toFixed(1)+' Δ'+dy.toFixed(1));
    });
    if (!jsonMode) console.log('');
  }

  done(); await br.close();
}

function done() {
  // WARN 6개 이상이면 전체 FAIL 처리. JSON 모드에서도 같은 정확도 정책을 유지한다.
  if (W >= 6 && F === 0) {
    F++;
    failList.push('WARN ' + W + '개 — 6개 이상이면 위치 전면 재검토 필수');
  }
  if (jsonMode) { console.log(JSON.stringify({passes:P,fails:F,warns:W,failList:failList,results:all})); }
  else {
    console.log('\n  ✅ PASS:'+P+'  ⚠️  WARN:'+W+'  ❌ FAIL:'+F);
    if (failList.length) { console.log('\n❌ FAIL:'); failList.forEach(function(f){console.log('  - '+f)}); }
    console.log('\n'+(F===0?'✅ POSITION CHECK PASS':'❌ POSITION CHECK FAIL'));
  }
  process.exit(F>0?1:0);
}

run().catch(function(e){ console.error(e); process.exit(1); });
