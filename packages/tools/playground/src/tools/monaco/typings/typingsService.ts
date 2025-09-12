/* eslint-disable no-await-in-loop */
/* eslint-disable jsdoc/require-jsdoc */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { setupTypeAcquisition } from "@typescript/ata";
import { CreateTsShim } from "./tsService";

type AddPathsFn = (spec: string, target: string) => void;

export class TypingsService {
    private _acquired = new Set<string>();
    private _failed = new Set<string>();

    private _typeLibDisposables: monaco.IDisposable[] = [];
    private _bareStubBySpec = new Map<string, { ts: monaco.IDisposable; js: monaco.IDisposable }>();
    private _currentBare = new Set<string>();
    private _entryMapped = new Set<string>();

    // ATA runner
    private _ata: ReturnType<typeof setupTypeAcquisition>;

    constructor(private _addPaths: AddPathsFn) {
        // Heuristic: is this the entry file for the spec?
        function isEntryForSpec(path: string, spec: string) {
            const p = NormalizeVirtualPath(path);
            if (/\/@types\/[^/]+\/index\.d\.ts$/i.test(p)) {
                return true;
            }
            if (/\/dist\/index\.d\.ts$/i.test(p)) {
                return true;
            }
            if (/\/index\.d\.ts$/i.test(p)) {
                return true;
            }
            // scoped/unscoped "<spec>@<ver>/index.d.ts"
            const esc = spec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            if (new RegExp(`^node_modules/(?:@types/)?${esc}(?:@[^/]+)?/index\\.d\\.ts$`, "i").test(p)) {
                return true;
            }
            return false;
        }

        function isJson(path: string) {
            return /\.json$/i.test(path);
        }
        const ts = CreateTsShim({
            libNames: monaco.languages.typescript.typescriptDefaults.getCompilerOptions().lib ?? undefined,
        });
        this._ata = setupTypeAcquisition({
            projectName: "pg",
            typescript: ts as any,
            logger: console,
            // Optional: observe network
            // fetcher(input, init) { console.debug("ATA fetch:", input); return fetch(input, init); },
            delegate: {
                receivedFile: (code: string, path: string) => {
                    console.log("Received file", code.length, path);
                    const spec = GuessSpecFromTypesPath(path);
                    if (!spec || isJson(path)) {
                        return;
                    }

                    // Drop the stub before adding the first real file
                    if (!this._acquired.has(spec)) {
                        this._removeBareStub(spec);
                        this._removeBareStub(spec + "/*");
                    }

                    // Create a more accurate filename that preserves the actual path structure
                    const fname = `file://${spec.replace(/[^\w@/.-]/g, "_")}/index.d.ts`;

                    const d1 = monaco.languages.typescript.typescriptDefaults.addExtraLib(code, fname);
                    const d2 = monaco.languages.typescript.javascriptDefaults.addExtraLib(code, fname);
                    this._typeLibDisposables.push(d1, d2);

                    // Only map once, and only for a real entry
                    if (isEntryForSpec(path, spec) && !this._entryMapped.has(spec)) {
                        const dir = fname.replace(/\/index\.d\.ts$/i, "");
                        this._addPaths(spec, fname);
                        this._addPaths(spec + "/*", dir + "/*");
                        this._entryMapped.add(spec);
                        this._acquired.add(spec);
                    }
                },
            },
        });
    }

    dispose() {
        this._typeLibDisposables.forEach((d) => d.dispose());
        this._typeLibDisposables = [];
        for (const [, d] of this._bareStubBySpec) {
            d.ts.dispose();
            d.js.dispose();
        }
        this._bareStubBySpec.clear();
        this._acquired.clear();
        this._failed.clear();
        this._currentBare.clear();
    }

