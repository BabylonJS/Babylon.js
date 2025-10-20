/* eslint-disable jsdoc/require-jsdoc */

import type { ParsedSpec } from "./types";
import { NodeBuiltins } from "./constants";

export function IsBare(spec: string) {
    if (!spec) {
        return false;
    }
    if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") || spec.startsWith("__pg__/") || spec.startsWith("data:")) {
        return false;
    }
    return true;
}

export function NormalizeVirtualPath(path: string) {
    return path
        .replace(/^\/node_modules\//, "")
        .replace(/^\/+/, "")
        .replace("/dist/", "/")
        .replace(/\?[^#]*$/, "")
        .replace(/#[\s\S]*$/, "");
}
export function BuildSyntheticAtaEntry(bare: Set<string>) {
    const bases = new Set<string>();
    for (const s of bare) {
        const p = ParseSpec(s);
        bases.add(BasePackage(p));
    }
    return Array.from(bases)
        .map((b) => `import "${b}";`)
        .join("\n");
}

export function ParseSpec(rawIn: string): ParsedSpec {
    let raw = rawIn.replace(/^npm:|^pkg:/, "");
    if (/^https?:\/\//i.test(raw)) {
        try {
            const u = new URL(raw);
            raw = u.pathname.replace(/^\/+/, "");
        } catch {}
    }

    const scoped = raw.startsWith("@");
    const parts = raw.split("/");
    const pkgOrScoped = scoped ? parts.slice(0, 2).join("/") : parts[0];
    const rest = scoped ? parts.slice(2) : parts.slice(1);

    let name = pkgOrScoped;
    let version: string | undefined;

    const m = pkgOrScoped.match(scoped ? /^(@[^/]+\/[^@/]+)(?:@([^/]+))?$/ : /^([^@/]+)(?:@([^/]+))?$/);
    if (m) {
        name = m[1];
        version = m[2];
    }

    const subpath = rest.length ? rest.join("/") : undefined;
    return { raw: rawIn, name, version, subpath, scoped };
}

// Canonical spec string preserving version + subpath
export function CanonicalSpec(p: ParsedSpec): string {
    const head = p.version ? `${p.name}@${p.version}` : p.name;
    return p.subpath ? `${head}/${p.subpath}` : head;
}

// Base package (no version, no subpath)
export function BasePackage(p: ParsedSpec): string {
    return p.name;
}

export function IsNodeish(spec: string) {
    return spec.startsWith("node:") || NodeBuiltins.has(spec);
}
export function SanitizeSpecifier(s: string) {
    s = s.replace(/^['"]|['"]$/g, "");
    try {
        s = decodeURIComponent(s);
    } catch {
        /* noop */
    }
    return s;
}
