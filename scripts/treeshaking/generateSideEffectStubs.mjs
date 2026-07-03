#!/usr/bin/env node
/**
 * Phase 11 — Generate side-effect warning stubs for augmented prototype methods.
 *
 * Reads every `.types.ts` file under packages/dev/core/src/, parses the
 * `declare module` blocks to extract method/property declarations, then injects
 * lightweight stubs into the corresponding target class files.
 *
 * When a user calls an augmented method without importing its side-effect module,
 * they get a helpful console.warn instead of "TypeError: x is not a function".
 *
 * Usage:
 *   node scripts/treeshaking/generateSideEffectStubs.mjs [--dry-run] [--verbose] [--format]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname, relative, posix, join } from "path";
import { globSync } from "glob";
import { execFileSync } from "child_process";
import { getPackageConfig, resolvePackageFromArgv } from "./packageConfig.mjs";

const PACKAGE = resolvePackageFromArgv();
const PACKAGE_CONFIG = getPackageConfig(PACKAGE);
const ROOT = PACKAGE_CONFIG.srcRoot;
const REPO_ROOT = PACKAGE_CONFIG.repoRoot;
const DRY_RUN = process.argv.includes("--dry-run");
const CHECK = process.argv.includes("--check");
const VERBOSE = process.argv.includes("--verbose");
const FORMAT = process.argv.includes("--format");

/** @type {Map<string, string>} path → expected content (used in --check mode) */
const expectedContents = new Map();

const REGION_START = "// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`";
const REGION_END = "// #endregion GENERATED_SIDE_EFFECT_STUBS";
const PRETTIER_PRINT_WIDTH = 180;

// Classes that are part of the always-loaded engine hierarchy. These base
// classes are pulled into every build that creates an engine, so any stub
// attached to them can never be tree-shaken and inflates even the most minimal
// (thin-engine-only) bundle. We deliberately skip generating side-effect stubs
// for them: the small loss of a friendly "requires a side-effect import"
// warning on these specific augmented methods is worth keeping the core engine
// footprint minimal. Callers of an unimported augmented method on these classes
// still get a standard "x is not a function" TypeError.
//
// The thin-engine closure below (STUB_EXCLUDED_FILES) already covers the WebGL
// thin engine (AbstractEngine, ThinEngine). This list additionally covers the
// heavier engine variants (Engine, WebGPU, Native) whose classes are not part
// of the minimal thin-engine closure but are still always-loaded once you use
// that engine — keeping their augmented-method stubs out of every build too.
const STUB_EXCLUDED_CLASSES = new Set(["AbstractEngine", "ThinEngine", "Engine", "WebGPUEngine", "ThinWebGPUEngine", "NativeEngine", "ThinNativeEngine"]);

/**
 * Absolute paths of files that make up the thin-engine import closure.
 *
 * Every file pulled in by `new ThinEngine(canvas)` (see
 * packages/tools/tests/src/thinEngineOnly.ts) is loaded in even the most
 * minimal engine build, so a module-load stub (`X.prototype.m ??= ...`) placed
 * in one of them can never be tree-shaken and permanently inflates the thin
 * engine. The authoritative list lives in `thin-engine-modules.json` (derived
 * from the real production bundle) rather than being recomputed here: a
 * source-only esbuild pass tree-shakes differently from the shipped build
 * (constants inlining, injected `/*#__PURE__*\/` annotations) and would
 * under-count the true closure. Populated by `loadThinEngineClosure()` below;
 * only meaningful for the core package.
 * @type {Set<string>}
 */
let STUB_EXCLUDED_FILES = new Set();

/**
 * Load the authoritative thin-engine closure from `thin-engine-modules.json` and
 * resolve each module to an absolute source path. Only relevant for `core` (the
 * thin engine lives there and never imports the other packages). Every listed
 * module must exist so a rename can never silently drop a file out of the
 * exclusion set (which would let a stub creep back into the thin engine).
 * @returns {Set<string>} absolute file paths in the thin-engine closure
 */