    discoverBareImports(sourceTexts: string[]): Set<string> {
        const fromRe = /\bfrom\s+['"]([^'"]+)['"]/g; // import ... from 'x'  | export ... from 'x'
        const dynRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g; // import('x')
        const bareRe = /^\s*import\s+['"]([^'"]+)['"]/gm; // import 'x'

        const specs = new Set<string>();
        for (const code of sourceTexts) {
            if (!code) {
                continue;
            }
            for (const re of [fromRe, dynRe, bareRe]) {
                re.lastIndex = 0;
                for (const m of code.matchAll(re)) {
                    const spec = (m[1] || "").trim();
                    if (!IsBare(spec)) {
                        continue;
                    }
                    specs.add(spec.split(/[?#]/)[0]); // strip ? and #
                }
            }
        }
        return specs;
    }

    installBareImportStubs(bareSpecs: Set<string>) {
        // remember what’s current (to drop stubs when real types arrive)
        this._currentBare.clear();
        for (const s of bareSpecs) {
            this._currentBare.add(NormalizeBareSpec(s).basePkg);
        }

        // Clear all existing stubs, then re-add only what we need now
        for (const [, d] of this._bareStubBySpec) {
            d.ts.dispose();
            d.js.dispose();
        }
        this._bareStubBySpec.clear();

        for (const raw of bareSpecs) {
            if (!IsBare(raw)) {
                continue;
            }
            // If we already fetched real types, no stub
            if (this._acquired.has(NormalizeBareSpec(raw).basePkg)) {
                continue;
            }
            this._addBareStub(raw);
            const { canonical } = NormalizeBareSpec(raw);
            this._addPaths(raw, canonical); // keep your resolver mapping in sync (editor-only)
        }
    }

    async acquireForAsync(sourceTexts: Set<string>) {
        this._ata(BuildSyntheticAtaEntry(sourceTexts));
    }

    // ---- internals --------------------------------------------------------

    private _addBareStub(spec: string) {
        // Allow both CJS/ESM syntaxes; also add a wildcard form for subpath imports
        const text = `declare module "${spec}" { const _m: any; export = _m; }\n` + (spec.endsWith("/*") ? "" : `declare module "${spec}/*" { const _m: any; export = _m; }\n`);
        const fname = `pg-bare/${spec.replace(/[^\w@/.-]/g, "_")}.d.ts`;
        const tsDisp = monaco.languages.typescript.typescriptDefaults.addExtraLib(text, fname);
        const jsDisp = monaco.languages.typescript.javascriptDefaults.addExtraLib(text, fname);
        this._bareStubBySpec.set(spec, { ts: tsDisp, js: jsDisp });

        if (!spec.endsWith("/*")) {
            const w = `${spec}/*`;
            const wText = `declare module "${w}" { const _m: any; export = _m; }\n`;
            const wFname = `pg-bare/${w.replace(/[^\w@/.-]/g, "_")}.d.ts`;
            const wTs = monaco.languages.typescript.typescriptDefaults.addExtraLib(wText, wFname);
            const wJs = monaco.languages.typescript.javascriptDefaults.addExtraLib(wText, wFname);
            this._bareStubBySpec.set(w, { ts: wTs, js: wJs });
        }
    }

    private _removeBareStub(spec: string) {
        const d = this._bareStubBySpec.get(spec);
        if (d) {
            d.ts.dispose();
            d.js.dispose();
            this._bareStubBySpec.delete(spec);
        }
    }
}

// ---- helpers --------------------------------------------------------------

function IsBare(spec: string) {
    if (!spec) {
        return false;
    }
    if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") || spec.startsWith("__pg__/") || spec.startsWith("data:")) {
        return false;
    }
    return true;
}

function NormalizeBareSpec(spec: string): { raw: string; canonical: string; basePkg: string } {
    const raw = spec;
    let s = spec.replace(/^npm:|^pkg:/, "");

    // If a full URL, keep just the path (drop host) and strip query/hash
    if (/^https?:\/\//i.test(s)) {
        try {
            const u = new URL(s);
            s = u.pathname.replace(/^\/+/, "");
        } catch {
            /* noop */
        }
    }

    // Drop version on the first pkg segment but keep subpath
    const scoped = s.startsWith("@");
    const parts = s.split("/");
    const pkg = scoped ? parts.slice(0, 2).join("/") : parts[0];
    const rest = scoped ? parts.slice(2) : parts.slice(1);
    const pkgNoVer = pkg.replace(/@[^/]+$/, ""); // trailing @version → ""
    const canonical = [pkgNoVer, ...rest].filter(Boolean).join("/");
    const basePkg = pkgNoVer;
    return { raw, canonical, basePkg };
}

function NormalizeVirtualPath(path: string) {
    return path
        .replace(/^\/node_modules\//, "")
        .replace(/^\/+/, "")
        .replace(/\?[^#]*$/, "")
        .replace(/#[\s\S]*$/, "");
}

function GuessSpecFromTypesPath(p: string): string | null {
    // Examples of p:
    //   "@types/lodash/index.d.ts"
    //   "lodash@4.17.21/index.d.ts"
    //   "lodash-es@4.17.21/index.d.ts"
    //   "@types/react/index.d.ts"
    //   "@types/react-dom/client.d.ts"
    //   "react@18.3.1/index.d.ts"
    if (!p) {
        return null;
    }
    p = p.replace(/^\/node_modules\//, "");
    const clean = p.replace(/^\/+/, "");
    const seg0 = clean.split("/")[0] || "";

    if (seg0 === "@types") {
        // @types/<name>[/...]
        const after = clean.split("/").slice(1);
        if (after.length === 0) {
            return null;
        }
        const name = after[0];
        // scoped dts are published as @types/<scope>__<name>
        if (name.includes("__")) {
            const [scope, pkg] = name.split("__");
            return `@${scope}/${pkg}`;
        }
        return name;
    }

    // non-@types: "<pkg>@<ver>/..."
    const first = seg0;
    if (!first) {
        return null;
    }

    if (first.startsWith("@")) {
        // scoped: "@scope/name@x.y.z"
        const m = first.match(/^(@[^/]+\/[^@/]+)(?:@[^/]+)?$/);
        return m ? m[1] : null;
    }
    // unscoped: "name@x.y.z"
    const m = first.match(/^([^@/]+)(?:@[^/]+)?$/);
    return m ? m[1] : null;
}

function BuildSyntheticAtaEntry(bare: Set<string>) {
    // ATA only needs to see bare specifiers; a tiny file is enough.
    // Use side-effect imports to keep it minimal and order-stable.
    return Array.from(bare)
        .map((s) => `import "${s}";`)
        .join("\n");
}
