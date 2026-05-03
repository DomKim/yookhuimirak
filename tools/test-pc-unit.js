#!/usr/bin/env node
/**
 * test-pc-unit.js — position-checker 유닛 테스트
 *
 * 일부러 틀린 좌표를 가진 테스트 HTML을 만들고,
 * position-checker가 정확히 FAIL/PASS 판정하는지 검증.
 *
 * 테스트 카테고리:
 *   A. 텍스트 X좌표 (정확 / 5px 오차 / 50px 오차)
 *   B. 이미지 X좌표 (정확 / 큰 오차)
 *   C. 이미지 width (원본 일치 / 불일치)
 *   D. center 정렬 텍스트 (X 스킵 여부)
 *   E. Swiper 내부 요소 (스킵 여부)
 *   F. 배경 이미지 (스킵 여부)
 *   G. DOM 미발견 텍스트 (WARN 여부)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const PORT = 9999;
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── 테스트 HTML 생성 ──
const testHtml = `<!DOCTYPE html>
<html><head><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  section { position:relative; width:1905px; }
  img { display:block; }
  .test-section { background:#fff; padding:50px 0; }
  /* A. 텍스트 정확한 위치 */
  .txt-exact { position:absolute; left:200px; top:100px; font-size:20px; }
  /* A2. 텍스트 5px 오차 */
  .txt-5off { position:absolute; left:205px; top:160px; font-size:20px; }
  /* A3. 텍스트 50px 오차 */
  .txt-50off { position:absolute; left:250px; top:220px; font-size:20px; }
  /* B. 이미지 정확 */
  .img-exact { position:absolute; left:400px; top:300px; width:100px; }
  /* B2. 이미지 큰 오차 */
  .img-off { position:absolute; left:700px; top:300px; width:100px; }
  /* D. center 정렬 */
  .txt-center { text-align:center; position:relative; margin-top:500px; font-size:30px; }
  /* E. Swiper 내부 */
  .swiper { position:relative; margin-top:50px; }
  .swiper-slide { display:inline-block; width:400px; }
  /* F. 배경 이미지 */
  .bg-img { position:absolute; top:0; left:0; width:100%; }
</style></head><body>
<section class="test-section">
  <div class="txt-exact">정확한텍스트여기있다</div>
  <div class="txt-5off">5픽셀오차텍스트</div>
  <div class="txt-50off">50픽셀오차텍스트</div>
  <div class="img-exact"><img src="/images/05_startup/con12_1.png"></div>
  <div class="img-off"><img src="/images/05_startup/con12_2.png"></div>
  <div class="txt-center">센터정렬텍스트확인용</div>
  <div class="swiper"><div class="swiper-wrapper">
    <div class="swiper-slide"><img src="/images/05_startup/con12_3.png"></div>
  </div></div>
  <div class="bg-img"><img src="/images/05_startup/con13_7.jpg"></div>