function loadThinEngineClosure() {
    if (PACKAGE !== "core") {
        return new Set();
    }
    const coreSrc = join(REPO_ROOT, "packages", "dev", "core", "src");
    const listPath = join(REPO_ROOT, "scripts", "treeshaking", "thin-engine-modules.json");
    const { modules } = JSON.parse(readFileSync(listPath, "utf8"));
    const files = new Set();
    const missing = [];
    for (const rel of modules) {
        const abs = join(coreSrc, rel);
        if (!existsSync(abs)) {
            missing.push(rel);
            continue;
        }
        files.add(abs);
    }
    if (missing.length > 0) {
        throw new Error(
            `Stale thin-engine exclusion list: ${missing.length} module(s) in thin-engine-modules.json no longer exist ` +
                `(${missing.join(", ")}). Update scripts/treeshaking/thin-engine-modules.json after the rename/removal.`
        );
    }
    return files;
}

// ── Step 1: Find all .types.ts files ────────────────────────────────────────

const typesFiles = globSync("**/*.types.ts", { cwd: ROOT, absolute: true }).sort();
if (VERBOSE) console.log(`Found ${typesFiles.length} .types.ts files`);

// Load the thin-engine closure up front so stubs are never emitted into any
// always-loaded thin-engine file (see STUB_EXCLUDED_FILES).
STUB_EXCLUDED_FILES = loadThinEngineClosure();
if (VERBOSE) console.log(`Thin-engine closure: ${STUB_EXCLUDED_FILES.size} files excluded from stub generation`);

// ── Step 2: Parse declare module blocks ─────────────────────────────────────

/**
 * @typedef {{ name: string, isMethod: boolean, isInternal: boolean }} MemberDecl
 * @typedef {{ modulePath: string, interfaceName: string, members: MemberDecl[] }} AugBlock
 */

/**
 * Parse a .types.ts file and extract all declare module blocks with their members.
 * @param {string} filePath
 * @returns {AugBlock[]}
 */
function parseTypesFile(filePath) {
    const src = readFileSync(filePath, "utf-8");
    /** @type {AugBlock[]} */
    const blocks = [];

    // Match: declare module "path" { ... interface Name { ... } ... }
    // We use a state-machine approach for robustness with nested braces
    const declareModuleRe = /declare\s+module\s+"([^"]+)"\s*\{/g;

    let dmMatch;
    while ((dmMatch = declareModuleRe.exec(src)) !== null) {
        const modulePath = dmMatch[1];
        const outerStart = dmMatch.index + dmMatch[0].length;

        // Find the matching closing brace for the declare module block
        let depth = 1;
        let pos = outerStart;
        while (pos < src.length && depth > 0) {
            if (src[pos] === "{") depth++;
            else if (src[pos] === "}") depth--;
            pos++;
        }
        const blockBody = src.slice(outerStart, pos - 1);

        // Find interface declarations inside
        const interfaceRe = /export\s+interface\s+(\w+)(?:<[^>]*>)?\s*\{/g;
        let ifMatch;
        while ((ifMatch = interfaceRe.exec(blockBody)) !== null) {
            const interfaceName = ifMatch[1];
            const ifStart = ifMatch.index + ifMatch[0].length;

            // Find matching close brace for the interface
            let iDepth = 1;
            let iPos = ifStart;
            while (iPos < blockBody.length && iDepth > 0) {
                if (blockBody[iPos] === "{") iDepth++;
                else if (blockBody[iPos] === "}") iDepth--;
                iPos++;
            }
            const ifBody = blockBody.slice(ifStart, iPos - 1);

            // Extract members — look for lines that declare methods or properties
            const members = parseInterfaceMembers(ifBody);

            blocks.push({ modulePath, interfaceName, members });
        }
    }

    return blocks;
}

/**
 * Parse interface body to extract member declarations.
 * Handles multi-line method signatures by tracking parenthesis depth.
 * @param {string} body
 * @returns {MemberDecl[]}
 */
