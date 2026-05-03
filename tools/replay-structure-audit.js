#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const batchMode = args.includes('--all-main-replays');
if ((!batchMode && args.length < 3) || (batchMode && args.length < 1)) {
  console.error('사용법: node tools/replay-structure-audit.js <url> <orig-selector> <replay-selector> [--json]');
  console.error('또는:   node tools/replay-structure-audit.js <url> --all-main-replays [--json]');
  process.exit(1);
}

const url = args[0];
const origSelector = batchMode ? null : args[1];
const replaySelector = batchMode ? null : args[2];

const DEFAULT_PAIRS = [
  ['.conmain', '.main_replay'],
  ['.con1', '.con1_replay'],
  ['.con2', '.con2_replay'],
  ['.con3', '.con3_replay'],
  ['.con4', '.con4_replay'],
  ['.con05', '.con5_replay'],
  ['.con06', '.con6_replay'],
  ['.con07', '.con7_replay'],
  ['.con08', '.con8_replay'],
  ['.con09', '.con9_replay'],
  ['.con10', '.con10_replay'],
  ['.con11', '.con11_replay'],
  ['.con12', '.con12_replay'],
  ['.con13', '.con13_replay'],
  ['.con14', '.con14_replay'],
  ['.con15', '.con15_replay'],
  ['.con16', '.con16_replay'],
  ['.con17', '.con17_replay'],
  ['.con18', '.con18_replay'],
  ['.con19', '.con19_replay']
];

function simplifySuspect(item) {
  return {
    cls: item.cls,
    tag: item.tag,
    width: item.width,
    marginLeft: item.marginLeft,
    whiteSpace: item.whiteSpace,
    text: item.text
  };
}

