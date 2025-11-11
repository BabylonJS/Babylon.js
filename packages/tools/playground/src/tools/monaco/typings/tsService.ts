// super-minimal TS shim for @typescript/ata, with lib refs + positions
import { initSync, parse } from "es-module-lexer";
initSync();

// /// <reference types="node" />
const TypesRefRe = /\/\/\/\s*<reference\s+types\s*=\s*["']([^"']+)["']\s*\/>/g;
// /// <reference lib="dom" />
const LibRefRe = /\/\/\/\s*<reference\s+lib\s*=\s*["']([^"']+)["']\s*\/>/g;
// /// <reference path="./foo.d.ts" />
const PathRefRe = /\/\/\/\s*<reference\s+path\s*=\s*["']([^"']+)["']\s*\/>/g;

function CapPos(text: string, m: RegExpMatchArray, group = 1) {
    const start = (m.index ?? 0) + m[0].indexOf(m[group]);
    return { pos: start, end: start + m[group].length };
}

function CollectRefs(text: string, re: RegExp) {
    const out: { fileName: string; pos: number; end: number }[] = [];
    for (const m of text.matchAll(re)) {
        const { pos, end } = CapPos(text, m, 1);
        out.push({ fileName: m[1], pos, end });
    }
    return out;
}
const DefaultLibNames = [
    "dom",
    "dom.iterable",
    "webworker",
    "scripthost",
    "es5",
    "es2015",
    "es2015.promise",
    "es2016",
    "es2017",
    "es2018",
    "es2019",
    "es2020",
    "es2021",
    "es2022",
    "es2023",
    "es2024",
    "esnext",
];

/**
 * Create a TypeScript shim for the specified options.
 * @param opts Options for the TypeScript shim.
 * @returns The created TypeScript shim.
 */
export function CreateTsShim(opts?: { libNames?: string[] }) {
    const libNames = opts?.libNames ?? DefaultLibNames;
    const libMap = new Map(libNames.map((n) => [n, true] as const));

    const tsShim = {
        version: "5.x-shim",
        libMap, // used by ATA to ignore lib refs
        preProcessFile(text: string) {
            let imports: { s: number; e: number }[] = [];
            try {
                imports = parse(text)[0] as any as { s: number; e: number }[];
            } catch {
                return {
                    referencedFiles: [],
                    importedFiles: [],
                    libraryReferencedFiles: [],
                    typeReferenceDirectives: [],
                    libReferenceDirectives: [],
                    amdDependencies: [],
                    hasNoDefaultLib: false,
                    isLibFile: false,
                };
            }

            // import specifiers (static + dynamic) with real positions
            const importedFiles = imports.map((i) => ({
                fileName: text.slice(i.s, i.e),
                pos: i.s,
                end: i.e,
            }));

            // triple-slash refs
            const typeReferenceDirectives = CollectRefs(text, TypesRefRe);
            const libReferenceDirectives = CollectRefs(text, LibRefRe);
            const referencedFiles = CollectRefs(text, PathRefRe);

            return {
                referencedFiles,
                importedFiles,
                libraryReferencedFiles: [],
                typeReferenceDirectives,
                libReferenceDirectives,
                amdDependencies: [],
                hasNoDefaultLib: false,
                isLibFile: false,
            };
        },
    } as const;

    return tsShim;
}
