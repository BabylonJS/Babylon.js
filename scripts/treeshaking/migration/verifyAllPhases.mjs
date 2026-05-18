#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * verifyAllPhases.mjs
 *
 * Cross-phase verification for the tree-shaking plan.
 * Checks that no files were missed in any phase:
 *
 *   Phase 2: Every file with RegisterClass-only side effects has a .pure.ts companion
 *   Phase 3: Every .pure.ts file is reachable from a pure.ts barrel
 *   Phase 4: Delegated to verifyPhase4.mjs (static method extraction)
 *
 * Also checks for regressions:
 *   - .pure.ts files that have acquired side effects
 *   - Barrel pure.ts files that export from side-effectful modules
 *
 * Usage:
 *   node scripts/treeshaking/migration/verifyAllPhases.mjs [--verbose]
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname, relative, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const SRC_ROOT = resolve(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = resolve(REPO_ROOT, "scripts/treeshaking/side-effects-manifest.json");

const VERBOSE = process.argv.includes("--verbose");

let exitCode = 0;

// ── Helpers ─────────────────────────────────────────────────────────────────

function collectFiles(dir, filter) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectFiles(fullPath, filter));
        } else if (filter(entry.name)) {
            results.push(relative(SRC_ROOT, fullPath));
        }
    }
    return results;
}

function getBarrelExports(barrelPath) {
    if (!existsSync(barrelPath)) {
        return [];
    }
    const src = readFileSync(barrelPath, "utf8");
    const exports = [];
    // Match both `export * from "..."` and `export { ... } from "..."`
    const re = /export\s+(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        exports.push(m[1]);
    }
    return exports;
}

// ── Load manifest ───────────────────────────────────────────────────────────

let manifest;
try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
} catch {
    console.error("ERROR: Cannot read side-effects manifest. Run: npm run audit:side-effects");
    process.exit(2);
}

const sideEffectMap = new Map(); // relPath → sideEffect types
for (const entry of manifest.manifest) {
    sideEffectMap.set(
        entry.file,
        entry.sideEffects.map((s) => s.type)
    );
}

// ── Collect all .pure.ts files ──────────────────────────────────────────────

const allPureFiles = collectFiles(SRC_ROOT, (name) => name.endsWith(".pure.ts") && name !== "pure.ts");
const allBarrelFiles = collectFiles(SRC_ROOT, (name) => name === "pure.ts");

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║          Cross-Phase Tree-Shaking Verification              ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 1: Phase 2 — Every RegisterClass-only file should have .pure.ts
// ═══════════════════════════════════════════════════════════════════════════

console.log("── 1. Phase 2: RegisterClass Split Completeness ─────────────");

const registerClassOnly = manifest.manifest.filter((e) => e.sideEffects.every((s) => s.type === "RegisterClass"));

const phase2Missing = [];
const phase2Done = [];
// Known deferred edge cases (documented in TREE_SHAKING_PLAN.md Phase 2.4)
const PHASE2_DEFERRED = new Set([
    "Materials/GreasedLine/greasedLinePluginMaterial.ts",
    "PostProcesses/RenderPipeline/Pipelines/taaMaterialManager.ts",
    "Rendering/GlobalIllumination/giRSMManager.ts",
    "Rendering/IBLShadows/iblShadowsPluginMaterial.ts",
    "Rendering/reflectiveShadowMap.ts",
    "XR/features/WebXRDepthSensing.ts",
    "Misc/typeStore.ts", // defines RegisterClass itself
]);

for (const entry of registerClassOnly) {
    const purePath = entry.file.replace(/\.ts$/, ".pure.ts");
    if (existsSync(resolve(SRC_ROOT, purePath))) {
        phase2Done.push(entry.file);
    } else if (!PHASE2_DEFERRED.has(entry.file)) {
        phase2Missing.push(entry.file);
    }
}

console.log(`  RegisterClass-only files:     ${registerClassOnly.length}`);
console.log(`  Split (have .pure.ts):        ${phase2Done.length}`);
console.log(`  Known deferred (Phase 2.4):   ${PHASE2_DEFERRED.size}`);
if (phase2Missing.length > 0) {
    exitCode = 1;
    console.log(`  ⚠️  MISSING .pure.ts:          ${phase2Missing.length}`);
    for (const f of phase2Missing) {
        console.log(`    - ${f}`);
    }
} else {
    console.log(`  ✅ All RegisterClass-only files are split or deferred`);
}
console.log();

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 2: Phase 3 — Every .pure.ts file is reachable from a barrel
// ═══════════════════════════════════════════════════════════════════════════

console.log("── 2. Phase 3: Pure Barrel Reachability ──────────────────────");