async function run() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1905, height: 1080 } });
  await page.goto(url);
  await page.waitForTimeout(1200);

  const pairs = batchMode ? DEFAULT_PAIRS : [[origSelector, replaySelector]];

  function summarize(result, origSelector, replaySelector) {
    return {
      pair: `${origSelector} vs ${replaySelector}`,
      deltas: {
        height: Number((result.replay.height - result.original.height).toFixed(2)),
        descendants: result.replay.descendants - result.original.descendants,
        images: result.replay.images - result.original.images,
        textLeaves: result.replay.textLeaves - result.original.textLeaves,
        absNodes: result.replay.absNodes - result.original.absNodes,
        relNodes: result.replay.relNodes - result.original.relNodes,
        swipers: result.replay.swipers - result.original.swipers,
        centeredParents: result.replay.centeredParents - result.original.centeredParents,
        leafTextWidthCount: result.replay.leafTextWidthCount - result.original.leafTextWidthCount,
        absOnlyContainers: result.replay.absOnlyContainers - result.original.absOnlyContainers,
        fakeSpacers: result.replay.fakeSpacers - result.original.fakeSpacers,
        centerMarginSuspects: result.replay.centerMarginSuspects - result.original.centerMarginSuspects
      },
      learnable: {
        originalHasFakeSpacerAntiPattern: result.original.fakeSpacers > 0,
        originalHasLeafWidthAntiPattern: result.original.leafTextWidthCount > 0,
        originalHasCenterMarginAntiPattern: result.original.centerMarginSuspects > 0
      }
    };
  }

  function printMetric(label, a, b) {
    console.log(`${label}: original=${a} replay=${b} delta=${b - a}`);
  }

  const results = [];
  for (const pair of pairs) {
    const result = await page.evaluate(({ origSelector, replaySelector }) => {
    function collect(selector) {
      const root = document.querySelector(selector);
      if (!root) return null;
      const rootRect = root.getBoundingClientRect();
      const nodes = Array.from(root.querySelectorAll('*'));

      function classList(el) {
        return Array.from(el.classList || []).filter(Boolean);
      }

      function normalizedClass(el) {
        return classList(el)
          .filter((c) => !['rltv', 'absol', 'zin', 'mf', 'ff', 'sf', 'tf'].includes(c))
          .join('.');
      }

      function isInlineOnly(el) {
        return Array.from(el.children).every((child) => /^(SPAN|B|STRONG|EM|I|SMALL|BR)$/.test(child.tagName));
      }

      function hasLeafText(el) {
        const directText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent || '')
          .join('')
          .replace(/\s+/g, ' ')
          .trim();
        if (directText.length >= 2) return true;
        return el.children.length > 0 && isInlineOnly(el) && el.textContent.replace(/\s+/g, ' ').trim().length >= 2;
      }

      function hasAuthorWidth(el) {
        if (el.style && (el.style.width || el.style.maxWidth || el.style.minWidth)) return true;
        for (const sheet of Array.from(document.styleSheets || [])) {
          let rules;
          try {
            rules = sheet.cssRules || [];
          } catch (err) {
            continue;
          }
          for (const rule of Array.from(rules)) {
            if (!rule.selectorText || !rule.style) continue;
            if (!rule.style.width && !rule.style.maxWidth && !rule.style.minWidth) continue;
            try {
              if (el.matches(rule.selectorText)) return true;
            } catch (err) {}
          }
        }
        return false;
      }

      function absOnlyContainer(el, cs) {
        if (cs.position !== 'relative') return false;
        const kids = Array.from(el.children);
        if (!kids.length) return false;
        const positionedKids = kids.filter((child) => getComputedStyle(child).position === 'absolute');
        if (!positionedKids.length || positionedKids.length !== kids.length) return false;
        if (parseFloat(cs.aspectRatio || '0') > 0) return false;
        if (parseFloat(cs.height) > 1) return false;
        if (parseFloat(cs.paddingBottom) > 1) return false;
        return true;
      }

      function fakeSpacer(el, cs) {
        if (parseFloat(cs.paddingBottom) <= 1) return false;
        if (parseFloat(cs.height) > 1) return false;
        const kids = Array.from(el.children);
        if (!kids.length) return false;
        const allAbs = kids.every((child) => getComputedStyle(child).position === 'absolute');
        if (!allAbs) return false;
        const hasVisual = (parseFloat(cs.borderTopWidth) + parseFloat(cs.borderRightWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth)) > 0
          || cs.backgroundImage !== 'none'
          || cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
        return !hasVisual;
      }

      function centerMarginSuspect(el, cs) {
        const parent = el.parentElement;
        if (!parent) return false;
        const pcs = getComputedStyle(parent);
        const centeredParent =
          (pcs.display === 'flex' || pcs.display === 'inline-flex') &&
          pcs.flexDirection === 'column' &&
          (pcs.alignItems === 'center' || pcs.justifyContent === 'center');
        if (!centeredParent) return false;
        if (parseFloat(cs.marginLeft) === 0) return false;
        return hasLeafText(el) || el.tagName === 'IMG' || el.querySelector('img');
      }

      const metrics = {
        selector,
        height: rootRect.height,
        descendants: nodes.length,
        images: 0,
        textLeaves: 0,
        absNodes: 0,
        relNodes: 0,
        swipers: 0,
        centeredParents: 0,
        leafTextWidthCount: 0,
        absOnlyContainers: 0,
        fakeSpacers: 0,
        centerMarginSuspects: 0,
        suspects: {
          leafTextWidth: [],
          fakeSpacers: [],
          centerMargin: [],
          absOnlyContainers: []
        }
      };

      nodes.forEach((el) => {
        const cs = getComputedStyle(el);
        const cls = normalizedClass(el);
        const text = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
        const base = {
          cls: cls || '(no-class)',
          tag: el.tagName.toLowerCase(),
          width: cs.width,
          marginLeft: cs.marginLeft,
          whiteSpace: cs.whiteSpace,
          text
        };

        if (el.tagName === 'IMG') metrics.images += 1;
        if (cs.position === 'absolute') metrics.absNodes += 1;
        if (cs.position === 'relative') metrics.relNodes += 1;
        if (classList(el).includes('swiper') || classList(el).includes('swiper-wrapper') || classList(el).includes('swiper-slide')) metrics.swipers += 1;
        if ((cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection === 'column' && cs.alignItems === 'center') metrics.centeredParents += 1;

        if (hasLeafText(el)) {
          metrics.textLeaves += 1;
          if (hasAuthorWidth(el)) {
            metrics.leafTextWidthCount += 1;
            metrics.suspects.leafTextWidth.push(base);
          }
        }

        if (absOnlyContainer(el, cs)) {
          metrics.absOnlyContainers += 1;
          metrics.suspects.absOnlyContainers.push(base);
        }

        if (fakeSpacer(el, cs)) {
          metrics.fakeSpacers += 1;
          metrics.suspects.fakeSpacers.push(base);
        }

        if (centerMarginSuspect(el, cs)) {
          metrics.centerMarginSuspects += 1;
          metrics.suspects.centerMargin.push(base);
        }
      });

      metrics.suspects.leafTextWidth = metrics.suspects.leafTextWidth.slice(0, 8);
      metrics.suspects.fakeSpacers = metrics.suspects.fakeSpacers.slice(0, 8);
      metrics.suspects.centerMargin = metrics.suspects.centerMargin.slice(0, 8);
      metrics.suspects.absOnlyContainers = metrics.suspects.absOnlyContainers.slice(0, 8);

      return metrics;
    }

    return {
      original: collect(origSelector),
      replay: collect(replaySelector)
    };
    }, { origSelector: pair[0], replaySelector: pair[1] });

    if (!result.original || !result.replay) {
      results.push({ pair: `${pair[0]} vs ${pair[1]}`, missing: true, original: !!result.original, replay: !!result.replay });
      continue;
    }
    results.push({
      summary: summarize(result, pair[0], pair[1]),
      original: result.original,
      replay: result.replay
    });
  }

  await browser.close();

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  results.forEach((entry) => {
    if (entry.missing) {
      console.log(`\n[${entry.pair}] missing original=${entry.original} replay=${entry.replay}`);
      return;
    }
    const { summary, original, replay } = entry;
    console.log(`\n[${summary.pair}]`);
    printMetric('height', original.height, replay.height);
    printMetric('descendants', original.descendants, replay.descendants);
    printMetric('images', original.images, replay.images);
    printMetric('textLeaves', original.textLeaves, replay.textLeaves);
    printMetric('absNodes', original.absNodes, replay.absNodes);
    printMetric('relNodes', original.relNodes, replay.relNodes);
    printMetric('swipers', original.swipers, replay.swipers);
    printMetric('centeredParents', original.centeredParents, replay.centeredParents);
    printMetric('leafTextWidthCount', original.leafTextWidthCount, replay.leafTextWidthCount);
    printMetric('absOnlyContainers', original.absOnlyContainers, replay.absOnlyContainers);
    printMetric('fakeSpacers', original.fakeSpacers, replay.fakeSpacers);
    printMetric('centerMarginSuspects', original.centerMarginSuspects, replay.centerMarginSuspects);
    console.log('learnable:', summary.learnable);

    console.log('\nReplay suspects:');
    console.log('- leafTextWidth:', replay.suspects.leafTextWidth.map(simplifySuspect));
    console.log('- fakeSpacers:', replay.suspects.fakeSpacers.map(simplifySuspect));
    console.log('- centerMargin:', replay.suspects.centerMargin.map(simplifySuspect));
    console.log('- absOnlyContainers:', replay.suspects.absOnlyContainers.map(simplifySuspect));
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