</section>
</body></html>`;

// ── 테스트 spec 생성 ──
const testSpec = {
  section: "test",
  canvas: 1905,
  sectionY: { top: 0, bottom: 800 },
  texts: [
    // A1: 정확 (x:200) → PASS 예상
    { name: "정확한텍스트여기있다", content: "정확한텍스트여기있다", x: 200, y: 100, w: 200, h: 20 },
    // A2: 5px 오차 (PSD x:200, 실제 205) → tolerance 5면 PASS
    { name: "5픽셀오차텍스트", content: "5픽셀오차텍스트", x: 200, y: 160, w: 150, h: 20 },
    // A3: 50px 오차 (PSD x:200, 실제 250) → FAIL 예상
    { name: "50픽셀오차텍스트", content: "50픽셀오차텍스트", x: 200, y: 220, w: 150, h: 20 },
    // D: center 정렬 → X 스킵, PASS 예상
    { name: "센터정렬텍스트확인용", content: "센터정렬텍스트확인용", x: 600, y: 500, w: 300, h: 30 },
    // G: DOM에 없는 텍스트 → WARN 예상
    { name: "존재하지않는텍스트", content: "존재하지않는텍스트", x: 100, y: 100, w: 100, h: 20 },
  ],
  images: [
    // B1: 정확 (x:400) → PASS
    { possibleFile: "con12_1.png", x: 400, y: 300, w: 100 },
    // B2: 큰 오차 (PSD x:400, 실제 700) → FAIL
    { possibleFile: "con12_2.png", x: 400, y: 300, w: 100 },
    // F: 배경 이미지 (w>1900) → 스킵 PASS
    { possibleFile: "con13_7.jpg", x: 0, y: 0, w: 1920 },
  ]
};

// ── 서버 시작 ──
const server = http.createServer(function(req, res) {
  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHtml);
  } else if (req.url.startsWith('/images/')) {
    // 실제 이미지 파일 서빙
    var imgPath = path.join(PROJECT_ROOT, req.url);
    if (fs.existsSync(imgPath)) {
      res.writeHead(200);
      res.end(fs.readFileSync(imgPath));
    } else {
      res.writeHead(404);
      res.end();
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, function() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  POSITION CHECKER 유닛 테스트             ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // spec 파일 임시 저장
  var specPath = path.join(PROJECT_ROOT, '_test_spec.json');
  fs.writeFileSync(specPath, JSON.stringify(testSpec));

  try {
    var output = execSync(
      'node tools/position-checker.js "' + specPath + '" "http://localhost:' + PORT + '/test" ".test-section" --tolerance 5 --json',
      { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_ROOT }
    );

    var result;
    try { result = JSON.parse(output.trim()); } catch(_) {
      console.log('JSON 파싱 실패. 원본 출력:');
      console.log(output);
      cleanup();
      return;
    }

    // ── 기대값 vs 실제 검증 ──
    var testCases = [
      // [검색어, 기대 status, 설명]
      { search: '정확한텍스트', expect: 'pass', desc: 'A1: 텍스트 X 정확 → PASS' },
      { search: '5픽셀오차', expect: 'pass', desc: 'A2: 텍스트 X 5px 오차 (tolerance 내) → PASS' },
      { search: '50픽셀오차', expect: 'fail', desc: 'A3: 텍스트 X 50px 오차 → FAIL' },
      { search: '센터정렬', expect: 'pass', desc: 'D: center 정렬 텍스트 X → PASS (스킵)' },
      { search: '존재하지않는', expect: 'warn', desc: 'G: DOM 미발견 텍스트 → WARN' },
      { search: 'con12_1.png X', expect: 'pass', desc: 'B1: 이미지 X 정확 → PASS' },
      { search: 'con12_2.png X', expect: 'fail', desc: 'B2: 이미지 X 큰 오차 → FAIL' },
      { search: 'con13_7.jpg', expect: 'pass', desc: 'F: 배경 이미지 → PASS (스킵)' },
    ];

    var unitPass = 0, unitFail = 0;

    testCases.forEach(function(tc) {
      var found = result.results.find(function(r) {
        return r.msg.indexOf(tc.search) !== -1;
      });

      if (!found) {
        console.log('  ❌ ' + tc.desc + ' — 결과에서 "' + tc.search + '" 미발견');
        unitFail++;
        return;
      }

      if (found.status === tc.expect) {
        console.log('  ✅ ' + tc.desc);
        unitPass++;
      } else {
        console.log('  ❌ ' + tc.desc + ' — 기대:' + tc.expect + ' 실제:' + found.status + ' (' + found.msg + ')');
        unitFail++;
      }
    });

    console.log('\n══════════════════════════════════════');
    console.log('  유닛 테스트: ✅ ' + unitPass + '  ❌ ' + unitFail + ' / ' + testCases.length + '개');
    console.log('══════════════════════════════════════');
    console.log(unitFail === 0 ? '\n🟢 ALL UNIT TESTS PASS' : '\n🔴 UNIT TEST FAIL');

  } catch (e) {
    console.log('실행 오류:', e.stdout || e.message);
  }

  cleanup();
});

function cleanup() {
  try { fs.unlinkSync(path.join(PROJECT_ROOT, '_test_spec.json')); } catch(_) {}
  server.close();
}
