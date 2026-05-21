import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { basename, extname, join } from "path";

export const SIDE_EFFECTS_MANIFEST_VERSION = 1;
const DEFAULT_PACKAGE = "core";
const ROOT_SHARD = "_root";

function sortedUnique(values) {
    return [...new Set(values)].sort();
}

function compareCodePoint(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

function getShardName(file) {
    const separatorIndex = file.indexOf("/");
    return separatorIndex === -1 ? ROOT_SHARD : file.slice(0, separatorIndex);
}

function createShardManifest(entries) {
    const files = {};
    for (const entry of entries) {
        files[entry.file] = sortedUnique(entry.sideEffects.map((sideEffect) => sideEffect.type));
    }

    return { version: SIDE_EFFECTS_MANIFEST_VERSION, files };
}

function formatStringArray(values) {
    return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function formatCompactManifest(manifest) {
    const fileEntries = Object.entries(manifest.files).sort((a, b) => compareCodePoint(a[0], b[0]));
    const lines = ["{", `    "version": ${manifest.version},`, `    "files": {`];

    for (let index = 0; index < fileEntries.length; index++) {
        const [file, sideEffects] = fileEntries[index];
        const comma = index === fileEntries.length - 1 ? "" : ",";
        lines.push(`        ${JSON.stringify(file)}: ${formatStringArray(sideEffects)}${comma}`);
    }

    lines.push("    }", "}");
    return lines.join("\n") + "\n";
}

function toEntry(file, sideEffects) {
    return {
        file,
        sideEffects: sortedUnique(sideEffects).map((type) => ({ type })),
    };
}

export function createCompactSideEffectsManifest(entries) {
    return createShardManifest(entries);
}

export function normalizeSideEffectsManifest(raw) {
    if (raw?.files && !Array.isArray(raw.files)) {
        const manifest = Object.entries(raw.files)
            .map(([file, sideEffects]) => toEntry(file, sideEffects))
            .sort((a, b) => compareCodePoint(a.file, b.file));

        return { version: raw.version ?? SIDE_EFFECTS_MANIFEST_VERSION, manifest, files: createCompactSideEffectsManifest(manifest).files };
    }

    if (Array.isArray(raw?.files)) {
        const manifest = raw.files.map((file) => toEntry(file, [])).sort((a, b) => compareCodePoint(a.file, b.file));
        return { version: raw.version ?? SIDE_EFFECTS_MANIFEST_VERSION, manifest, files: createCompactSideEffectsManifest(manifest).files };
    }

    if (Array.isArray(raw?.manifest)) {
        const manifest = raw.manifest
            .map((entry) =>
                toEntry(
                    entry.file,
                    entry.sideEffects.map((sideEffect) => sideEffect.type)
                )
            )
            .sort((a, b) => compareCodePoint(a.file, b.file));

        return { version: raw.version ?? 0, manifest, files: createCompactSideEffectsManifest(manifest).files };
    }

    throw new Error("Unsupported side-effects manifest format.");
}

export function readSideEffectsManifest(path) {
    if (statSync(path).isDirectory()) {
        const files = {};
        for (const entry of readdirSync(path, { withFileTypes: true })) {
            if (!entry.isFile() || extname(entry.name) !== ".json") {
                continue;
            }

            Object.assign(files, normalizeSideEffectsManifest(JSON.parse(readFileSync(join(path, entry.name), "utf-8"))).files);
        }

        return normalizeSideEffectsManifest({ version: SIDE_EFFECTS_MANIFEST_VERSION, files });
    }

    return normalizeSideEffectsManifest(JSON.parse(readFileSync(path, "utf-8")));
}

export function writeSideEffectsManifest(path, entries) {
    if (basename(path) === "side-effects-manifest.json") {
        path = join(path.slice(0, -".json".length), DEFAULT_PACKAGE);
    }

    if (extname(path) === ".json") {
        writeFileSync(path, formatCompactManifest(createCompactSideEffectsManifest(entries)));
        return path;
    }

    if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
    }
    mkdirSync(path, { recursive: true });

    const entriesByShard = new Map();
    for (const entry of entries) {
        const shardName = getShardName(entry.file);
        const shardEntries = entriesByShard.get(shardName) ?? [];
        shardEntries.push(entry);
        entriesByShard.set(shardName, shardEntries);
    }

    for (const [shardName, shardEntries] of [...entriesByShard].sort((a, b) => compareCodePoint(a[0], b[0]))) {
        writeFileSync(join(path, `${shardName}.json`), formatCompactManifest(createShardManifest(shardEntries)));
    }

    return path;
}
