#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const agPsd = require("ag-psd");

let createCanvas;
try {
  ({ createCanvas } = require("@napi-rs/canvas"));
  agPsd.initializeCanvas(createCanvas);
} catch (error) {
  console.error("[psd-stroke-guard] @napi-rs/canvas is required.");
  console.error(error.message);
  process.exit(2);
}

const MAX_BORDER_SCAN = 8;
const MIN_ALPHA = 180;
const MIN_COLOR_DIFF = 12;
const MAX_COLOR_SPREAD = 14;
const SAMPLE_POSITIONS = [0.2, 0.5, 0.8];

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
      "  node scripts/psd-stroke-guard.js --psd <psd> [--parsed <parsed.json>] [--spec <spec.json>] [--write] [--strict]",
      "",
      "Examples:",
      "  node scripts/psd-stroke-guard.js --psd psd/original/foo.psd --parsed .planning/foo/parsed.json --write --strict",
      "  node scripts/psd-stroke-guard.js --psd psd/original/foo.psd --spec .planning/foo/spec.json --write --strict",
    ].join("\n"),
  );
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function colorDistance(a, b) {
  return Math.max(
    Math.abs(a.r - b.r),
    Math.abs(a.g - b.g),
    Math.abs(a.b - b.b),
  );
}

function averageColor(colors) {
  const total = colors.reduce(
    (acc, color) => {
      acc.r += color.r;
      acc.g += color.g;
      acc.b += color.b;
      acc.a += color.a || 255;
      return acc;
    },
    { r: 0, g: 0, b: 0, a: 0 },
  );

  return {
    r: Math.round(total.r / colors.length),
    g: Math.round(total.g / colors.length),
    b: Math.round(total.b / colors.length),
    a: Math.round(total.a / colors.length),
  };
}

function rgbToHex(color) {
  const toHex = (value) => value.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function getPixel(data, width, x, y) {
  const index = (y * width + x) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  };
}

function findOpaqueBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0 || maxY < 0) return null;
  return { minX, minY, maxX, maxY };
}

function getScan(data, width, height, bounds, side, position) {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const pixels = [];

  if (side === "top" || side === "bottom") {
    const x = clamp(
      Math.round(bounds.minX + spanX * position),
      bounds.minX,
      bounds.maxX,
    );
    const start = side === "top" ? bounds.minY : bounds.maxY;
    const step = side === "top" ? 1 : -1;
    const limit = clamp(start + step * MAX_BORDER_SCAN, 0, height - 1);

    for (
      let y = start;
      step > 0 ? y <= limit : y >= limit;
      y += step
    ) {
      pixels.push(getPixel(data, width, x, y));
    }
  } else {
    const y = clamp(
      Math.round(bounds.minY + spanY * position),
      bounds.minY,
      bounds.maxY,
    );
    const start = side === "left" ? bounds.minX : bounds.maxX;
    const step = side === "left" ? 1 : -1;
    const limit = clamp(start + step * MAX_BORDER_SCAN, 0, width - 1);

    for (
      let x = start;
      step > 0 ? x <= limit : x >= limit;
      x += step
    ) {
      pixels.push(getPixel(data, width, x, y));
    }
  }

  return pixels.filter((pixel) => pixel.a > 0);
}

function getInnerReference(scan, fillHint) {
  if (fillHint) return fillHint;
  const window = scan.slice(Math.min(3, scan.length - 1), Math.min(7, scan.length));
  if (!window.length) return null;

  const average = averageColor(window);
  const unstable = window.some((pixel) => colorDistance(pixel, average) > MAX_COLOR_SPREAD);
  if (unstable) return null;
  return average;
}

