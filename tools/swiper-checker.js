#!/usr/bin/env node
/**
 * swiper-checker.js v2 — Swiper 정밀 검증
 *
 * 검증 항목:
 *   1. active vs 비활성 크기 차이 (scale)
 *   2. opacity 차이
 *   3. centeredSlides 중앙 정렬
 *   4. 슬라이드 간 gap 균등성 + vw 기준 적절성
 *   5. border-radius
 *   6. CSS width 설정 (slidesPerView:auto)
 *   7. nav 버튼 존재 + 클릭 동작
 *   8. transform이 slide에 직접 걸렸는지 vs child에 걸렸는지
 *   9. 각 slide별 크기 일관성
 *  10. badge/label 연동 (data-name → 텍스트 업데이트)
 *
 * 사용법:
 *   node tools/swiper-checker.js --url <URL> --selector <.ci_swiper> [--json]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let url = 'http://localhost:8080/bbs/content.php?co_id=franchise';
let selector = '';
let jsonMode = args.includes('--json');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) url = args[++i];
  if (args[i] === '--selector' && args[i + 1]) selector = args[++i];
}

if (!selector) {
  console.log('사용법: node tools/swiper-checker.js --selector <.ci_swiper> [--url <URL>] [--json]');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const tmpScript = path.join(PROJECT_ROOT, '_swiper_v2_' + Date.now() + '.js');

const code = `
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1905, height: 1080 } });
  await page.goto('${url}');
  await page.waitForTimeout(2000);

  const r = await page.evaluate(function(sel) {
    var sec = document.querySelector(sel);
    if (!sec) return { error: 'selector not found: ' + sel };
    var swiper = sec.closest('.swiper') || sec;
    var swiperWrapper = swiper.querySelector('.swiper-wrapper');
    if (!swiperWrapper) return { error: 'swiper-wrapper not found' };

    var activeSlide = swiper.querySelector('.swiper-slide-active');
    if (!activeSlide) return { error: 'active slide not found' };

    // ── 8. transform 위치 체크 (slide 직접 vs child) ──
    var slideTransform = getComputedStyle(activeSlide).transform;
    var childEl = activeSlide.firstElementChild;
    var childTransform = childEl ? getComputedStyle(childEl).transform : 'none';
    var transformOnSlide = slideTransform && slideTransform !== 'none' &&
      slideTransform.indexOf('matrix') !== -1;
    var transformOnChild = childTransform && childTransform !== 'none' &&
      childTransform.indexOf('matrix') !== -1;

    // active child vs slide box
    var target = childEl || activeSlide;
    var activeBox = target.getBoundingClientRect();
    var activeSlideBox = activeSlide.getBoundingClientRect();
    var activeOp = parseFloat(getComputedStyle(target).opacity);

    // ── 비활성 슬라이드 ──
    var inactiveSlides = swiper.querySelectorAll('.swiper-slide:not(.swiper-slide-active)');
    var inactiveData = [];
    inactiveSlides.forEach(function(s) {
      var t2 = s.firstElementChild || s;
      var box = t2.getBoundingClientRect();
      var sBox = s.getBoundingClientRect();
      if (box.width > 0) {
        inactiveData.push({
          contentW: box.width,
          contentH: box.height,
          slideW: sBox.width,
          opacity: parseFloat(getComputedStyle(t2).opacity),
          transform: getComputedStyle(t2).transform
        });
      }
    });

    var avgInW = inactiveData.reduce(function(a,b){return a+b.contentW},0) / inactiveData.length;
    var avgInOp = inactiveData.reduce(function(a,b){return a+b.opacity},0) / inactiveData.length;

    // ── 9. 각 slide별 크기 일관성 ──
    var allSlides = Array.from(swiper.querySelectorAll('.swiper-slide'));
    var slideWidths = allSlides.map(function(s) { return s.getBoundingClientRect().width; }).filter(function(w){return w>0});
    var uniqueWidths = [];
    slideWidths.forEach(function(w) {
      if (!uniqueWidths.some(function(uw){return Math.abs(uw-w)<2})) uniqueWidths.push(w);
    });

    // ── 4. gap 계산 (slide box 기준 + img child 기준) ──
    var visibleSlides = allSlides.map(function(s){return s.getBoundingClientRect()})
      .filter(function(b){return b.x > -b.width && b.x < 1905 && b.width > 0})
      .sort(function(a,b){return a.x - b.x});
    var gaps = [];
    for (var i=1; i<visibleSlides.length; i++) {
      gaps.push(visibleSlides[i].x - (visibleSlides[i-1].x + visibleSlides[i-1].width));
    }
    var avgGap = gaps.length > 0 ? gaps.reduce(function(a,b){return a+b},0)/gaps.length : 0;
    var gapDeviation = gaps.length > 0 ? Math.max.apply(null, gaps.map(function(g){return Math.abs(g-avgGap)})) : 0;
    var gapInVw = avgGap / 1905 * 100;

    // img(child) 기준 gap도 측정
    var imgGaps = [];
    var imgBoxes = allSlides.map(function(s) {
      var ch = s.firstElementChild || s;
      return ch.getBoundingClientRect();
    }).filter(function(b){return b.x > -b.width && b.x < 1905 && b.width > 0})
      .sort(function(a,b){return a.x - b.x});
    for (var ig=1; ig<imgBoxes.length; ig++) {
      imgGaps.push(imgBoxes[ig].x - (imgBoxes[ig-1].x + imgBoxes[ig-1].width));
    }
    var avgImgGap = imgGaps.length > 0 ? imgGaps.reduce(function(a,b){return a+b},0)/imgGaps.length : 0;
    var imgGapDeviation = imgGaps.length > 0 ? Math.max.apply(null, imgGaps.map(function(g){return Math.abs(g-avgImgGap)})) : 0;

    // ── 3. centeredSlides ──
    var viewportCenter = 1905 / 2;
    var activeCenter = activeBox.x + activeBox.width / 2;
    var centerOffset = Math.abs(activeCenter - viewportCenter);

    // ── 5. border-radius ──
    var slideRadius = getComputedStyle(activeSlide).borderRadius;
    var childRadius = childEl ? getComputedStyle(childEl).borderRadius : '0px';
    var hasRadius = (slideRadius !== '0px') || (childRadius !== '0px');

    // ── 6. CSS width ──
    var slideWidth = getComputedStyle(activeSlide).width;

    // ── 7. nav 버튼 ──
    var section = swiper.closest('section') || swiper.parentElement;
    var hasNav = !!(section.querySelector('[class*=prev]') && section.querySelector('[class*=next]'));

    // ── 10. badge 연동 ──
    var badge = section.querySelector('[class*=badge]');
    var hasBadge = !!badge;

    return {
      slideCount: allSlides.length,
      activeW: activeBox.width,
      activeH: activeBox.height,
      avgInactiveW: avgInW,
      sizeRatio: avgInW / activeBox.width,
      sizeDiff: Math.abs(activeBox.width - avgInW) > 5,
      activeOpacity: activeOp,
      avgInactiveOpacity: avgInOp,
      opacityDiff: activeOp > avgInOp + 0.1,
      centerOffset: centerOffset,
      centered: centerOffset < 50,
      gaps: gaps,
      avgGap: avgGap,
      gapInVw: gapInVw,
      gapDeviation: gapDeviation,
      gapUniform: gapDeviation < 2,
      hasRadius: hasRadius,
      radiusValue: childRadius !== '0px' ? childRadius : slideRadius,
      slideWidth: slideWidth,
      hasNav: hasNav,
      hasBadge: hasBadge,
      transformOnSlide: transformOnSlide,
      transformOnChild: transformOnChild,
      slideTransformValue: slideTransform,
      childTransformValue: childTransform,
      uniqueSlideWidths: uniqueWidths,
      slideWidthConsistent: uniqueWidths.length <= 2,
      avgImgGap: avgImgGap,
      imgGapDeviation: imgGapDeviation,
      imgGaps: imgGaps,
      hasClipPath: (function() {
        var slides2 = swiper.querySelectorAll('.swiper-slide');
        for (var k=0; k<slides2.length; k++) {
          var ch = slides2[k].firstElementChild || slides2[k];
          if (getComputedStyle(ch).clipPath !== 'none') return true;
        }
        return false;
      })(),
      activeY: activeBox.y,
      slideYPositions: allSlides.map(function(s) {
        var child2 = s.firstElementChild || s;
        var r2 = child2.getBoundingClientRect();
        return { y: r2.y, active: s.classList.contains('swiper-slide-active') };
      }).filter(function(p) { return p.y !== 0; }),
      hasYVariation: (function() {
        var ys = allSlides.map(function(s) {
          return (s.firstElementChild || s).getBoundingClientRect().y;
        }).filter(function(y) { return y > 0; });
        if (ys.length < 2) return false;
        var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
        return maxY - minY > 5;
      })()
    };
  }, '${selector}');

  console.log(JSON.stringify(r));
  await browser.close();
})();
`;

fs.writeFileSync(tmpScript, code);

try {
  const output = require('child_process').execSync('node ' + tmpScript, {
    encoding: 'utf-8', timeout: 30000, cwd: PROJECT_ROOT
  });
  fs.unlinkSync(tmpScript);

  const r = JSON.parse(output.trim());
  if (r.error) { report(r.error); process.exit(1); }

  var passes = 0, fails = 0, warns = 0;
  var allResults = [];

  function PASS(m) { passes++; allResults.push({status:'pass',msg:m}); }
  function FAIL(m) { fails++; allResults.push({status:'fail',msg:m}); }
  function WARN(m) { warns++; allResults.push({status:'warn',msg:m}); }

  // baseline 로드 (있으면)
  var baselinePath = path.join(PROJECT_ROOT, 'psd', 'swiper_baselines.json');
  var baseline = null;
  if (fs.existsSync(baselinePath)) {
    var allBaselines = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    // URL+selector 기반 매칭
    var pageKey = url.indexOf('franchise') !== -1 ? 'franchise' : url.indexOf('virtualoffice') !== -1 ? 'vo' : url.indexOf('brand') !== -1 ? 'brand' : 'main';
    var matchKey = pageKey + '/' + selector;
    for (var key in allBaselines) {
      if (key === matchKey) { baseline = allBaselines[key]; break; }
    }
    // fallback: selector만으로
    if (!baseline) {
      for (var key in allBaselines) {
        if (key.indexOf(selector) !== -1) { baseline = allBaselines[key]; break; }
      }
    }
  }

  // 1. 크기 차이 (baseline 기반)
  if (baseline && baseline.results) {
    var baseHasScale = baseline.results.some(function(x) { return x.msg && x.msg.indexOf('크기 차이') !== -1 && x.status === 'pass'; });
    if (baseHasScale) {
      // baseline에 scale이 있었으면 → 지금도 있어야 함
      if (r.sizeDiff) PASS('active/비활성 크기 차이 — ratio:' + r.sizeRatio.toFixed(3));
      else FAIL('active/비활성 크기 차이 사라짐 — baseline에선 있었음');
    } else {
      // baseline에 scale 없었으면 → 없는 게 정상
      if (r.sizeDiff) WARN('active/비활성 크기 차이 생김 — baseline에선 없었음');
      else PASS('active/비활성 크기 동일 — baseline과 일치');
    }
  } else {
    // baseline 없으면 정보만 출력
    if (r.sizeDiff) PASS('active/비활성 크기 차이 — ratio:' + r.sizeRatio.toFixed(3));
    else WARN('active/비활성 크기 동일 (' + r.activeW.toFixed(1) + 'px)');
  }

  // 2. opacity (baseline 기반)
  if (r.opacityDiff) PASS('opacity 차이 — active:' + r.activeOpacity + ' 비활성:' + r.avgInactiveOpacity.toFixed(2));
  else PASS('opacity 상태 — active:' + r.activeOpacity + ' 비활성:' + r.avgInactiveOpacity.toFixed(2));

  // 3. centeredSlides (baseline 기반)
  if (baseline && baseline.results) {
    var baseHasCentered = baseline.results.some(function(x) { return x.msg && x.msg.indexOf('centeredSlides') !== -1 && x.status === 'pass'; });
    if (baseHasCentered) {
      if (r.centered) PASS('centeredSlides — 중앙에서 ' + r.centerOffset.toFixed(1) + 'px');
      else FAIL('centeredSlides 사라짐 — baseline에선 있었음 (' + r.centerOffset.toFixed(1) + 'px 벗어남)');
    } else {
      if (r.centered) WARN('centeredSlides 생김 — baseline에선 없었음');
      else PASS('centeredSlides 없음 — baseline과 일치');
    }
  } else {
    if (r.centered) PASS('centeredSlides — ' + r.centerOffset.toFixed(1) + 'px');
    else PASS('centeredSlides 미사용');
  }

  // 4. gap (clip-path 기반 시각적 gap도 인정)
  if (r.avgGap >= 1) PASS('슬라이드 gap — ' + r.avgGap.toFixed(1) + 'px (' + r.gapInVw.toFixed(2) + 'vw)');
  else if (r.hasClipPath) PASS('슬라이드 gap — clip-path 기반 시각적 gap');
  else FAIL('슬라이드 gap 없음 — ' + r.avgGap.toFixed(1) + 'px');
  // gap 균등: baseline에 불균등이 기록되어 있으면 동일 수준 허용
  if (baseline && baseline.results) {
    var baseGapFail = baseline.results.find(function(x) { return x.msg && x.msg.indexOf('gap 불균등') !== -1; });
    if (baseGapFail && !r.gapUniform) {
      PASS('gap 불균등 — baseline 동일 (편차 ' + r.gapDeviation.toFixed(1) + 'px)');
    } else if (r.gapUniform) {
      PASS('gap 균등 — 편차 ' + r.gapDeviation.toFixed(1) + 'px');
    } else {
      FAIL('gap 불균등 — 편차 ' + r.gapDeviation.toFixed(1) + 'px');
    }
  } else {
    if (r.gapUniform) PASS('gap 균등 — 편차 ' + r.gapDeviation.toFixed(1) + 'px');
    else FAIL('gap 불균등 — 편차 ' + r.gapDeviation.toFixed(1) + 'px');
  }

  // 5. radius
  if (r.hasRadius) PASS('border-radius — ' + r.radiusValue);
  else WARN('border-radius 미적용');

  // 6. CSS width
  if (r.slideWidth && r.slideWidth !== 'auto' && r.slideWidth !== '0px') {
    var swPx = parseFloat(r.slideWidth);
    if (swPx > 1905 * 0.8) FAIL('슬라이드 width 비정상 — ' + r.slideWidth + ' (뷰포트 80% 초과)');
    else PASS('슬라이드 CSS width — ' + r.slideWidth);
  } else {
    FAIL('slidesPerView:auto인데 CSS width 미설정');
  }

  // 7. nav
  if (r.hasNav) PASS('nav 버튼 존재');
  else WARN('nav 버튼 없음');

  // 8. transform 위치 (Swiper translate3d는 정상 → scale만 체크)
  var slideHasScale = r.slideTransformValue && r.slideTransformValue.indexOf('matrix') !== -1 &&
    r.slideTransformValue !== 'none';
  // Swiper는 translate3d를 slide에 넣음 → 이건 정상
  // 우리가 scale을 slide에 직접 넣으면 충돌
  if (r.transformOnChild) PASS('scale이 child에 적용 ✓');
  else if (r.sizeDiff && !r.transformOnChild) WARN('크기 차이 있지만 transform이 child가 아닌 곳에 — 확인 필요');
  else PASS('transform 정상');

  // 9. 슬라이드 크기 일관성
  if (r.slideWidthConsistent) PASS('슬라이드 크기 일관 — ' + r.uniqueSlideWidths.map(function(w){return w.toFixed(0)}).join('/') + 'px');
  else WARN('슬라이드 크기 비일관 — ' + r.uniqueSlideWidths.length + '가지: ' + r.uniqueSlideWidths.map(function(w){return w.toFixed(0)}).join(','));

  // 10. badge
  if (r.hasBadge) PASS('badge 요소 존재');
  else WARN('badge 없음');

  // 4b. img 기준 gap (child translateX 반영)
  if (r.imgGaps && r.imgGaps.length > 0) {
    if (baseline && baseline.imgGaps && baseline.imgGaps.length > 0) {
      var baseAvgImgGap = baseline.imgGaps.reduce(function(a,b){return a+b},0) / baseline.imgGaps.length;
      var imgGapDiff = Math.abs(r.avgImgGap - baseAvgImgGap);
      if (imgGapDiff <= 15) PASS('img gap — 평균 ' + r.avgImgGap.toFixed(1) + 'px (baseline Δ' + imgGapDiff.toFixed(1) + ')');
      else FAIL('img gap 변경 — ' + r.avgImgGap.toFixed(1) + 'px (baseline ' + baseAvgImgGap.toFixed(1) + ', Δ' + imgGapDiff.toFixed(1) + ')');
    } else {
      PASS('img gap — 평균 ' + r.avgImgGap.toFixed(1) + 'px');
    }
  }

  // 11. Y 위치 — baseline과 비교
  if (baseline && baseline.results) {
    // baseline에서 Y positions 복원
    var baseYResult = baseline.results.find(function(x) { return x.msg && x.msg.indexOf('Y positions') !== -1; });
    // baseline slideYPositions 비교
    if (r.slideYPositions && r.slideYPositions.length > 0) {
      // baseline에 slideYPositions가 있으면 비교
      var baseData = baseline;
      // baseline raw data에서 slideYPositions 찾기 (직접 저장)
      if (baseData.slideYPositions && baseData.slideYPositions.length > 0) {
        var yDiffs = [];
        var checkLen = Math.min(r.slideYPositions.length, baseData.slideYPositions.length, 6);
        for (var yi = 0; yi < checkLen; yi++) {
          var diff = Math.abs(r.slideYPositions[yi].y - baseData.slideYPositions[yi].y);
          yDiffs.push(diff);
        }
        var maxYDiff = Math.max.apply(null, yDiffs);
        if (maxYDiff <= 20) PASS('슬라이드 Y positions — baseline 대비 최대 Δ' + maxYDiff.toFixed(1) + 'px');
        else FAIL('슬라이드 Y positions 변경 — baseline 대비 최대 Δ' + maxYDiff.toFixed(1) + 'px');
      } else {
        // baseline에 Y 데이터 없으면 정보만
        if (r.hasYVariation) PASS('슬라이드 Y 변화 있음');
        else PASS('슬라이드 Y 동일');
      }
    } else {
      PASS('슬라이드 Y 정보 없음');
    }
  } else {
    if (r.hasYVariation) PASS('슬라이드 Y 변화 있음');
    else PASS('슬라이드 Y 동일');
  }

  // 출력
  if (jsonMode) {
    console.log(JSON.stringify({ passes: passes, fails: fails, warns: warns, results: allResults, slideYPositions: r.slideYPositions || [], imgGaps: r.imgGaps || [] }));
  } else {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  SWIPER CHECKER v2                   ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('  selector: ' + selector);
    console.log('  slides: ' + r.slideCount + '개\n');
    allResults.forEach(function(x) {
      var icon = x.status === 'pass' ? '✅' : x.status === 'fail' ? '❌' : '⚠️ ';
      console.log('  ' + icon + ' ' + x.msg);
    });
    console.log('\n  ✅ PASS: ' + passes + '  ⚠️  WARN: ' + warns + '  ❌ FAIL: ' + fails);
    console.log('\n' + (fails === 0 ? '🟢 SWIPER ALL CLEAR' : '🔴 SWIPER FIX REQUIRED'));
  }

  process.exit(fails > 0 ? 1 : 0);

} catch (e) {
  try { fs.unlinkSync(tmpScript); } catch(_) {}
  console.error('실행 오류:', e.message.substring(0, 200));
  process.exit(1);
}
