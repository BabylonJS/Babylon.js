/* eslint-disable no-await-in-loop */
/* eslint-disable jsdoc/require-jsdoc */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { setupTypeAcquisition } from "@typescript/ata";
import { CreateTsShim } from "./tsService";
import { BlocklistBase } from "./constants";
import type { AddPathsFn, RequestLocalResolve } from "./types";
import { BasePackage, BuildSyntheticAtaEntry, CanonicalSpec, IsBare, IsNodeish, NormalizeVirtualPath, ParseSpec, SanitizeSpecifier } from "./utils";

export class TypingsService {
    private _acquired = new Set<string>();
    private _failed = new Set<string>();

    private _typeLibDisposables: monaco.IDisposable[] = [];
    private _bareStubBySpec = new Map<string, { ts: monaco.IDisposable; js: monaco.IDisposable }>();
    private _currentBare = new Set<string>();
    private _entryMapped = new Set<string>();
    private _versionsByBase = new Map<string, Set<string>>();
    private _pinnedByBase = new Map<string, string>(); // base -> version
    private _requestedNamesBySpec = new Map<string, Set<string>>();

    // Local resolution support
    private _pendingLocal = new Set<string>(); // fullSpec waiting to be mapped
    private _localLibsBySpec = new Map<string, monaco.IDisposable[]>();
    private _localDirBySpec = new Map<string, string>();

    // ATA runner
    private _ata: ReturnType<typeof setupTypeAcquisition>;
    private _ataInFlight = false;
    private _ataSafetyTimer: number | undefined;
    private _ata404s = 0;

