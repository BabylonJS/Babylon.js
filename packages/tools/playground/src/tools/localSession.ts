/* eslint-disable jsdoc/require-jsdoc */
import { EncodeArrayBufferToBase64, Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import type { V2Manifest } from "./monaco/run/runner";
import { Utilities } from "./utilities";

declare let JSZip: any;

const Compress = JSZip.compressions.DEFLATE.compress as (data: Uint8Array) => Uint8Array;
const Decompress = JSZip.compressions.DEFLATE.uncompress as (data: Uint8Array) => Uint8Array;

const Decoder = new TextDecoder();
const Encoder = new TextEncoder();

export const MaxRevisions = 5;

export type FileChange = {
    file: string;
    type: "added" | "removed" | "modified";
    beforeSize: number | null;
    afterSize: number | null;
};

export type SnippetRevision = {
    date: number;
    manifest: V2Manifest;
    title: string;
    link?: string;
    filesChanged: FileChange[];
};

export type SnippetRevisionsBundle = {
    lastLocal?: string; // Snippet data as JSON string
    revisions: SnippetRevision[];
};

export type SnippetFileRevisions = {
    [snippetId: string]: string;
};

const LocalRevisionKey = "snippetRevisions";

// For unsaved Playground sessions we use a default token
const GetDefaultToken = (globalState: GlobalState) => {
    return globalState.currentSnippetToken || "local-session";
};

export const CompressJson = (jsonData: string): string => {
    const data = Encoder.encode(jsonData);
    const compressed = Compress(data);
    return btoa(String.fromCharCode(...compressed));
};

export const DecompressJson = (base64Data: string): string => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const decompressed = Decompress(bytes);
    return Decoder.decode(decompressed);
};

function ReadAll(): SnippetFileRevisions {
    const raw = Utilities.ReadStringFromStore(LocalRevisionKey, "{}");
    try {
        return JSON.parse(raw) as SnippetFileRevisions;
    } catch {
        return {};
    }
}

function WriteAll(all: SnippetFileRevisions) {
    Utilities.StoreStringToStore(LocalRevisionKey, JSON.stringify(all));
}

function ParseBundleFromCompressed(compressed: string): SnippetRevisionsBundle | null {
    if (!compressed) {
        return null;
    }
    try {
        const decompressed = DecompressJson(compressed);
        const parsed = JSON.parse(decompressed);
        const bundle = parsed as SnippetRevisionsBundle;
        bundle.revisions ||= [];
        return bundle;
    } catch (e) {
        Logger.Warn("Failed to parse bundle: " + (e as any)?.message);
        return null;
    }
}

function SerializeBundleToCompressed(bundle: SnippetRevisionsBundle): string {
    return CompressJson(JSON.stringify(bundle));
}

function LoadBundleForToken(token: string): SnippetRevisionsBundle {
    const all = ReadAll();
    const compressed = all[token];
    const bundle = compressed ? ParseBundleFromCompressed(compressed) : null;
    return bundle ?? { revisions: [] };
}

function StoreBundleForToken(token: string, bundle: SnippetRevisionsBundle) {
    const all = ReadAll();
    all[token] = SerializeBundleToCompressed(bundle);

    try {
        WriteAll(all);
    } catch (e) {
        const code = (e as any)?.code;
        const name = (e as any)?.name;
        if (code === 22 || name === "QuotaExceededError") {
            if (window.confirm("Local storage quota exceeded for saved revisions. Clear all saved revisions?")) {
                WriteAll({});
                WriteAll(all);
            }
        } else {
            throw e;
        }
    }
}

export function ListRevisionContexts(globalState: GlobalState): Array<{ token: string; title: string; count: number; latestDate?: number }> {
    const all = ReadAll();
    const entries: Array<{ token: string; title: string; count: number; latestDate?: number }> = [];

    for (const token of Object.keys(all)) {
        try {
            const bundle = ParseBundleFromCompressed(all[token]);
            if (!bundle) {
                continue;
            }

            const revs = bundle.revisions ?? [];
            const latest = revs[0];
            const title = (latest?.title?.trim()?.length ? latest.title : token === "local-session" ? "Local Session" : "Snippet") + "";

            entries.push({
                token,
                title,
                count: revs.length,
                latestDate: latest?.date,
            });
        } catch {
            // skip malformed
        }
    }

    // Ensure current token appears even if empty/missing
    const current = GetDefaultToken(globalState);
    if (!entries.some((e) => e.token === current)) {
        entries.push({
            token: current,
            title: current === "local-session" ? "Local Session" : "Snippet",
            count: 0,
        });
    }

    entries.sort((a, b) => {
        const dateA = a.latestDate ?? 0;
        const dateB = b.latestDate ?? 0;
        if (dateA !== dateB) {
            return dateB - dateA;
        }
        if (a.count !== b.count) {
            return b.count - a.count;
        }
        return a.title.localeCompare(b.title);
    });

    return entries;
}

export function LoadFileRevisionsForToken(globalState: GlobalState, token: string): SnippetRevision[] {
    try {
        const bundle = LoadBundleForToken(token);
        return bundle.revisions ?? [];
    } catch (e) {
        Logger.Warn("Failed to load local revisions for token: " + token + " - " + (e as any)?.message);
        return [];
    }
}

