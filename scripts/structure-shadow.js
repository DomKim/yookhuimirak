#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

let sharp;
try {
  sharp = require("sharp");
} catch (error) {
  console.error("[structure-shadow] sharp is required.");
  console.error(error.message);
  process.exit(2);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function usage() {
  console.error(
    [
      "Usage:",
      "  node scripts/structure-shadow.js --spec <spec.json> [--plan <plan.json>] [--image-analysis <image-analysis.json>] [--reference-image <png>] [--out <json>]",
      "",
      "Notes:",
      "  - This script is shadow-mode only. It does not mutate plan/spec files.",
      "  - If --reference-image is omitted, it will try common reference filenames next to the spec file.",
    ].join("\n"),
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`);
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function area(node) {
  return Math.max(0, (node.w || 0) * (node.h || 0));
}

function right(node) {
  return (node.x || 0) + (node.w || 0);
}

function bottom(node) {
  return (node.y || 0) + (node.h || 0);
}

function center(node) {
  return {
    x: (node.x || 0) + (node.w || 0) / 2,
    y: (node.y || 0) + (node.h || 0) / 2,
  };
}

function intersectionArea(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(right(a), right(b));
  const y2 = Math.min(bottom(a), bottom(b));
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

function overlapRatio(inner, outer) {
  const innerArea = area(inner);
  if (!innerArea) return 0;
  return intersectionArea(inner, outer) / innerArea;
}

function centerInside(outer, inner) {
  const c = center(inner);
  return c.x >= outer.x && c.x <= right(outer) && c.y >= outer.y && c.y <= bottom(outer);
}

function touchesEdge(node, outer, margin) {
  return (
    node.x <= outer.x + margin ||
    right(node) >= right(outer) - margin ||
    node.y <= outer.y + margin ||
    bottom(node) >= bottom(outer) - margin
  );
}

function colorDistance(a, b) {
  return Math.max(
    Math.abs((a.r || 0) - (b.r || 0)),
    Math.abs((a.g || 0) - (b.g || 0)),
    Math.abs((a.b || 0) - (b.b || 0)),
  );
}

function normalizeFileKey(value) {
  const base = path.basename(value || "").toLowerCase();
  const parts = base.match(/[a-z]+|\d+/g);
  if (!parts) return base;
  return parts.map((part) => (/^\d+$/.test(part) ? String(Number(part)) : part)).join("-");
}

function buildImageAnalysisIndex(imageAnalysis) {
  const map = new Map();
  for (const item of imageAnalysis?.images || []) {
    map.set(normalizeFileKey(item.file), item);
  }
  return map;
}

function resolveReferenceImage(specPath, explicitPath) {
  if (explicitPath) return path.resolve(explicitPath);
  const dir = path.dirname(specPath);
  const candidates = [
    "reference.png",
    "reference.jpg",
    "reference.jpeg",
    "design-reference.png",
    "design-reference.jpg",
    "section-reference.png",
    "section-reference.jpg",
    "reference-render.png",
  ];
  for (const file of candidates) {
    const target = path.join(dir, file);
    if (fs.existsSync(target)) return target;
  }
  return null;
}

async function readReferenceImage(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const image = sharp(filePath).removeAlpha().ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return {
    file: filePath,
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

function getPixel(ref, x, y) {
  const clampedX = clamp(Math.round(x), 0, ref.width - 1);
  const clampedY = clamp(Math.round(y), 0, ref.height - 1);
  const index = (clampedY * ref.width + clampedX) * ref.channels;
  return {
    r: ref.data[index],
    g: ref.data[index + 1],
    b: ref.data[index + 2],
    a: ref.data[index + 3],
  };
}

function averagePixels(pixels) {
  if (!pixels.length) return null;
  const total = pixels.reduce(
    (acc, pixel) => {
      acc.r += pixel.r;
      acc.g += pixel.g;
      acc.b += pixel.b;
      acc.a += pixel.a;
      return acc;
    },
    { r: 0, g: 0, b: 0, a: 0 },
  );
  return {
    r: Math.round(total.r / pixels.length),
    g: Math.round(total.g / pixels.length),
    b: Math.round(total.b / pixels.length),
    a: Math.round(total.a / pixels.length),
  };
}

function sampleBox(ref, x, y, w, h) {
  const pixels = [];
  const xStart = clamp(Math.floor(x), 0, ref.width - 1);
  const yStart = clamp(Math.floor(y), 0, ref.height - 1);
  const xEnd = clamp(Math.ceil(x + w), 0, ref.width);
  const yEnd = clamp(Math.ceil(y + h), 0, ref.height);
  if (xEnd <= xStart || yEnd <= yStart) return null;
  for (let yy = yStart; yy < yEnd; yy += 1) {
    for (let xx = xStart; xx < xEnd; xx += 1) {
      pixels.push(getPixel(ref, xx, yy));
    }
  }
  const average = averagePixels(pixels);
  if (!average) return null;
  const spread = pixels.reduce((max, pixel) => Math.max(max, colorDistance(pixel, average)), 0);
  return { average, spread };
}

function sampleReferenceSignal(ref, sectionRect, panel) {
  if (!ref) return null;
  const scaleX = ref.width / sectionRect.w;
  const scaleY = ref.height / sectionRect.h;
  const panelBox = {
    x: (panel.x - sectionRect.x) * scaleX,
    y: (panel.y - sectionRect.y) * scaleY,
    w: panel.w * scaleX,
    h: panel.h * scaleY,
  };

  if (panelBox.w < 20 || panelBox.h < 20) return null;

  const interiorCandidates = [];
  const patchW = panelBox.w * 0.16;
  const patchH = panelBox.h * 0.12;
  const xAnchors = [0.18, 0.42, 0.66];
  const yAnchors = [0.14, 0.3, 0.5, 0.68];
  for (const xRatio of xAnchors) {
    for (const yRatio of yAnchors) {
      const sample = sampleBox(
        ref,
        panelBox.x + panelBox.w * xRatio,
        panelBox.y + panelBox.h * yRatio,
        patchW,
        patchH,
      );
      if (sample) interiorCandidates.push(sample);
    }
  }
  const interior = interiorCandidates.sort((a, b) => a.spread - b.spread)[0] || null;
  if (!interior) return null;

  const outsideSamples = [];
  const outsideBoxes = [
    {
      x: panelBox.x - panelBox.w * 0.06,
      y: panelBox.y + panelBox.h * 0.35,
      w: panelBox.w * 0.04,
      h: panelBox.h * 0.25,
    },
    {
      x: panelBox.x + panelBox.w * 1.02,
      y: panelBox.y + panelBox.h * 0.35,
      w: panelBox.w * 0.04,
      h: panelBox.h * 0.25,
    },
    {
      x: panelBox.x + panelBox.w * 0.35,
      y: panelBox.y - panelBox.h * 0.05,
      w: panelBox.w * 0.3,
      h: panelBox.h * 0.03,
    },
  ];
  for (const box of outsideBoxes) {
    const sample = sampleBox(ref, box.x, box.y, box.w, box.h);
    if (sample) outsideSamples.push(sample.average);
  }

  const radiusPx = Math.min(panelBox.w, panelBox.h) * (panel.borderRadius || 0) / Math.min(panel.w, panel.h);
  const cornerOuter = sampleBox(ref, panelBox.x + 1, panelBox.y + 1, 6, 6);
  const cornerInner = sampleBox(
    ref,
    panelBox.x + Math.max(8, radiusPx * 0.6),
    panelBox.y + Math.max(8, radiusPx * 0.6),
    8,
    8,
  );

  const outsideContrast = outsideSamples.length
    ? Math.max(...outsideSamples.map((sample) => colorDistance(sample, interior.average)))
    : 0;
  const cornerOuterDiff = cornerOuter ? colorDistance(cornerOuter.average, interior.average) : 0;
  const cornerInnerDiff = cornerInner ? colorDistance(cornerInner.average, interior.average) : 255;

  let score = 0;
  if (interior.spread <= 10) score += 6;
  else if (interior.spread <= 18) score += 3;
  if (outsideContrast >= 16) score += 6;
  else if (outsideContrast >= 10) score += 3;
  if (cornerOuterDiff >= 16 && cornerInnerDiff <= 12) score += 4;
  else if (cornerOuterDiff >= 10 && cornerInnerDiff <= 18) score += 2;

  return {
    available: true,
    interiorSpread: round(interior.spread, 2),
    outsideContrast: round(outsideContrast, 2),
    cornerOuterDiff: round(cornerOuterDiff, 2),
    cornerInnerDiff: round(cornerInnerDiff, 2),
    score,
  };
}

function buildSectionRect(spec) {
  const nodes = [
    ...(spec.rects || []),
    ...(spec.texts || []),
    ...(spec.images || []),
    ...(spec.bgRect ? [spec.bgRect] : []),
  ];
  const top = typeof spec.sectionY === "number" ? spec.sectionY : Math.min(...nodes.map((node) => node.y || 0));
  const maxBottom = Math.max(...nodes.map((node) => bottom(node)));
  return {
    x: 0,
    y: top,
    w: spec.canvas,
    h: Math.max(1, maxBottom - top),
  };
}

function classifyTexts(spec, sectionRect) {
  const counts = new Map();
  for (const text of spec.texts || []) {
    const key = String(text.content || "").trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return (spec.texts || []).map((text) => {
    const content = String(text.content || "").trim();
    const fontSize = Number(text.segments?.[0]?.fontSize_px || 0);
    const repeated = counts.get(content) > 1;
    const big = area(text) / area(sectionRect) > 0.025 || fontSize >= 120;
    const edge = touchesEdge(text, sectionRect, sectionRect.w * 0.05);
    const decorative = (repeated && edge) || (big && edge && content.length <= 3);
    return {
      ...text,
      nodeType: "text",
      role: decorative ? "decorative" : "live",
      repeated,
      fontSize,
    };
  });
}

function classifyRects(spec, sectionRect) {
  return (spec.rects || []).map((rect) => {
    const ratio = area(rect) / area(sectionRect);
    let role = "decorative";
    if (rect.borderRadius > 0 && ratio >= 0.15 && ratio <= 0.9) role = "candidate-panel";
    else if (ratio <= 0.22) role = "structural-child";
    return {
      ...rect,
      nodeType: "rect",
      role,
    };
  });
}

function classifyImages(spec, sectionRect, imageIndex) {
  return (spec.images || []).map((image) => {
    const ratio = area(image) / area(sectionRect);
    const fileKey = normalizeFileKey(image.possibleFile || "");
    const analysis = imageIndex.get(fileKey) || null;
    const clip = image.clippingRect;
    const sourceType = analysis?.sourceType || "";
    const clipMismatch =
      clip &&
      (
        image.w > clip.w * 1.15 ||
        image.h > clip.h * 1.15 ||
        Math.abs(image.x - clip.x) > 20 ||
        Math.abs(image.y - clip.y) > 20
      );
    const background =
      ratio >= 0.35 ||
      fileKey.includes("bg") ||
      sourceType.includes("소스") ||
      (
        clip &&
        !clipMismatch &&
        clip.w >= sectionRect.w * 0.45 &&
        clip.h >= sectionRect.h * 0.45 &&
        ratio >= 0.2
      );
    const sideEdge =
      image.x <= sectionRect.x + sectionRect.w * 0.03 ||
      right(image) >= right(sectionRect) - sectionRect.w * 0.03;
    const decorative = !background && sideEdge && ratio >= 0.05;
    const role = background ? "background" : decorative ? "decorative" : "live";
    return {
      ...image,
      nodeType: "image",
      role,
      fileKey,
      analysis,
      clipMismatch,
    };
  });
}

function scorePanelCandidate(panel, nodes, sectionRect, refSignal) {
  let score = 0;
  const reasons = [];
  const ratio = area(panel) / area(sectionRect);
  if (panel.borderRadius > 0) {
    score += 18;
    reasons.push("rounded-rect");
  }
  if (panel.fill) {
    score += 10;
    reasons.push("filled-panel");
  }
  if (ratio >= 0.2 && ratio <= 0.8) {
    score += 18;
    reasons.push("panel-area-range");
  } else if (ratio >= 0.12 && ratio <= 0.9) {
    score += 8;
  }
  if (!touchesEdge(panel, sectionRect, 4)) {
    score += 8;
    reasons.push("inset-from-section-edge");
  }

  const insideTexts = nodes.texts.filter((node) => node.role === "live" && overlapRatio(node, panel) >= 0.75);
  const insideRects = nodes.rects.filter(
    (node) =>
      node.name !== panel.name &&
      node.role === "structural-child" &&
      overlapRatio(node, panel) >= 0.85 &&
      area(node) < area(panel) * 0.45,
  );
  const insideImages = nodes.images.filter(
    (node) =>
      node.role === "live" &&
      (overlapRatio(node, panel) >= 0.6 || centerInside(panel, node)) &&
      area(node) < area(panel) * 0.6,
  );

  if (insideTexts.length) {
    score += Math.min(18, insideTexts.length * 5);
    reasons.push(`inside-live-texts:${insideTexts.length}`);
  }
  if (insideRects.length) {
    score += Math.min(14, insideRects.length * 4);
    reasons.push(`inside-structural-children:${insideRects.length}`);
  }
  if (insideImages.length) {
    score += Math.min(12, insideImages.length * 4);
    reasons.push(`inside-live-images:${insideImages.length}`);
  }
  if (insideTexts.length >= 2 && insideRects.length + insideImages.length >= 2) {
    score += 10;
    reasons.push("mixed-live-content");
  }

  if (refSignal?.available) {
    score += refSignal.score;
    reasons.push(`reference-signal:${refSignal.score}`);
  }

  return {
    score,
    confidence: clamp(round(score / 100, 4), 0, 1),
    reasons,
    insideTexts,
    insideRects,
    insideImages,
    referenceSignal: refSignal || null,
  };
}

function clusterFlowNodes(nodes, panel) {
  if (!nodes.length) return [];
  const threshold = Math.max(18, panel.h * 0.035);
  const sorted = [...nodes].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const clusters = [];

  for (const node of sorted) {
    const current = clusters[clusters.length - 1];
    if (!current) {
      clusters.push({
        y: node.y,
        bottom: bottom(node),
        items: [node],
      });
      continue;
    }
    const currentHasRects = current.items.some((item) => item.nodeType === "rect");
    const currentOnlyText = current.items.every((item) => item.nodeType === "text");
    const nextLargeImage = node.nodeType === "image" && node.h >= panel.h * 0.18;
    const shouldSplit =
      (currentOnlyText && node.nodeType !== "text" && node.y > current.bottom + Math.max(18, threshold)) ||
      (currentHasRects && nextLargeImage && node.y > current.bottom + 18);

    if (!shouldSplit && node.y <= current.bottom + threshold) {
      current.items.push(node);
      current.y = Math.min(current.y, node.y);
      current.bottom = Math.max(current.bottom, bottom(node));
    } else {
      clusters.push({
        y: node.y,
        bottom: bottom(node),
        items: [node],
      });
    }
  }

  return clusters.map((cluster, index) => {
    const names = cluster.items.map((item) => item.name);
    const rectCount = cluster.items.filter((item) => item.nodeType === "rect").length;
    const imageCount = cluster.items.filter((item) => item.nodeType === "image").length;
    const label =
      rectCount >= 2 ? "card-row" :
      imageCount >= 1 && cluster.items.length <= 2 ? "image-block" :
      "text-block";
    return {
      index,
      label,
      y: cluster.y,
      bottom: cluster.bottom,
      names,
    };
  });
}

function detectClipNeed(panel, ownedNodes) {
  const offenders = [];
  for (const node of ownedNodes) {
    if (node.nodeType !== "image") continue;
    const overflow = {
      left: Math.max(0, panel.x - node.x),
      right: Math.max(0, right(node) - right(panel)),
      top: Math.max(0, panel.y - node.y),
      bottom: Math.max(0, bottom(node) - bottom(panel)),
    };
    if (overflow.left || overflow.right || overflow.top || overflow.bottom) {
      offenders.push({
        name: node.name,
        overflow,
      });
    }
  }
  const confidence = offenders.length ? 0.92 : 0.18;
  return {
    candidate: offenders.length > 0,
    confidence,
    offenders,
  };
}

function analyzePlan(plan, recommendation) {
  if (!plan) return [];
  const warnings = [];
  const ascii = String(plan.ascii || "");
  const panelAbsolute = /panel[^\n]*absol/i.test(ascii);
  const overflowMentioned = /ov hidden|overflow:hidden|overflow hidden/i.test(ascii);
  const combinedOffset = recommendation.outerOffsetTop + recommendation.innerOffsetTop;

  if (panelAbsolute && recommendation.confidence >= 0.75) {
    warnings.push({
      kind: "panel-ownership-mismatch",
      message: "plan ascii suggests an absolute panel while inferred model expects the panel to own live flow children",
    });
  }

  if (recommendation.clipsChildren.candidate && !overflowMentioned) {
    warnings.push({
      kind: "clip-missing",
      message: "plan ascii does not mention overflow-hidden even though a panel child overhangs the inferred panel bounds",
    });
  }

  if (typeof plan.pt === "number") {
    const looksCombined =
      Math.abs(plan.pt - combinedOffset) <= 24 &&
      Math.abs(plan.pt - recommendation.outerOffsetTop) >= 28;
    if (looksCombined) {
      warnings.push({
        kind: "combined-top-offset",
        message: "plan pt appears to combine section->panel and panel->first-flow offsets; consider splitting them",
      });
    }
  }

  return warnings;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.spec) {
    usage();
    process.exit(1);
  }

  const specPath = path.resolve(args.spec);
  const planPath = args.plan ? path.resolve(args.plan) : null;
  const imageAnalysisPath = args["image-analysis"] ? path.resolve(args["image-analysis"]) : null;
  const outPath = args.out ? path.resolve(args.out) : null;
  const spec = readJson(specPath);
  const plan = planPath && fs.existsSync(planPath) ? readJson(planPath) : null;
  const imageAnalysis = imageAnalysisPath && fs.existsSync(imageAnalysisPath) ? readJson(imageAnalysisPath) : null;
  const imageIndex = buildImageAnalysisIndex(imageAnalysis);
  const sectionRect = buildSectionRect(spec);
  const referenceImagePath = resolveReferenceImage(specPath, args["reference-image"]);
  const reference = await readReferenceImage(referenceImagePath);

  const nodes = {
    texts: classifyTexts(spec, sectionRect),
    rects: classifyRects(spec, sectionRect),
    images: classifyImages(spec, sectionRect, imageIndex),
  };

  const panelCandidates = nodes.rects
    .filter((node) => node.role === "candidate-panel")
    .map((panel) => {
      const refSignal = sampleReferenceSignal(reference, sectionRect, panel);
      const score = scorePanelCandidate(panel, nodes, sectionRect, refSignal);
      return {
        name: panel.name,
        x: panel.x,
        y: panel.y,
        w: panel.w,
        h: panel.h,
        fill: panel.fill,
        borderRadius: panel.borderRadius,
        score: score.score,
        confidence: score.confidence,
        reasons: score.reasons,
        referenceSignal: score.referenceSignal,
        insideTexts: score.insideTexts.map((node) => node.name),
        insideRects: score.insideRects.map((node) => node.name),
        insideImages: score.insideImages.map((node) => node.name),
      };
    })
    .sort((a, b) => b.score - a.score);

  const bestPanel = panelCandidates[0] || null;
  if (!bestPanel) {
    console.error("[structure-shadow] no panel candidate found");
    process.exit(1);
  }

  const ownedNodes = [
    ...nodes.texts.filter((node) => node.role === "live" && overlapRatio(node, bestPanel) >= 0.75),
    ...nodes.rects.filter(
      (node) =>
        node.name !== bestPanel.name &&
        node.role === "structural-child" &&
        overlapRatio(node, bestPanel) >= 0.85 &&
        area(node) < area(bestPanel) * 0.45,
    ),
    ...nodes.images.filter(
      (node) =>
        node.role === "live" &&
        (overlapRatio(node, bestPanel) >= 0.6 || centerInside(bestPanel, node)) &&
        area(node) < area(bestPanel) * 0.6,
    ),
  ].sort((a, b) => (a.y - b.y) || (a.x - b.x));

  const flowClusters = clusterFlowNodes(ownedNodes, bestPanel);
  const clipsChildren = detectClipNeed(bestPanel, ownedNodes);
  const innerTop = flowClusters.length ? flowClusters[0].y - bestPanel.y : 0;
  const recommendation = {
    structureModel: "panel-owned-flow",
    confidence: bestPanel.confidence,
    panelName: bestPanel.name,
    panelRect: {
      x: bestPanel.x,
      y: bestPanel.y,
      w: bestPanel.w,
      h: bestPanel.h,
    },
    outerOffsetTop: bestPanel.y - sectionRect.y,
    innerOffsetTop: innerTop,
    ownedNodes: ownedNodes.map((node) => ({
      name: node.name,
      type: node.nodeType,
      role: node.role,
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h,
    })),
    decorativeNodes: [
      ...nodes.texts.filter((node) => node.role === "decorative"),
      ...nodes.images.filter((node) => node.role === "decorative" || node.role === "background"),
    ].map((node) => node.name),
    flowClusters,
    clipsChildren,
  };

  const planWarnings = analyzePlan(plan, recommendation);
  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    section: spec.section,
    specFile: specPath,
    planFile: planPath,
    imageAnalysisFile: imageAnalysisPath,
    referenceImage: reference?.file || null,
    sectionRect,
    panelCandidates,
    recommendation,
    planWarnings,
  };

  if (outPath) writeJson(outPath, report);

  console.log(
    `[structure-shadow] ${recommendation.structureModel} confidence=${round(recommendation.confidence, 3)} panel=${recommendation.panelName}`,
  );
  console.log(
    `[structure-shadow] offsets outer=${recommendation.outerOffsetTop}px inner=${recommendation.innerOffsetTop}px clips=${recommendation.clipsChildren.candidate ? "yes" : "no"}`,
  );
  if (reference?.file) {
    console.log(`[structure-shadow] reference=${reference.file}`);
  }
  if (planWarnings.length) {
    console.log(`[structure-shadow] plan warnings=${planWarnings.length}`);
    for (const item of planWarnings) {
      console.log(`  - ${item.kind}: ${item.message}`);
    }
  }
}

main().catch((error) => {
  console.error("[structure-shadow] failed");
  console.error(error.stack || error.message);
  process.exit(1);
});
