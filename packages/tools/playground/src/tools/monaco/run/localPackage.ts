/* eslint-disable no-await-in-loop */
/* eslint-disable github/no-then */
/* eslint-disable jsdoc/require-jsdoc */

import * as lexer from "es-module-lexer";

lexer.initSync();

export type DirHandle = FileSystemDirectoryHandle;

async function FileFromHandle(root: DirHandle, path: string): Promise<File | null> {
    const parts = path.split("/").filter(Boolean);
    let cur: any = root;
    for (let i = 0; i < parts.length - 1; i++) {
        cur = await cur.getDirectoryHandle(parts[i], { create: false }).catch(() => null);
        if (!cur) {
            return null;
        }
    }
    const fh = await cur.getFileHandle(parts[parts.length - 1], { create: false }).catch(() => null);
    if (!fh) {
        return null;
    }
    return await fh.getFile();
}

async function ReadTextIfExists(root: DirHandle, path: string) {
    const f = await FileFromHandle(root, path);
    return f ? await f.text() : null;
}

async function WalkLocalJs(root: DirHandle) {
    const out: Array<{ path: string; code: string; isJson: boolean }> = [];
    const skipDir = /^(node_modules|\.git|\.hg|\.svn|\.idea|\.vscode)$/i;

    const walkAsync = async (dir: DirHandle, prefix = "") => {
        // @ts-expect-error dir handle
        for await (const entry of dir.values()) {
            if (entry.kind === "directory") {
                if (skipDir.test(entry.name)) {
                    continue;
                }
                await walkAsync(entry as DirHandle, `${prefix}${entry.name}/`);
            } else {
                const name = entry.name.toLowerCase();
                const isJs = /\.(mjs|js|cjs)$/i.test(name);
                const isJson = /\.json$/i.test(name);
                if (!isJs && !isJson) {
                    continue;
                }
                const file = await (entry as any).getFile();
                out.push({ path: `${prefix}${entry.name}`, code: await file.text(), isJson });
            }
        }
    };
    await walkAsync(root, "");
    return out;
}

function PickEntryFromPkgJson(pkg: any): string | null {
    const expDot = pkg?.exports && typeof pkg.exports === "object" && typeof pkg.exports["."] === "string" ? pkg.exports["."] : null;
    return (
        expDot ??
        (typeof pkg?.module === "string" ? pkg.module : null) ??
        (typeof pkg?.browser === "string" ? pkg.browser : null) ??
        (typeof pkg?.main === "string" ? pkg.main : null)
    );
}

function NormalizeEntryGuess(files: string[]): string | null {
    const candidates = ["index.mjs", "index.js", "index.cjs", "dist/index.mjs", "dist/index.js", "dist/index.cjs"];
    for (const c of candidates) {
        if (files.includes(c)) {
            return c;
        }
    }
    return null;
}

function RewriteLocalRelativeImports(pkgName: string, relPath: string, code: string) {
    const { parse } = lexer;
    const [imports] = parse(code);
    if (!imports.length) {
        return code;
    }

    // resolve "relPath" parent folder for "./" and "../"
    const resolveRel = (from: string, spec: string) => {
        const base = from.split("/");
        base.pop();
        const segs = spec.split("/");
        for (const s of segs) {
            if (!s || s === ".") {
                continue;
            }
            if (s === "..") {
                base.pop();
            } else {
                base.push(s);
            }
        }
        return base.join("/");
    };

    let out = "";
    let last = 0;
    for (const im of imports) {
        const spec = im.n as string | undefined;
        if (!spec) {
            continue;
        }
        const isRel = spec.startsWith("./") || spec.startsWith("../");
        let replacement = spec;
        if (isRel) {
            const target = resolveRel(relPath, spec);
            replacement = `${pkgName}@local/${target}`;
        }
        out += code.slice(last, im.s) + replacement;
        last = im.e;
    }
    out += code.slice(last);
    return out;
}

export async function BuildLocalPackageImportMap(
    pkgSpec: string, // e.g. "shader-object@local" or "@scope/pkg@local"
    handle: DirHandle
): Promise<Record<string, string>> {
    const pkgName = pkgSpec.replace(/@local$/, "");
    const pkgJsonText = await ReadTextIfExists(handle, "package.json");
    const pkgJson = pkgJsonText ? JSON.parse(pkgJsonText) : {};
    const files = await WalkLocalJs(handle);
    const allPaths = files.map((f) => f.path);

    let entry = PickEntryFromPkgJson(pkgJson);
    if (entry && entry.startsWith("./")) {
        entry = entry.slice(2);
    }
    if (!entry) {
        entry = NormalizeEntryGuess(allPaths) || null;
    }
    if (!entry) {
        entry = allPaths.find((p) => /\.(mjs|js|cjs)$/i.test(p)) || null;
    }
    if (!entry) {
        return {};
    }

    const urls: Record<string, string> = {};
    for (const f of files) {
        let code = f.code;
        if (f.isJson) {
            code = `export default ${code.trim()};`;
        } else if (/\.cjs$/i.test(f.path)) {
            code = `const module = { exports: {} }, exports = module.exports;\n${code}\nexport default module.exports;`;
        }
        code = RewriteLocalRelativeImports(pkgName, f.path, code);

        const blob = new Blob([code], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        urls[`${pkgName}@local/${f.path}`] = url;
    }

    if (entry) {
        urls[`${pkgName}@local`] = urls[`${pkgName}@local/${entry}`];
    }
    return urls;
}