export function PackSnippetData(globalState: GlobalState): string {
    const activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);
    const entry = globalState.entryFilePath || (globalState.language === "JS" ? "index.js" : "index.ts");
    const files = Object.keys(globalState.files || {}).length ? globalState.files : { [entry]: globalState.currentCode || "" };
    const v2 = {
        v: 2,
        language: (globalState.language === "JS" ? "JS" : "TS") as "JS" | "TS",
        entry,
        imports: globalState.importsMap || {},
        files,
    };
    const codeToSave = JSON.stringify(v2);
    const encoder = new TextEncoder();
    const buffer = encoder.encode(codeToSave);
    let testData = "";
    for (let i = 0; i < buffer.length; i++) {
        testData += String.fromCharCode(buffer[i]);
    }
    const payload = JSON.stringify({
        code: codeToSave,
        unicode: testData !== codeToSave ? EncodeArrayBufferToBase64(buffer) : undefined,
        engine: activeEngineVersion,
    });
    const snippetData = {
        payload,
        name: globalState.currentSnippetTitle,
        description: globalState.currentSnippetDescription,
        tags: globalState.currentSnippetTags,
    };

    return JSON.stringify(snippetData);
}

export function LoadFileRevisions(globalState: GlobalState): SnippetRevision[] {
    const token = GetDefaultToken(globalState);
    return LoadFileRevisionsForToken(globalState, token);
}

export function ReadLastLocal(globalState: GlobalState): string | undefined {
    const token = GetDefaultToken(globalState);
    const bundle = LoadBundleForToken(token);
    return bundle.lastLocal;
}
export function WriteLastLocal(globalState: GlobalState) {
    const token = GetDefaultToken(globalState);
    const bundle = LoadBundleForToken(token);
    bundle.lastLocal = PackSnippetData(globalState);
    StoreBundleForToken(token, bundle);
}

export function RemoveFileRevisionForToken(globalState: GlobalState, token: string, index: number) {
    const bundle = LoadBundleForToken(token);
    const revs = bundle.revisions ?? [];
    if (index < 0 || index >= revs.length) {
        return;
    }

    revs.splice(index, 1);
    bundle.revisions = revs;
    StoreBundleForToken(token, bundle);
}

export function AddFileRevision(globalState: GlobalState, manifest: V2Manifest) {
    const token = GetDefaultToken(globalState);
    const bundle = LoadBundleForToken(token);
    const revisions = bundle.revisions ?? [];

    const previousManifest = revisions.length > 0 ? revisions[0].manifest : undefined;
    const filesChanged = DiffFiles(previousManifest ?? null, manifest);

    // Skip if an identical manifest already exists in history
    for (const revision of revisions) {
        if (JSON.stringify(revision.manifest) === JSON.stringify(manifest)) {
            return;
        }
    }
    // Only push diffs so we don't dupe the stack
    if (!filesChanged.length) {
        return;
    }

    const title = globalState.currentSnippetTitle ? `${globalState.currentSnippetTitle}` : "Local Session";
    let link: string | undefined;
    if (globalState.currentSnippetToken) {
        link = `#${globalState.currentSnippetToken}#${globalState.currentSnippetRevision ?? ""}`;
    }

    revisions.push({
        date: Date.now(),
        title,
        link,
        manifest,
        filesChanged,
    });

    revisions.sort((a, b) => b.date - a.date);
    while (revisions.length > MaxRevisions) {
        revisions.pop();
    }

    bundle.revisions = revisions;
    StoreBundleForToken(token, bundle);
}

export function RemoveFileRevision(globalState: GlobalState, index: number) {
    const token = GetDefaultToken(globalState);
    RemoveFileRevisionForToken(globalState, token, index);
}

export function ClearSnippetFileRevisions(globalState: GlobalState) {
    const token = GetDefaultToken(globalState);
    if (token === "local-session") {
        WriteAll({});
        return;
    }

    const all = ReadAll();
    if (all[token]) {
        delete all[token];
        WriteAll(all);
    }
}

const DiffFiles = (prev: V2Manifest | null, next: V2Manifest): FileChange[] => {
    const changes: FileChange[] = [];
    const prevFiles = prev?.files ?? {};
    const nextFiles = next.files ?? {};

    const prevKeys = new Set(Object.keys(prevFiles));
    const nextKeys = new Set(Object.keys(nextFiles));

    for (const file of nextKeys) {
        const prevContent = prevFiles[file];
        const nextContent = nextFiles[file];

        if (!prevKeys.has(file)) {
            changes.push({
                file,
                type: "added",
                beforeSize: null,
                afterSize: nextContent ? Encoder.encode(nextContent).length : 0,
            });
        } else if (prevContent !== nextContent) {
            changes.push({
                file,
                type: "modified",
                beforeSize: prevContent ? Encoder.encode(prevContent).length : 0,
                afterSize: nextContent ? Encoder.encode(nextContent).length : 0,
            });
        }
        prevKeys.delete(file);
    }

    for (const removed of prevKeys) {
        const prevContent = prevFiles[removed];
        changes.push({
            file: removed,
            type: "removed",
            beforeSize: prevContent ? Encoder.encode(prevContent).length : 0,
            afterSize: null,
        });
    }

    const rank = { modified: 0, added: 1, removed: 2 } as const;
    changes.sort((a, b) => {
        const r = rank[a.type] - rank[b.type];
        return r !== 0 ? r : a.file.localeCompare(b.file);
    });

    return changes;
};