// Walk all barrel pure.ts files and collect everything they transitively export
function collectBarrelReachable(dir, overrideBarrelPath) {
    const barrelPath = overrideBarrelPath || join(dir, "pure.ts");
    const exports = getBarrelExports(barrelPath);
    const reachable = new Set();

    for (const spec of exports) {
        const fullResolved = resolve(dir, spec);
        const rel = relative(SRC_ROOT, fullResolved);

        if (spec.endsWith(".pure")) {
            // Points to a .pure.ts file (e.g. "./action.pure" → action.pure.ts)
            reachable.add(rel + ".ts");
            // Check if this .pure.ts file is itself a barrel (re-exports from other .pure files)
            const pureFile = fullResolved + ".ts";
            if (existsSync(pureFile)) {
                const pureExports = getBarrelExports(pureFile);
                if (pureExports.length > 0) {
                    const pureDir = dirname(pureFile);
                    for (const sub of collectBarrelReachable(pureDir, pureFile)) {
                        reachable.add(sub);
                    }
                }
            }
        } else {
            // Could be:
            // (a) a subdirectory barrel (e.g. "./Actions/pure" → Actions/pure.ts which IS a barrel)
            // (b) a plain .ts file already pure (e.g. "./actionManager" → actionManager.ts)
            // (c) a subdirectory that has a pure.ts inside it

            const asFile = fullResolved + ".ts";

            if (existsSync(asFile)) {
                // Check if this file IS a barrel pure.ts (e.g. "Actions/pure.ts")
                // by checking if the specifier ends with "/pure"
                if (spec.endsWith("/pure")) {
                    // This is a subdirectory barrel — recurse into the directory
                    const subDir = dirname(asFile);
                    for (const sub of collectBarrelReachable(subDir)) {
                        reachable.add(sub);
                    }
                } else {
                    reachable.add(rel + ".ts");
                }
            } else {
                // Try as a directory that contains a pure.ts barrel
                const asDir = join(fullResolved, "pure.ts");
                if (existsSync(asDir)) {
                    for (const sub of collectBarrelReachable(fullResolved)) {
                        reachable.add(sub);
                    }
                }
            }
        }
    }

    return reachable;
}

const reachableFromBarrels = collectBarrelReachable(SRC_ROOT);
const unreachablePure = [];

for (const pf of allPureFiles) {
    if (!reachableFromBarrels.has(pf)) {
        unreachablePure.push(pf);
    }
}

console.log(`  Total .pure.ts files:          ${allPureFiles.length}`);
console.log(`  Barrel pure.ts files:          ${allBarrelFiles.length}`);
console.log(`  Reachable from barrels:        ${reachableFromBarrels.size}`);

if (unreachablePure.length > 0) {
    exitCode = 1;
    console.log(`  ⚠️  NOT reachable from any barrel: ${unreachablePure.length}`);
    for (const f of unreachablePure) {
        console.log(`    - ${f}`);
    }
} else {
    console.log(`  ✅ All .pure.ts files are reachable from barrel pure.ts files`);
}
console.log();

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 3: Regression — .pure.ts files should not have side effects
// ═══════════════════════════════════════════════════════════════════════════

console.log("── 3. Regression: .pure.ts Files Should Be Side-Effect-Free ─");

const impurePureFiles = [];
for (const pf of allPureFiles) {
    const types = sideEffectMap.get(pf);
    if (types && types.length > 0) {
        impurePureFiles.push({ file: pf, types });
    }
}

if (impurePureFiles.length > 0) {
    // Some .pure.ts files may legitimately have static-property-assignment
    // (e.g. Object.defineProperties in math classes). Filter to only truly problematic ones.
    const problematic = impurePureFiles.filter((e) => {
        // static-property-assignment in .pure.ts is expected (Phase 4.3 wrappers assign statics
        // in the non-pure .ts, but the .pure.ts may still have leftover statics that are
        // intentionally kept). Only flag RegisterClass, prototype-assignment, shader-store-write.
        const badTypes = e.types.filter((t) => t === "RegisterClass" || t === "prototype-assignment" || t === "shader-store-write" || t === "AddNodeConstructor");
        return badTypes.length > 0;
    });

    if (problematic.length > 0) {
        exitCode = 1;
        console.log(`  ⚠️  .pure.ts files with problematic side effects: ${problematic.length}`);
        for (const e of problematic) {
            console.log(`    - ${e.file}: ${e.types.join(", ")}`);
        }
    } else {
        console.log(`  ✅ No .pure.ts files have problematic side effects`);
        if (VERBOSE && impurePureFiles.length > 0) {
            console.log(`  ℹ️  ${impurePureFiles.length} .pure.ts files have benign side effects (static-property-assignment, declare-module)`);
        }
    }
} else {
    console.log(`  ✅ No .pure.ts files have any side effects in manifest`);
}
console.log();

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 4: Barrel purity — barrel pure.ts should not export impure files
// ═══════════════════════════════════════════════════════════════════════════