function parseInterfaceMembers(body) {
    /** @type {MemberDecl[]} */
    const members = [];

    // Remove multi-line comments (JSDoc) to simplify parsing
    const stripped = body.replace(/\/\*\*[\s\S]*?\*\//g, "");

    // Split into lines and process with parenthesis/brace depth tracking
    const lines = stripped.split("\n");
    let parenDepth = 0; // Track open parens for multi-line method signatures
    let braceDepth = 0; // Track open braces for nested object type literals

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

        // If we're inside a parenthesized parameter list, just track depth
        if (parenDepth > 0) {
            for (const ch of trimmed) {
                if (ch === "(") parenDepth++;
                else if (ch === ")") parenDepth--;
            }
            continue;
        }

        // If we're inside a nested object type literal, just track brace depth
        if (braceDepth > 0) {
            for (const ch of trimmed) {
                if (ch === "{") braceDepth++;
                else if (ch === "}") braceDepth--;
            }
            continue;
        }

        // Match property or method declarations:
        // Method: name(params): returnType;
        // Method: name<T>(params): returnType;
        // Property: name: Type;
        // Optional property: name?: Type;
        // We look for: identifier followed by ( for method, or : or ? for property
        const memberMatch = trimmed.match(/^(\w+)(?:\s*<[^>]*>)?\s*(\(|[?]?\s*:)/);
        if (!memberMatch) continue;

        const name = memberMatch[1];
        const delimiter = memberMatch[2];

        // Skip TypeScript keywords that might false-match
        if (["export", "readonly", "static", "declare", "import", "type", "interface", "class", "extends", "implements"].includes(name)) continue;

        const isMethod = delimiter === "(";
        const isInternal = name.startsWith("_");

        // Track parenthesis depth for multi-line method signatures
        if (isMethod) {
            for (const ch of trimmed) {
                if (ch === "(") parenDepth++;
                else if (ch === ")") parenDepth--;
            }
        }

        // Track brace depth for nested object type literals (e.g., prop: { key: value })
        if (!isMethod) {
            for (const ch of trimmed) {
                if (ch === "{") braceDepth++;
                else if (ch === "}") braceDepth--;
            }
        }

        members.push({ name, isMethod, isInternal });
    }

    return members;
}

// ── Step 3: Resolve target files and group stubs ────────────────────────────

/**
 * @typedef {{ methods: Map<string, string>, properties: Map<string, string> }} ClassStubs
 * methods: Map<methodName, className>, properties: Map<propName, className>
 */

/** @type {Map<string, Map<string, ClassStubs>>} targetFile -> className -> stubs */
const stubsByFile = new Map();

// Keep generated stubs stable without relying on Prettier for long lines.
function appendPropertyStub(lines, className, propName) {
    const definePropertyLine = `    Object.defineProperty(${className}.prototype, "${propName}", _MissingSideEffectProperty("${className}", "${propName}"));`;
    if (definePropertyLine.length <= PRETTIER_PRINT_WIDTH) {
        lines.push(definePropertyLine);
    } else {
        lines.push(`    Object.defineProperty(`);
        lines.push(`        ${className}.prototype,`);
        lines.push(`        "${propName}",`);
        lines.push(`        _MissingSideEffectProperty("${className}", "${propName}")`);
        lines.push(`    );`);
    }
}

let totalMethods = 0;
let totalProperties = 0;
let totalSkipped = 0;

/** @type {Map<string, Set<string>>} targetFile → set of runtime class names declared in it */
const runtimeClassCache = new Map();

/**
 * Whether the target file declares a runtime `class <className>` (the only kind
 * that has a usable `.prototype`). Type-only interface augmentations are skipped.
 * @param {string} targetFile Absolute path of the resolved target module
 * @param {string} className The augmented interface/class name
 * @returns {boolean}
 */
function fileDeclaresRuntimeClass(targetFile, className) {
    let classes = runtimeClassCache.get(targetFile);
    if (!classes) {
        classes = new Set();
        const src = readFileSync(targetFile, "utf-8");
        const classRe = /(?:^|[\s;])(?:export\s+)?(?:declare\s+)?(?:abstract\s+)?class\s+(\w+)/g;
        let m;
        while ((m = classRe.exec(src)) !== null) {
            classes.add(m[1]);
        }
        runtimeClassCache.set(targetFile, classes);
    }
    return classes.has(className);
}

for (const typesFile of typesFiles) {
    const blocks = parseTypesFile(typesFile);

    for (const block of blocks) {
        // Resolve the module path relative to the .types.ts file location
        const typeDir = dirname(typesFile);
        let resolvedBase = resolve(typeDir, block.modulePath);

        // Find the actual .ts or .pure.ts file
        let targetFile = null;
        // Prefer .pure.ts for the target (stubs attached to the pure class)
        if (existsSync(resolvedBase + ".pure.ts")) {
            targetFile = resolvedBase + ".pure.ts";
        } else if (existsSync(resolvedBase + ".ts")) {
            targetFile = resolvedBase + ".ts";
        } else {
            if (VERBOSE) console.log(`  SKIP: cannot resolve target for declare module "${block.modulePath}" from ${relative(ROOT, typesFile)}`);
            continue;
        }

        // Only emit stubs when the augmented entity is a runtime class in the
        // target file. Augmentations of type-only interfaces (e.g. options bags
        // like GLTFLoaderExtensionOptions) have no prototype, so referencing
        // `<Name>.prototype` would be a TS "value used as type" error.
        if (!fileDeclaresRuntimeClass(targetFile, block.interfaceName)) {
            if (VERBOSE) {
                console.log(`  SKIP: ${block.interfaceName} is not a runtime class in ${relative(ROOT, targetFile)} (type-only interface augmentation)`);
            }
            continue;
        }

        // Always-loaded files are excluded from stub generation so their stubs
        // don't inflate minimal bundles. A file is excluded when it is part of
        // the thin-engine closure (STUB_EXCLUDED_FILES) or when the augmented
        // class is a known always-loaded engine variant (STUB_EXCLUDED_CLASSES).
        // We still register the target file below so any previously generated
        // region gets stripped, but we emit no members.
        const classExcluded = STUB_EXCLUDED_CLASSES.has(block.interfaceName) || STUB_EXCLUDED_FILES.has(targetFile);
        if (classExcluded && VERBOSE) {
            const reason = STUB_EXCLUDED_FILES.has(targetFile) ? "in thin-engine closure" : "always-loaded engine class";
            console.log(`  SKIP: ${block.interfaceName} (${reason}) — excluded from stub generation`);
        }

        if (!stubsByFile.has(targetFile)) {
            stubsByFile.set(targetFile, new Map());
        }
        const classMap = stubsByFile.get(targetFile);
        if (!classMap.has(block.interfaceName)) {
            classMap.set(block.interfaceName, { methods: new Map(), properties: new Map() });
        }
        const stubs = classMap.get(block.interfaceName);

        if (classExcluded) {
            continue;
        }

        for (const member of block.members) {
            if (member.isInternal) {
                totalSkipped++;
                continue;
            }

            if (member.isMethod) {
                if (!stubs.methods.has(member.name)) {
                    stubs.methods.set(member.name, block.interfaceName);
                    totalMethods++;
                }
            } else {
                if (!stubs.properties.has(member.name)) {
                    stubs.properties.set(member.name, block.interfaceName);
                    totalProperties++;
                }
            }
        }
    }
}

// ── Step 3.5: Prune child-class stubs inherited from a parent ───────────────

// Build class hierarchy by scanning target files for `class X extends Y`
/** @type {Map<string, string>} className -> parentClassName */
const classHierarchy = new Map();
for (const [targetFile] of stubsByFile) {
    const src = readFileSync(targetFile, "utf-8");
    const classRe = /export\s+(?:abstract\s+)?class\s+(\w+)\s+extends\s+(\w+)/g;
    let m;
    while ((m = classRe.exec(src)) !== null) {
        classHierarchy.set(m[1], m[2]);
    }
}

// Build flat map: className → Set of stubbed member names
/** @type {Map<string, Set<string>>} */
const allStubsByClass = new Map();
for (const [, classMap] of stubsByFile) {
    for (const [className, stubs] of classMap) {
        if (!allStubsByClass.has(className)) allStubsByClass.set(className, new Set());
        const set = allStubsByClass.get(className);
        for (const [name] of stubs.methods) set.add(name);
        for (const [name] of stubs.properties) set.add(name);
    }
}

/**
 * Get all ancestor class names (walking up the `extends` chain).
 * @param {string} className
 * @returns {string[]}
 */
function getAncestors(className) {
    const ancestors = [];
    let current = className;
    while (classHierarchy.has(current)) {
        const parent = classHierarchy.get(current);
        ancestors.push(parent);
        current = parent;
    }
    return ancestors;
}

// Remove stubs from child classes when a parent already has the same stub.
// The parent stub is inherited via the prototype chain, so the child's ??= is
// redundant at best and dangerous at worst (can shadow a real registration on
// the parent if module load order changes).
let prunedCount = 0;
for (const [, classMap] of stubsByFile) {
    for (const [className, stubs] of classMap) {
        const ancestors = getAncestors(className);
        if (ancestors.length === 0) continue;

        for (const [methodName] of [...stubs.methods]) {
            for (const ancestor of ancestors) {
                const ancestorStubs = allStubsByClass.get(ancestor);
                if (ancestorStubs && ancestorStubs.has(methodName)) {
                    stubs.methods.delete(methodName);
                    totalMethods--;
                    prunedCount++;
                    if (VERBOSE) console.log(`  PRUNED: ${className}.${methodName}() — inherited from ${ancestor}`);
                    break;
                }
            }
        }

        for (const [propName] of [...stubs.properties]) {
            for (const ancestor of ancestors) {
                const ancestorStubs = allStubsByClass.get(ancestor);
                if (ancestorStubs && ancestorStubs.has(propName)) {
                    stubs.properties.delete(propName);
                    totalProperties--;
                    prunedCount++;
                    if (VERBOSE) console.log(`  PRUNED: ${className}.${propName} — inherited from ${ancestor}`);
                    break;
                }
            }
        }
    }
}

// ── Step 4: Generate stub code and inject into target files ─────────────────

/** @type {string[]} files written in normal mode, for post-formatting */
const writtenFiles = [];

let filesModified = 0;

for (const [targetFile, classMap] of stubsByFile) {
    // Compute the import specifier for the devTools warning helper. In core it is
    // a relative path; in the other packages devTools lives in core, so use the
    // `core/Misc/devTools` path alias these packages already import through.
    const targetDir = dirname(targetFile);
    let relPath;
    if (PACKAGE === "core") {
        relPath = posix.normalize(relative(targetDir, resolve(ROOT, "Misc/devTools")).split("\\").join("/"));
        if (!relPath.startsWith(".")) relPath = "./" + relPath;
    } else {
        relPath = "core/Misc/devTools";
    }

    // Read target file first so we can detect its line endings
    let content = readFileSync(targetFile, "utf-8");
    const originalContent = content;
    const eol = content.includes("\r\n") ? "\r\n" : "\n";

    // Strip existing stub region before searching for imports (so we don't match
    // an import that lives inside the old region and would be removed anyway).
    const regionStartIdx = content.indexOf(REGION_START);
    const regionEndIdx = content.indexOf(REGION_END);
    let contentWithoutRegion = content;
    if (regionStartIdx !== -1 && regionEndIdx !== -1) {
        let endSkip = regionEndIdx + REGION_END.length;
        if (content[endSkip] === "\r") endSkip++;
        if (content[endSkip] === "\n") endSkip++;
        contentWithoutRegion = content.slice(0, regionStartIdx) + content.slice(endSkip);
        // Removing a region that was appended at EOF leaves the blank separator
        // line that preceded it, producing a trailing blank line. Collapse any
        // trailing whitespace down to a single end-of-line so the result stays
        // prettier-clean (and `--check` matches a fresh regeneration).
        contentWithoutRegion = contentWithoutRegion.replace(/\s*$/, eol);
    }

    // Determine which devTools symbols this file's stubs need
    let needsMissingSideEffect = false;
    let needsMissingSideEffectProperty = false;
    for (const [, stubs] of classMap) {
        if (stubs.methods.size > 0) needsMissingSideEffect = true;
        if (stubs.properties.size > 0) needsMissingSideEffectProperty = true;
    }
    const neededSymbols = [];
    if (needsMissingSideEffect) neededSymbols.push("_MissingSideEffect");
    if (needsMissingSideEffectProperty) neededSymbols.push("_MissingSideEffectProperty");

    // Check if there's an existing import from devTools OUTSIDE the stub region
    const devToolsImportRe = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${relPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']\\s*;`);
    const existingImportMatch = contentWithoutRegion.match(devToolsImportRe);
    let stubImportLine = "";

    if (existingImportMatch) {
        // Merge: parse existing symbols, drop any generator-managed symbols that
        // are no longer needed (e.g. when a class becomes excluded or loses all
        // its stubs), then add the currently-needed ones. This keeps the external
        // devTools import free of dangling unused symbols so `--check` stays
        // stable and lint doesn't flag orphaned imports.
        const managedSymbols = new Set(["_MissingSideEffect", "_MissingSideEffectProperty"]);
        const existingSymbols = existingImportMatch[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const keptSymbols = existingSymbols.filter((s) => !managedSymbols.has(s) || neededSymbols.includes(s));
        const allSymbols = [...new Set([...keptSymbols, ...neededSymbols])];
        // If nothing remains, drop the import line entirely; otherwise rewrite it.
        const newImport = allSymbols.length > 0 ? `import { ${allSymbols.join(", ")} } from "${relPath}";` : "";
        const replacement = newImport || "";
        if (newImport !== existingImportMatch[0]) {
            content = content.replace(existingImportMatch[0], replacement);
            // Keep contentWithoutRegion in sync so the stale-removal path below
            // writes the cleaned import rather than the original merged one.
            contentWithoutRegion = contentWithoutRegion.replace(existingImportMatch[0], replacement);
        }
    } else {
        // No existing import — add import line inside the stub block
        stubImportLine = `import { ${neededSymbols.join(", ")} } from "${relPath}";`;
    }

    // Build stub code lines
    const lines = [];
    lines.push(REGION_START);
    if (stubImportLine) {
        lines.push(stubImportLine);
    }
    lines.push("");

    let fileStubCount = 0;

    for (const [className, stubs] of classMap) {
        // Methods
        for (const [methodName] of stubs.methods) {
            lines.push(`${className}.prototype.${methodName} ??= _MissingSideEffect("${className}", "${methodName}") as any;`);
            fileStubCount++;
        }
        // Properties
        for (const [propName] of stubs.properties) {
            lines.push(`if (!Object.getOwnPropertyDescriptor(${className}.prototype, "${propName}")) {`);
            appendPropertyStub(lines, className, propName);
            lines.push(`}`);
            fileStubCount++;
        }
    }

    lines.push(REGION_END);

    if (fileStubCount === 0) {
        if (contentWithoutRegion !== originalContent) {
            if (DRY_RUN) {
                console.log(`[DRY RUN] Would remove stale stubs from ${relative(ROOT, targetFile)}`);
            } else if (CHECK) {
                expectedContents.set(targetFile, contentWithoutRegion);
            } else {
                writeFileSync(targetFile, contentWithoutRegion, "utf-8");
                writtenFiles.push(targetFile);
            }
            filesModified++;
        }
        continue;
    }

    const stubBlock = lines.join(eol) + eol;

    // Re-find region markers in the (possibly import-merged) content
    const finalRegionStartIdx = content.indexOf(REGION_START);
    const finalRegionEndIdx = content.indexOf(REGION_END);

    if (finalRegionStartIdx !== -1 && finalRegionEndIdx !== -1) {
        // Replace existing region (skip trailing newline, which may be \r\n or \n)
        let endSkip = finalRegionEndIdx + REGION_END.length;
        if (content[endSkip] === "\r") endSkip++;
        if (content[endSkip] === "\n") endSkip++;
        content = content.slice(0, finalRegionStartIdx) + stubBlock + content.slice(endSkip);
    } else {
        // Append at end of file
        if (!content.endsWith("\n")) content += eol;
        content += eol + stubBlock;
    }

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would write ${fileStubCount} stubs to ${relative(ROOT, targetFile)}`);
    } else if (CHECK) {
        expectedContents.set(targetFile, content);
    } else {
        writeFileSync(targetFile, content, "utf-8");
        writtenFiles.push(targetFile);
    }

    filesModified++;
    if (VERBOSE) {
        console.log(`  ${relative(ROOT, targetFile)}: ${fileStubCount} stubs`);
        for (const [className, stubs] of classMap) {
            for (const [m] of stubs.methods) console.log(`    method: ${className}.${m}()`);
            for (const [p] of stubs.properties) console.log(`    property: ${className}.${p}`);
        }
    }
}

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Phase 11: Side-Effect Stubs ===`);
console.log(`  .types.ts files parsed:  ${typesFiles.length}`);
console.log(`  Method stubs generated:  ${totalMethods}`);
console.log(`  Property stubs generated: ${totalProperties}`);
console.log(`  Internal members skipped: ${totalSkipped}`);
console.log(`  Inherited stubs pruned:  ${prunedCount}`);
console.log(`  Target files modified:    ${filesModified}`);
if (DRY_RUN) console.log(`  (dry run — no files written)`);

// ── Optional post-format: run prettier on written files ─────────────────────
if (FORMAT && writtenFiles.length > 0) {
    try {
        execFileSync("npx", ["prettier", "--write", ...writtenFiles], { cwd: REPO_ROOT, stdio: "ignore" });
    } catch {
        // prettier not available — skip silently
    }
}

// ── Check mode: compare expected vs on-disk ─────────────────────────────────
if (CHECK) {
    // Format expected content through prettier for a fair comparison
    /** @param {string} filePath @param {string} content */
    function formatContent(filePath, content) {
        try {
            return execFileSync("npx", ["prettier", "--stdin-filepath", filePath], {
                cwd: REPO_ROOT,
                input: content,
                encoding: "utf-8",
                stdio: ["pipe", "pipe", "ignore"],
            });
        } catch {
            return content;
        }
    }
    let driftCount = 0;
    for (const [filePath, expected] of expectedContents) {
        let actual = "";
        try {
            actual = readFileSync(filePath, "utf-8");
        } catch {
            // File doesn't exist on disk
        }
        if (actual !== formatContent(filePath, expected)) {
            driftCount++;
            if (driftCount <= 10) {
                console.error(`  DRIFT: ${relative(REPO_ROOT, filePath)}`);
            }
        }
    }

    for (const filePath of globSync("**/*.ts", { cwd: ROOT, absolute: true })) {
        if (expectedContents.has(filePath)) {
            continue;
        }
        let actual = "";
        try {
            actual = readFileSync(filePath, "utf-8");
        } catch {
            continue;
        }
        if (actual.includes(REGION_START)) {
            driftCount++;
            if (driftCount <= 10) {
                console.error(`  STALE: ${relative(REPO_ROOT, filePath)}`);
            }
        }
    }

    if (driftCount > 0) {
        if (driftCount > 10) {
            console.error(`  ... and ${driftCount - 10} more`);
        }
        console.error(`\n❌ ${driftCount} file(s) have out-of-date side-effect stubs.`);
        console.error(`To fix: npm run generate:side-effect-stubs\n`);
        process.exit(1);
    } else {
        console.log(`\n✅ All side-effect stubs are up-to-date.\n`);
    }
}
