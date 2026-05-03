#!/usr/bin/env node
/**
 * test-position-checker.js
 * position-checker 자체 검증 — 모든 페이지 × 모든 섹션 자동 실행
 *
 * 사용법: node tools/test-position-checker.js
 *
 * 모든 spec 파일을 찾아서 해당 페이지에 대해 position-checker 실행
 * 결과를 섹션별로 집계하여 리포트
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'http://localhost:8080';

// 페이지별 URL 매핑
const PAGE_URLS = {
  franchise: BASE_URL + '/bbs/content.php?co_id=franchise',
  virtualoffice: BASE_URL + '/bbs/content.php?co_id=virtualoffice',
  brand: BASE_URL + '/bbs/content.php?co_id=brand',
  shop: BASE_URL + '/bbs/content.php?co_id=shop',
  main: BASE_URL + '/',
};

// 페이지별 섹션 selector 프리픽스
const PAGE_PREFIXES = {
  franchise: '.fr-',
  virtualoffice: '.vo-',
  brand: '.br-',
  shop: '.sh-',
  main: '.mn-',
};

// spec 파일 수집
const specDir = path.join(PROJECT_ROOT, 'psd');
const allSpecs = [];

// franchise specs
fs.readdirSync(specDir).filter(f => f.startsWith('spec_franchise_') && f.endsWith('.json')).forEach(f => {
  const section = f.replace('spec_franchise_', '').replace('.json', '');
  // sm → submain 매핑
  var mappedSection = section === 'sm' ? 'submain' : section;
  allSpecs.push({ page: 'franchise', section: mappedSection, spec: path.join(specDir, f) });
});

// virtualoffice specs (spec_con01~11)
fs.readdirSync(specDir).filter(f => /^spec_con\d+\.json$/.test(f)).forEach(f => {
  const section = f.replace('spec_', '').replace('.json', '');
  allSpecs.push({ page: 'virtualoffice', section: section, spec: path.join(specDir, f) });
});

console.log('╔══════════════════════════════════════════════╗');
console.log('║  POSITION CHECKER — 전체 검증 리포트          ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('총 ' + allSpecs.length + '개 섹션 검증\n');

let totalPass = 0, totalFail = 0, totalWarn = 0;
const sectionResults = [];

allSpecs.forEach(function(item) {
  const url = PAGE_URLS[item.page];
  const selector = PAGE_PREFIXES[item.page] + item.section;
  const label = item.page + '/' + item.section;

  try {
    const output = execSync(
      'node "' + path.join(PROJECT_ROOT, 'tools', 'position-checker.js') + '" ' +
      '"' + item.spec + '" ' +
      '"' + url + '" ' +
      '"' + selector + '" ' +
      '--tolerance 5 --json',
      { encoding: 'utf-8', timeout: 30000, cwd: PROJECT_ROOT }
    );

    const result = JSON.parse(output.trim());
    totalPass += result.passes;
    totalFail += result.fails;
    totalWarn += result.warns;

    const status = result.fails === 0 ? '✅' : '❌';
    sectionResults.push({
      label: label,
      status: status,
      passes: result.passes,
      fails: result.fails,
      warns: result.warns,
      failDetails: result.results.filter(r => r.status === 'fail').map(r => r.msg)
    });

    console.log(status + ' ' + label.padEnd(25) + ' P:' + result.passes + ' F:' + result.fails + ' W:' + result.warns);

  } catch (e) {
    const stdout = e.stdout || '';
    try {
      const result = JSON.parse(stdout.trim());
      totalPass += result.passes;
      totalFail += result.fails;
      totalWarn += result.warns;
      const status = '❌';
      sectionResults.push({
        label: label,
        status: status,
        passes: result.passes,
        fails: result.fails,
        warns: result.warns,
        failDetails: result.results.filter(r => r.status === 'fail').map(r => r.msg)
      });
      console.log(status + ' ' + label.padEnd(25) + ' P:' + result.passes + ' F:' + result.fails + ' W:' + result.warns);
    } catch (_) {
      totalFail++;
      sectionResults.push({ label: label, status: '💀', passes: 0, fails: 1, warns: 0, failDetails: ['실행 오류'] });
      console.log('💀 ' + label.padEnd(25) + ' 실행 오류');
    }
  }
});

// 결과 리포트
console.log('\n══════════════════════════════════════════');
console.log('  총 ✅ PASS: ' + totalPass + '  ❌ FAIL: ' + totalFail + '  ⚠️  WARN: ' + totalWarn);
console.log('══════════════════════════════════════════');

// FAIL 상세
const failSections = sectionResults.filter(s => s.fails > 0);
if (failSections.length > 0) {
  console.log('\n❌ FAIL 상세:');
  failSections.forEach(function(s) {
    console.log('\n  [' + s.label + '] ' + s.fails + '개 FAIL:');
    s.failDetails.forEach(function(d) {
      console.log('    - ' + d);
    });
  });
}

console.log('\n' + (totalFail === 0 ? '🟢 ALL SECTIONS PASS' : '🔴 ' + failSections.length + '/' + allSpecs.length + ' SECTIONS HAVE FAILS'));
process.exit(totalFail > 0 ? 1 : 0);