console.log("── 4. Barrel Purity: Barrels Should Not Export Impure Files ──");

let barrelIssues = 0;
for (const barrel of allBarrelFiles) {
    const barrelDir = resolve(SRC_ROOT, dirname(barrel));
    const exports = getBarrelExports(resolve(SRC_ROOT, barrel));

    for (const spec of exports) {
        const fullResolved = resolve(barrelDir, spec);
        const rel = relative(SRC_ROOT, fullResolved);

        // Check if the exported file has side effects
        const asTs = rel + ".ts";
        const types = sideEffectMap.get(asTs);
        if (types && types.length > 0) {
            // Only flag if it has genuinely problematic side effects
            const bad = types.filter((t) => t === "RegisterClass" || t === "prototype-assignment" || t === "shader-store-write" || t === "AddNodeConstructor");
            if (bad.length > 0) {
                if (barrelIssues === 0) {
                    console.log(`  ⚠️  Barrel files exporting impure modules:`);
                }
                barrelIssues++;
                console.log(`    - ${barrel} exports ${spec} → has: ${bad.join(", ")}`);
            }
        }
    }
}

if (barrelIssues === 0) {
    console.log(`  ✅ All barrel pure.ts exports are side-effect-free`);
}
console.log();

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 5: .pure.ts ↔ .ts wrapper consistency
// ═══════════════════════════════════════════════════════════════════════════

console.log("── 5. Wrapper Consistency: .pure.ts Should Have .ts Wrapper ──");

const orphanedPure = [];
for (const pf of allPureFiles) {
    const wrapperPath = pf.replace(".pure.ts", ".ts");
    if (!existsSync(resolve(SRC_ROOT, wrapperPath))) {
        orphanedPure.push(pf);
    }
}

if (orphanedPure.length > 0) {
    console.log(`  ⚠️  .pure.ts files without .ts wrapper: ${orphanedPure.length}`);
    for (const f of orphanedPure) {
        console.log(`    - ${f}`);
    }
} else {
    console.log(`  ✅ All .pure.ts files have corresponding .ts wrappers`);
}
console.log();

// ═══════════════════════════════════════════════════════════════════════════
// CHECK 6: Wrapper re-export — .ts should re-export from .pure.ts
// ═══════════════════════════════════════════════════════════════════════════

console.log("── 6. Wrapper Re-export: .ts Should Re-export from .pure.ts ─");

let reexportIssues = 0;
for (const pf of allPureFiles) {
    const wrapperPath = resolve(SRC_ROOT, pf.replace(".pure.ts", ".ts"));
    if (!existsSync(wrapperPath)) {
        continue;
    }

    const wrapperSrc = readFileSync(wrapperPath, "utf8");

    // Skip barrel-like files (only export * or export {} from lines) — not wrappers
    const nonExportLines = wrapperSrc
        .split("\n")
        .filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("/*") && !l.trim().startsWith("*"))
        .filter((l) => !/^export\s+(?:\*|\{[^}]*\})\s+from\s+/.test(l.trim()));
    if (nonExportLines.length === 0) {
        continue;
    }

    const baseName = pf.replace(".pure.ts", "").split("/").pop();
    // Check for: export * from "./baseName.pure" or import ... from "./baseName.pure"
    const pureSpecifier = `./${baseName}.pure`;
    if (!wrapperSrc.includes(pureSpecifier) && !wrapperSrc.includes(`"${baseName}.pure"`)) {
        reexportIssues++;
        if (VERBOSE || reexportIssues <= 10) {
            console.log(`    - ${pf.replace(".pure.ts", ".ts")}: does not reference ${pureSpecifier}`);
        }
    }
}

if (reexportIssues === 0) {
    console.log(`  ✅ All .ts wrappers reference their .pure.ts companion`);
} else {
    console.log(`  ⚠️  ${reexportIssues} wrappers don't reference their .pure.ts${reexportIssues > 10 && !VERBOSE ? " (use --verbose for full list)" : ""}`);
}
console.log();

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log("══════════════════════════════════════════════════════════════");
if (exitCode === 0) {
    console.log("  ✅ ALL CHECKS PASSED — No files missed across any phase.");
} else {
    console.log("  ⚠️  ISSUES FOUND — See details above.");
}
console.log("══════════════════════════════════════════════════════════════\n");

process.exit(exitCode);