function measureStrokeRun(scan, fillHint) {
  if (scan.length < 2) return { kind: "none" };
  const opaque = scan.filter((pixel) => pixel.a >= MIN_ALPHA);
  if (opaque.length < 2) return { kind: "none" };

  const inner = getInnerReference(opaque, fillHint);
  if (!inner) return { kind: "ambiguous", reason: "unstable-inner" };

  if (colorDistance(opaque[0], inner) < MIN_COLOR_DIFF) {
    return { kind: "none" };
  }

  const borderPixels = [];
  for (const pixel of opaque.slice(0, MAX_BORDER_SCAN)) {
    if (colorDistance(pixel, inner) >= MIN_COLOR_DIFF) {
      borderPixels.push(pixel);
      continue;
    }
    break;
  }

  if (!borderPixels.length) return { kind: "ambiguous", reason: "missing-border-run" };

  const next = opaque[borderPixels.length];
  if (next && colorDistance(next, inner) >= MIN_COLOR_DIFF) {
    return { kind: "ambiguous", reason: "border-too-wide-or-unstable" };
  }

  const average = averageColor(borderPixels);
  return {
    kind: "stroke",
    width: borderPixels.length,
    color: average,
    opacity: round(average.a / 255, 4),
  };
}

function collectVisualCandidate(layer, pathParts) {
  if (!layer.canvas) return null;

  const ctx = layer.canvas.getContext("2d");
  const width = layer.canvas.width;
  const height = layer.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const bounds = findOpaqueBounds(imageData.data, width, height);

  if (!bounds) return null;

  const fillHint =
    layer.vectorFill &&
    layer.vectorFill.type === "color" &&
    layer.vectorFill.color
      ? {
          r: Math.round(layer.vectorFill.color.r),
          g: Math.round(layer.vectorFill.color.g),
          b: Math.round(layer.vectorFill.color.b),
          a: 255,
        }
      : null;

  const detections = [];
  const ambiguities = [];
  for (const side of ["top", "bottom", "left", "right"]) {
    for (const position of SAMPLE_POSITIONS) {
      const scan = getScan(imageData.data, width, height, bounds, side, position);
      const result = measureStrokeRun(scan, fillHint);
      if (result.kind === "stroke") {
        detections.push({ ...result, side });
      } else if (result.kind === "ambiguous") {
        ambiguities.push({ side, position, reason: result.reason });
      }
    }
  }

  if (!detections.length) return null;

  const widthCounts = new Map();
  for (const item of detections) {
    widthCounts.set(item.width, (widthCounts.get(item.width) || 0) + 1);
  }
  const preferredWidth = [...widthCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const preferred = detections.filter((item) => item.width === preferredWidth);
  const uniqueSides = new Set(preferred.map((item) => item.side));

  const colorAverage = averageColor(preferred.map((item) => item.color));
  const spread = Math.max(
    ...preferred.map((item) => colorDistance(item.color, colorAverage)),
  );

  if (uniqueSides.size < 2 || spread > MAX_COLOR_SPREAD) {
    return {
      ambiguous: true,
      key: makeKey(
        layer.name,
        layer.left,
        layer.top,
        layer.right - layer.left,
        layer.bottom - layer.top,
      ),
      path: pathParts.join(" > "),
      name: layer.name,
      bbox: {
        left: layer.left,
        top: layer.top,
        width: layer.right - layer.left,
        height: layer.bottom - layer.top,
      },
      reason: uniqueSides.size < 2 ? "insufficient-side-consensus" : "color-spread",
    };
  }

  return {
    key: makeKey(
      layer.name,
      layer.left,
      layer.top,
      layer.right - layer.left,
      layer.bottom - layer.top,
    ),
    name: layer.name,
    left: layer.left,
    top: layer.top,
    width: layer.right - layer.left,
    height: layer.bottom - layer.top,
    stroke: {
      enabled: true,
      width: preferredWidth,
      color: rgbToHex(colorAverage),
      strokeWidth: preferredWidth,
      strokeColor: rgbToHex(colorAverage),
      opacity: round(
        preferred.reduce((sum, item) => sum + item.opacity, 0) / preferred.length,
        4,
      ),
      source: "psd-stroke-guard:visual",
    },
    path: pathParts.join(" > "),
    ambiguities,
  };
}

function makeKey(name, left, top, width, height) {
  return [name, left, top, width, height].join("|");
}

function collectVisualCandidates(layers, pathParts = [], result = { candidates: [], ambiguous: [] }) {
  for (const layer of layers || []) {
    const nextPath = [...pathParts, layer.name || "(unnamed)"];
    if (layer.children && layer.children.length) {
      collectVisualCandidates(layer.children, nextPath, result);
      continue;
    }

    const isVectorLike = Boolean(
      layer.vectorMask ||
        layer.vectorFill ||
        layer.vectorOrigination,
    );
    if (!isVectorLike) continue;

    const candidate = collectVisualCandidate(layer, nextPath);
    if (!candidate) continue;
    if (candidate.ambiguous) {
      result.ambiguous.push(candidate);
      continue;
    }
    result.candidates.push(candidate);
  }
  return result;
}

function collectExactCandidates(psdPath) {
  const pythonScript = `
import json
import sys
from psd_tools import PSDImage

psd = PSDImage.open(sys.argv[1])
out = []

def walk(layers):
    for layer in layers:
        try:
            kind = getattr(layer, "kind", None)
            stroke = getattr(layer, "stroke", None)
        except Exception:
            kind = None
            stroke = None
        if kind == "shape" and stroke and getattr(stroke, "enabled", False):
            color = None
            content = getattr(stroke, "content", None) or {}
            if hasattr(content, "get"):
                clr = content.get(b"Clr ", None)
                if hasattr(clr, "get"):
                    r = int(round(clr.get(b"Rd  ", 0)))
                    g = int(round(clr.get(b"Grn ", 0)))
                    b = int(round(clr.get(b"Bl  ", 0)))
                    color = "#{:02x}{:02x}{:02x}".format(r, g, b)
            bbox = layer.bbox
            out.append({
                "name": layer.name,
                "left": bbox[0],
                "top": bbox[1],
                "width": bbox[2] - bbox[0],
                "height": bbox[3] - bbox[1],
                "strokeWidth": float(getattr(stroke, "line_width", 0) or 0),
                "strokeColor": color,
                "opacity": float(getattr(stroke, "opacity", 0) or 0),
                "alignment": getattr(stroke, "line_alignment", None),
                "blendMode": (
                    getattr(stroke, "blend_mode", None).decode("ascii")
                    if isinstance(getattr(stroke, "blend_mode", None), bytes)
                    else getattr(stroke, "blend_mode", None)
                ),
                "unsupported": color is None,
            })
        if layer.is_group():
            walk(layer)

walk(psd)
print(json.dumps(out))
`;

  try {
    const stdout = execFileSync("python3", ["-c", pythonScript, psdPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(stdout);
  } catch (error) {
    return [];
  }
}

function buildCandidateMap(psdPath) {
  const exact = collectExactCandidates(psdPath);
  const psd = agPsd.readPsd(fs.readFileSync(psdPath), { skipThumbnail: true });
  const visual = collectVisualCandidates(psd.children || []);
  const map = new Map();
  const ambiguous = [...visual.ambiguous];
  const unsupportedKeys = new Set();

  for (const item of exact) {
    const key = makeKey(item.name, item.left, item.top, item.width, item.height);
    if (item.unsupported || !item.strokeColor) {
      unsupportedKeys.add(key);
      continue;
    }
    map.set(key, {
      key,
      name: item.name,
      left: item.left,
      top: item.top,
      width: item.width,
      height: item.height,
      stroke: {
        enabled: true,
        width: item.strokeWidth,
        color: item.strokeColor,
        strokeWidth: item.strokeWidth,
        strokeColor: item.strokeColor,
        opacity: item.opacity == null ? 1 : round(item.opacity / 100, 4),
        alignment: item.alignment || null,
        blendMode: item.blendMode || null,
        source: "psd-stroke-guard:psd-tools",
      },
    });
  }

  for (const item of visual.candidates) {
    if (unsupportedKeys.has(item.key)) continue;
    if (!map.has(item.key)) map.set(item.key, item);
  }

  for (const item of exact) {
    if (!item.unsupported) continue;
    const key = makeKey(item.name, item.left, item.top, item.width, item.height);
    ambiguous.push({
      key,
      path: item.name,
      name: item.name,
      bbox: {
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height,
      },
      reason: "unsupported-non-solid-stroke",
    });
  }

  return { map, ambiguous };
}

function hasMeaningfulStroke(stroke) {
  if (!stroke) return false;
  if (typeof stroke !== "object") return false;
  return Boolean(
    stroke.strokeColor ||
      stroke.color ||
      stroke.strokeWidth ||
      stroke.width,
  );
}

function patchParsedJson(json, candidateMap) {
  let patched = 0;
  const touched = [];
  const presentKeys = new Set();

  function walk(node) {
    const list = node.layers || node.children || [];
    for (const layer of list) {
      const key = makeKey(layer.name, layer.left, layer.top, layer.width, layer.height);
      if ("stroke" in layer) presentKeys.add(key);
      const candidate = candidateMap.get(key);
      if (candidate && !hasMeaningfulStroke(layer.stroke)) {
        layer.stroke = { ...candidate.stroke };
        patched += 1;
        touched.push(candidate);
      }
      walk(layer);
    }
  }

  walk(json);
  return { patched, touched, presentKeys };
}

function patchSpecJson(json, candidateMap) {
  let patched = 0;
  const touched = [];
  const presentKeys = new Set();

  function walk(node) {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (!node || typeof node !== "object") return;

    const hasBox =
      typeof node.x === "number" &&
      typeof node.y === "number" &&
      typeof node.w === "number" &&
      typeof node.h === "number";

    if (hasBox && typeof node.name === "string" && "stroke" in node) {
      const key = makeKey(node.name, node.x, node.y, node.w, node.h);
      presentKeys.add(key);
      const candidate = candidateMap.get(key);
      if (candidate && !hasMeaningfulStroke(node.stroke)) {
        node.stroke = { ...candidate.stroke };
        patched += 1;
        touched.push(candidate);
      }
    }

    for (const value of Object.values(node)) walk(value);
  }

  walk(json);
  return { patched, touched, presentKeys };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, json) {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
}

function formatCandidate(candidate) {
  return `${candidate.name} (${candidate.left},${candidate.top},${candidate.width},${candidate.height}) -> ${candidate.stroke.strokeWidth}px ${candidate.stroke.strokeColor}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.psd || (!args.parsed && !args.spec)) {
    usage();
    process.exit(1);
  }

  const psdPath = path.resolve(args.psd);
  const parsedPath = args.parsed ? path.resolve(args.parsed) : null;
  const specPath = args.spec ? path.resolve(args.spec) : null;
  const shouldWrite = Boolean(args.write);
  const strict = Boolean(args.strict);

  const { map: candidateMap, ambiguous } = buildCandidateMap(psdPath);

  let totalPatched = 0;
  let touched = [];
  const relevantKeys = new Set();

  if (parsedPath) {
    const json = readJson(parsedPath);
    const result = patchParsedJson(json, candidateMap);
    totalPatched += result.patched;
    touched = touched.concat(result.touched);
    for (const key of result.presentKeys) relevantKeys.add(key);
    if (shouldWrite && result.patched) writeJson(parsedPath, json);
    console.log(
      `[psd-stroke-guard] parsed ${result.patched ? "patched" : "checked"}: ${parsedPath} (${result.patched})`,
    );
  }

  if (specPath) {
    const json = readJson(specPath);
    const result = patchSpecJson(json, candidateMap);
    totalPatched += result.patched;
    touched = touched.concat(result.touched);
    for (const key of result.presentKeys) relevantKeys.add(key);
    if (shouldWrite && result.patched) writeJson(specPath, json);
    console.log(
      `[psd-stroke-guard] spec ${result.patched ? "patched" : "checked"}: ${specPath} (${result.patched})`,
    );
  }

  if (touched.length) {
    const unique = Array.from(new Set(touched.map(formatCandidate)));
    for (const line of unique) {
      console.log(`[psd-stroke-guard] recovered ${line}`);
    }
  }

  const relevantAmbiguous = ambiguous.filter((item) => item.key && relevantKeys.has(item.key));

  if (relevantAmbiguous.length) {
    console.error(`[psd-stroke-guard] ambiguous stroke candidates: ${relevantAmbiguous.length}`);
    for (const item of relevantAmbiguous.slice(0, 20)) {
      const box = item.bbox;
      console.error(
        `  - ${item.name} (${box.left},${box.top},${box.width},${box.height}) :: ${item.reason}`,
      );
    }
    if (strict) process.exit(1);
  }

  if (!totalPatched && !relevantAmbiguous.length) {
    console.log("[psd-stroke-guard] no missing strokes detected");
  }
}

main();
