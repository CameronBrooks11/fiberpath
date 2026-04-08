import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const distAssetsDir = path.join(projectRoot, "dist", "assets");
const baselinePath = path.join(projectRoot, "perf", "bundle-baseline.json");
const reportDir = path.join(projectRoot, "perf", "reports");
const reportPath = path.join(reportDir, "bundle-metrics.json");

function collectFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function summarizeAssetsByExtension(files, extension) {
  const matching = files.filter((filePath) => filePath.endsWith(extension));
  const sizes = matching.map((filePath) => ({
    filePath,
    sizeBytes: statSync(filePath).size,
    gzipBytes: gzipSync(readFileSync(filePath)).byteLength,
  }));

  const totalBytes = sizes.reduce((sum, item) => sum + item.sizeBytes, 0);
  const totalGzipBytes = sizes.reduce((sum, item) => sum + item.gzipBytes, 0);
  const largest = sizes.reduce(
    (max, item) => (item.sizeBytes > max.sizeBytes ? item : max),
    { filePath: "", sizeBytes: 0, gzipBytes: 0 },
  );

  return {
    fileCount: sizes.length,
    totalBytes,
    totalGzipBytes,
    largest,
  };
}

if (!existsSync(distAssetsDir)) {
  console.error(`Missing build output: ${distAssetsDir}`);
  console.error("Run `npm run build` before `npm run perf:bundle`.");
  process.exit(1);
}

if (!existsSync(baselinePath)) {
  console.error(`Missing baseline config: ${baselinePath}`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
const allAssets = collectFiles(distAssetsDir);
const js = summarizeAssetsByExtension(allAssets, ".js");
const css = summarizeAssetsByExtension(allAssets, ".css");

const regressionMultiplier = 1 + baseline.maxRegressionPercent / 100;
const jsRegressionBudget = Math.round(
  baseline.baseline.totalJsBytes * regressionMultiplier,
);
const cssRegressionBudget = Math.round(
  baseline.baseline.totalCssBytes * regressionMultiplier,
);

const jsBudget = Math.min(jsRegressionBudget, baseline.absoluteJsBudgetBytes);
const cssBudget = Math.min(cssRegressionBudget, baseline.absoluteCssBudgetBytes);

const failures = [];
if (js.totalBytes > jsBudget) {
  failures.push(
    `JavaScript bundle exceeds budget (${formatBytes(js.totalBytes)} > ${formatBytes(jsBudget)})`,
  );
}
if (css.totalBytes > cssBudget) {
  failures.push(
    `CSS bundle exceeds budget (${formatBytes(css.totalBytes)} > ${formatBytes(cssBudget)})`,
  );
}

const report = {
  capturedAt: new Date().toISOString(),
  baselineConfigPath: path.relative(projectRoot, baselinePath),
  baseline,
  budgets: {
    jsBudgetBytes: jsBudget,
    cssBudgetBytes: cssBudget,
    jsRegressionBudgetBytes: jsRegressionBudget,
    cssRegressionBudgetBytes: cssRegressionBudget,
  },
  metrics: {
    js: {
      fileCount: js.fileCount,
      totalBytes: js.totalBytes,
      totalGzipBytes: js.totalGzipBytes,
      largestFile: path.relative(projectRoot, js.largest.filePath || ""),
      largestBytes: js.largest.sizeBytes,
    },
    css: {
      fileCount: css.fileCount,
      totalBytes: css.totalBytes,
      totalGzipBytes: css.totalGzipBytes,
      largestFile: path.relative(projectRoot, css.largest.filePath || ""),
      largestBytes: css.largest.sizeBytes,
    },
  },
  pass: failures.length === 0,
  failures,
};

mkdirSync(reportDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

console.log("Bundle Metrics");
console.log(`- JS: ${formatBytes(js.totalBytes)} (gzip ${formatBytes(js.totalGzipBytes)})`);
console.log(`- CSS: ${formatBytes(css.totalBytes)} (gzip ${formatBytes(css.totalGzipBytes)})`);
console.log(`- JS budget: ${formatBytes(jsBudget)} | CSS budget: ${formatBytes(cssBudget)}`);
console.log(`- Report: ${path.relative(projectRoot, reportPath)}`);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log("Bundle budgets passed.");