    constructor(
        private _addPaths: AddPathsFn,
        private _onRequestLocalResolve?: (req: RequestLocalResolve) => void
    ) {
        function toVfsUriFromAtaPath(path: string) {
            // put everything under file:///...
            const clean = NormalizeVirtualPath(path);
            return `file:///${clean}`;
        }
        function isEntryDts(path: string) {
            const p = NormalizeVirtualPath(path);
            if (/\/@types\/node\//i.test(p)) {
                return false;
            }
            return /\/index\.d\.ts$/i.test(p);
        }

        const baseFromUrl = (u: string): string | null => {
            try {
                const m = u.match(/\/npm\/((?:@[^/]+\/)?[^@/]+)(?:@[^/]+)?\//i);
                return m ? decodeURIComponent(m[1]) : null;
            } catch {
                return null;
            }
        };

        // helper: true if this URL targets a blocked package
        const isBlockedPkgUrl = (u: string): boolean => {
            const base = baseFromUrl(u);
            return !!(base && BlocklistBase.has(base));
        };

        const ts = CreateTsShim({
            libNames: monaco.languages.typescript.typescriptDefaults.getCompilerOptions().lib ?? undefined,
        });

        const fetcherAsync: (input: RequestInfo, init?: RequestInit) => Promise<Response> = async (input, init) => {
            let url = typeof input === "string" ? input : input.url;

            if (url.includes("/npm/")) {
                // scoped or unscoped, any version token
                url = url.replace(/\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)@latest(?=\/|$)/, "/npm/$1@$2");
            }

            if (isBlockedPkgUrl(url)) {
                this._ata404s++;
                return new Response("blocked-by-policy", { status: 404 });
            }

            const pinVersionInUrl = (u: string) => {
                // jsDelivr metadata endpoint
                u = u.replace(/(\/v1\/package\/npm\/)((?:@[^/]+\/)?[^@/]+)@latest\b/gi, (m, pre, base) => {
                    if (base.startsWith("@types/")) {
                        return m;
                    }
                    const v = this._pinnedByBase.get(base);
                    return v ? `${pre}${base}@${v}` : m;
                });
                // generic /npm/<pkg>[@ver]/...
                u = u.replace(/(\/npm\/)((?:@[^/]+\/)?[^@/]+)(?:@([^/]+))?(?=\/|$)/gi, (m, pre, base, ver) => {
                    if (base.startsWith("@types/")) {
                        return m;
                    }
                    const v = this._pinnedByBase.get(base);
                    if (!v) {
                        return m;
                    }
                    // If no version or "latest", insert the pinned version
                    if (!ver || ver.toLowerCase() === "latest") {
                        return `${pre}${base}@${v}`;
                    }
                    return m;
                });
                return u;
            };

            url = pinVersionInUrl(url);

            // jsDelivr resolve endpoint often sees quoted specs from upstream — strip them:
            url = url.replace(/%22/g, ""); // remove encoded quotes
            url = url.replace(/"([^"]+)"/g, "$1"); // belt-and-suspenders for unencoded quotes

            // quick denylist: if it’s trying to resolve a node builtin, short-circuit
            const m = url.match(/\/npm\/([^@/]+)@/);
            if (m && IsNodeish(decodeURIComponent(m[1]))) {
                this._ata404s++;
                return new Response("builtin-ignored", { status: 404 });
            }

            // stop-the-bleed if we’ve seen too many 404s this run
            if (this._ata404s >= 20) {
                return new Response("too-many-404s", { status: 429 });
            }

            // timeout wrapper
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            try {
                if (/\/npm\/.+\/package\.json(?:$|\?)/i.test(url)) {
                    const res2 = await fetch(url, { ...(init ?? {}), signal: controller.signal });
                    if (!res2.ok) {
                        return res2;
                    }
                    // eslint-disable-next-line
                    const pkg = await res2.json().catch(() => null);
                    if (pkg && typeof pkg === "object") {
                        const stripped = {
                            ...pkg,
                            dependencies: {},
                            devDependencies: {},
                            optionalDependencies: {},
                            peerDependencies: {},
                            // Also neuter "exports" that sometimes point to deep trees, but keep "types".
                            // eslint-disable-next-line
                            exports: pkg.types ? { ".": { types: pkg.types } } : undefined,
                        };
                        return new Response(JSON.stringify(stripped), {
                            status: 200,
                            // eslint-disable-next-line
                            headers: { "content-type": "application/json" },
                        });
                    }
                    return res2;
                } else {
                    const res = await fetch(url, { ...(init ?? {}), signal: controller.signal });
                    if (res.status === 404) {
                        this._ata404s++;
                    }
                    return res;
                }
            } finally {
                clearTimeout(timer);
            }
        };
        this._ata = setupTypeAcquisition({
            projectName: "pg",
            typescript: ts as any,
            logger: console,
            fetcher: fetcherAsync as any,
            delegate: {
                started: () => {
                    this._ataInFlight = true;
                    this._ata404s = 0;
                    clearTimeout(this._ataSafetyTimer);
                    this._ataSafetyTimer = window.setTimeout(() => {
                        this._ataInFlight = false;
                    }, 10_000);
                },
                finished: () => {
                    this._ataInFlight = false;
                    clearTimeout(this._ataSafetyTimer);
                },

                receivedFile: (code: string, path: string) => {
                    // Ignore JSON and Node types
                    if (!path || /\.json$/i.test(path) || path.includes("@types/node/")) {
                        return;
                    }

                    const vuri = toVfsUriFromAtaPath(path);
                    const d1 = monaco.languages.typescript.typescriptDefaults.addExtraLib(code, vuri);
                    const d2 = monaco.languages.typescript.javascriptDefaults.addExtraLib(code, vuri);
                    this._typeLibDisposables.push(d1, d2);

                    if (!isEntryDts(path)) {
                        return;
                    }

                    // Figure out which base package this file corresponds to:
                    //   - If it's an @types package, map '@types/<name>' -> '<name>' base.
                    //   - Else if path looks like '<name>@<ver>/index.d.ts', use that base.
                    const clean = NormalizeVirtualPath(path);
                    let base: string | null = null;

                    // @types/foo[/...]/index.d.ts
                    const typesMatch = clean.match(/(?:^|\/)@types\/([^/]+)\/index\.d\.ts$/i);
                    if (typesMatch) {
                        const name = typesMatch[1];
                        // scoped dts publish as @types/<scope>__<name>
                        if (name.includes("__")) {
                            const [scope, pkg] = name.split("__");
                            base = `@${scope}/${pkg}`;
                        } else {
                            base = name;
                        }
                    } else {
                        // foo@1.2.3/index.d.ts or @scope/foo@1.2.3/index.d.ts or foo/index.d.ts
                        const m = clean.match(/(?:^|\/)((?:@[^/]+\/)?[^/@]+)(?:@[^/]+)?\/index\.d\.ts$/i);
                        if (m) {
                            base = m[1];
                        }
                    }
                    if (!base) {
                        return;
                    }

                    const vers = this._versionsByBase.get(base);
                    const vdir = vuri.replace(/\/index\.d\.ts$/i, "");

                    if (vers && vers.size) {
                        for (const fullSpec of vers) {
                            this._removeBareStub(fullSpec);
                            this._removeBareStub(fullSpec + "/*");

                            this._addPaths(fullSpec, `${vdir}/index.d.ts`);
                            this._addPaths(fullSpec + "/*", `${vdir}/*`);

                            this._entryMapped.add(fullSpec);
                            this._acquired.add(fullSpec);
                        }
                    } else {
                        if (!this._entryMapped.has(base)) {
                            this._addPaths(base, `${vdir}/index.d.ts`);
                            this._addPaths(base + "/*", `${vdir}/*`);
                            this._entryMapped.add(base);
                            this._acquired.add(base);
                        }
                    }
                },
            },
        });
    }

    public get bareImports(): Set<string> {
        return this._currentBare;
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

    private _rememberVersionedSpec(raw: string) {
        const p = ParseSpec(raw);
        const base = BasePackage(p);
        if (!this._versionsByBase.has(base)) {
            this._versionsByBase.set(base, new Set());
        }
        this._versionsByBase.get(base)!.add(CanonicalSpec(p)); // store full (maybe versioned) spec
    }

    discoverBareImports(sourceTexts: string[]): Set<string> {
        this._requestedNamesBySpec.clear();

        const specs = new Set<string>();

        // import { A, B as C } from 'x'
        const namedRe = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
        // import Default, { A } from 'x'
        const mixedRe = /import\s+([A-Za-z_$][\w$]*)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
        // import Default from 'x'
        const defRe = /import\s+([A-Za-z_$][\w$]*)\s*from\s*['"]([^'"]+)['"]/g;

        // import ... from 'x'  | export ... from 'x'
        const fromRe = /\bfrom\s+['"]([^'"]+)['"]/g;
        // import('x')
        const dynRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        // import 'x'
        const bareRe = /^\s*import\s+['"]([^'"]+)['"]/gm;

        const remember = (specRaw: string, names: string[] = []) => {
            const spec = specRaw.split(/[?#]/)[0].trim();
            if (!IsBare(spec)) {
                return;
            }
            specs.add(spec);

            const key = CanonicalSpec(ParseSpec(spec)); // keep version if present
            if (!names.length) {
                return;
            }
            const set = this._requestedNamesBySpec.get(key) ?? new Set<string>();
            for (const n of names) {
                set.add(n);
            }
            this._requestedNamesBySpec.set(key, set);
        };

        const parseNamedList = (s: string) =>
            s
                .split(",")
                .map((x) => x.trim())
                .flatMap((x) => {
                    // handle "X as Y" — add both X and Y (safe)
                    const m = x.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/i);
                    return m ? (m[2] ? [m[1], m[2]] : [m[1]]) : [];
                });

        for (const code of sourceTexts) {
            if (!code) {
                continue;
            }

            // collect specifiers first (for names)
            for (const m of code.matchAll(mixedRe)) {
                const def = m[1],
                    list = m[2],
                    spec = m[3];
                remember.call(this, spec, [def, ...parseNamedList(list)]);
            }
            for (const m of code.matchAll(namedRe)) {
                remember.call(this, m[2], parseNamedList(m[1]));
            }
            for (const m of code.matchAll(defRe)) {
                remember.call(this, m[2], [m[1]]);
            }

            // also keep plain/bare specs
            for (const re of [fromRe, dynRe, bareRe]) {
                re.lastIndex = 0;
                for (const m of code.matchAll(re)) {
                    remember.call(this, m[1]);
                }
            }
        }

        return specs;
    }

    installBareImportStubs(bareSpecs: Set<string>) {
        this._currentBare.clear();

        // Rebuild version map for the current source set
        this._versionsByBase.clear();

        // Clear existing stubs first
        for (const [, d] of this._bareStubBySpec) {
            d.ts.dispose();
            d.js.dispose();
        }
        this._bareStubBySpec.clear();

        for (const raw of bareSpecs) {
            if (!IsBare(raw)) {
                continue;
            }

            const p = ParseSpec(raw);
            const base = BasePackage(p);
            const full = CanonicalSpec(p); // keeps version

            if (p.version === "local") {
                // Emit stubs so code keeps compiling while we wait.
                if (!this._acquired.has(full)) {
                    this._addBareStub(full);
                }
                // mark as pending + notify UI once
                if (!this._entryMapped.has(full) && !this._pendingLocal.has(full)) {
                    this._pendingLocal.add(full);
                    this._onRequestLocalResolve?.({ base, fullSpec: full });
                }
                // Don’t add a fake path here; we’ll map after user picks a folder.
                continue;
            }

            this._currentBare.add(base);
            if (p.version) {
                this._pinnedByBase.set(base, p.version);
            }

            this._rememberVersionedSpec(raw);

            // If real types already arrived for this *exact* spec, skip stub
            if (this._acquired.has(full)) {
                continue;
            }

            // Add stub for the exact spec + wildcard
            this._addBareStub(full);

            // Map the exact spec to a versioned "virtual" entry (so TS can resolve imports immediately)
            const vdir = `file:///${p.name}${p.version ? `@${p.version}` : ""}`;
            this._addPaths(full, `${vdir}/index.d.ts`);
            this._addPaths(full + "/*", `${vdir}/*`);
        }
    }
    private _firstFetch = true;
    async acquireForAsync(sourceTexts: Set<string>) {
        if (this._ataInFlight) {
            return;
        }

        const candidates = new Set(
            Array.from(sourceTexts)
                .map(SanitizeSpecifier)
                .filter((s) => IsBare(s))
                .filter((s) => !/@local$/.test(s))
                .filter((s) => !IsNodeish(s))
                .filter((s) => !this._acquired.has(CanonicalSpec(ParseSpec(s))))
                .filter((s) => !BlocklistBase.has(BasePackage(ParseSpec(s))))
        );
        if (candidates.size === 0) {
            return;
        }

        const ataCandidates = new Set<string>();
        for (const s of candidates) {
            ataCandidates.add(BasePackage(ParseSpec(s))); // drop @version + subpath
        }
        if (this._firstFetch) {
            ataCandidates.add("react");
            ataCandidates.add("react-dom");
            ataCandidates.add("@types/react");
            ataCandidates.add("@types/react-dom");
            ataCandidates.add("react/jsx-runtime");
            this._firstFetch = false;
        }
        this._ataInFlight = true;
        await this._ata(BuildSyntheticAtaEntry(ataCandidates));
    }

    public collectBareFromSources(sourceTexts: string[]): Set<string> {
        return this.discoverBareImports(sourceTexts);
    }

    public getBareImportsSnapshot(): Set<string> {
        return new Set(this._currentBare);
    }

    public getPinnedVersion(base: string): string | undefined {
        return this._pinnedByBase.get(base);
    }

    /**
     * Wait for any in-flight ATA requests to complete
     * @param timeoutMs Maximum time to wait in milliseconds
     * @returns Promise that resolves when ATA is complete or timeout is reached
     */
    async waitForAtaCompletionAsync(timeoutMs = 5000): Promise<boolean> {
        if (!this._ataInFlight) {
            return true;
        }

        const startTime = Date.now();
        while (this._ataInFlight && Date.now() - startTime < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return !this._ataInFlight;
    }

    /**
     * Check if ATA is currently in flight
     */
    get isAtaInFlight(): boolean {
        return this._ataInFlight;
    }

    private _disposeLocalFor(fullSpec: string) {
        const arr = this._localLibsBySpec.get(fullSpec);
        if (arr && arr.length) {
            for (const d of arr) {
                try {
                    d.dispose();
                } catch {}
            }
        }
        this._localLibsBySpec.delete(fullSpec);
        this._localDirBySpec.delete(fullSpec);

        this._removeBareStub(fullSpec);
        this._removeBareStub(fullSpec + "/*");
    }

    public async mapLocalTypingsAsync(fullSpec: string, dirName: string, files: Array<{ path: string; content: string; lastModified: number }>) {
        this._disposeLocalFor(fullSpec);

        const perSpecDisposables: monaco.IDisposable[] = [];
        for (const f of files) {
            const normPath = f.path.replace(/\\/g, "/");
            const vuri = `file:///local/${dirName}/${normPath}`;
            perSpecDisposables.push(
                monaco.languages.typescript.typescriptDefaults.addExtraLib(f.content, vuri),
                monaco.languages.typescript.javascriptDefaults.addExtraLib(f.content, vuri)
            );
        }
        this._localLibsBySpec.set(fullSpec, perSpecDisposables);
        this._localDirBySpec.set(fullSpec, dirName);

        this._typeLibDisposables.push(...perSpecDisposables);

        const pickEntry = () => {
            const has = (p: string) => files.some((f) => f.path.replace(/\\/g, "/") === p);
            if (has("index.d.ts")) {
                return `file:///local/${dirName}/index.d.ts`;
            }

            const pkgJson = files.find((f) => f.path.replace(/\\/g, "/") === "package.json");
            if (pkgJson) {
                try {
                    const pkg = JSON.parse(pkgJson.content);
                    const fromPkg = typeof pkg.types === "string" ? pkg.types : typeof pkg.typings === "string" ? pkg.typings : null;
                    if (fromPkg) {
                        return `file:///local/${dirName}/${fromPkg.replace(/^\.\//, "")}`.replace(/\\/g, "/");
                    }
                } catch {}
            }

            const idx = files.find((f) => /(?:^|\/)index\.d\.ts$/i.test(f.path.replace(/\\/g, "/")));
            if (idx) {
                return `file:///local/${dirName}/${idx.path.replace(/\\/g, "/")}`;
            }

            const any = files.find((f) => f.path.toLowerCase().endsWith(".d.ts"));
            if (any) {
                return `file:///local/${dirName}/${any.path.replace(/\\/g, "/")}`;
            }

            return null;
        };

        const entry = pickEntry();
        if (!entry) {
            this._disposeLocalFor(fullSpec);
            return;
        }

        const p = ParseSpec(fullSpec);
        const base = BasePackage(p);
        const vdir = entry.replace(/\/index\.d\.ts$/i, "").replace(/\.d\.ts$/i, "");

        this._addPaths(base, entry);
        this._addPaths(base + "/*", vdir + "/*");
        this._addPaths(fullSpec, entry);
        this._addPaths(fullSpec + "/*", vdir + "/*");

        this._entryMapped.add(base);
        this._entryMapped.add(fullSpec);
        this._acquired.add(base);
        this._acquired.add(fullSpec);

        this._pendingLocal.delete(fullSpec);
    }

    private _addBareStub(spec: string) {
        // Guard local - this should always be renewed explicitly
        if (/@local$/.test(spec)) {
            return;
        }
        const names = this._requestedNamesBySpec.get(spec) ?? this._requestedNamesBySpec.get(BasePackage(ParseSpec(spec))) ?? new Set<string>();
        let text = `declare module "${spec}" {\n  const __def: any;\n  export default __def;\n`;
        for (const n of names) {
            if (!n || !/^[A-Za-z_$][\w$]*$/.test(n)) {
                continue;
            }
            text += `  export const ${n}: any;\n`;
        }
        text += `}\n`;

        const fname = `pg-bare/${spec.replace(/[^\w@/.-]/g, "_")}.d.ts`;
        const tsDisp = monaco.languages.typescript.typescriptDefaults.addExtraLib(text, fname);
        const jsDisp = monaco.languages.typescript.javascriptDefaults.addExtraLib(text, fname);
        this._bareStubBySpec.set(spec, { ts: tsDisp, js: jsDisp });

        if (!spec.endsWith("/*")) {
            const w = `${spec}/*`;
            const wText = `declare module "${w}" { const __any: any; export default __any; }\n`;
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
