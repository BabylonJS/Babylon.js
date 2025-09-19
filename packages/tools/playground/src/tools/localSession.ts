/* eslint-disable jsdoc/require-jsdoc */
import { Logger } from "@dev/core";
import type { GlobalState } from "../globalState";
import type { V2Manifest } from "./monaco/run/runner";
import { Utilities } from "./utilities";

declare let JSZip: any;

const Compress = JSZip.compressions.DEFLATE.compress as (data: Uint8Array) => Uint8Array;
const Decompress = JSZip.compressions.DEFLATE.uncompress as (data: Uint8Array) => Uint8Array;

const Decoder = new TextDecoder();
const Encoder = new TextEncoder();

export type FileChange = {
    file: string;
    type: "added" | "removed" | "modified";
    beforeSize: number | null; // null when file did not exist before
    afterSize: number | null; // null when file was removed
};

export type SnippetRevision = {
    date: number;
    manifest: V2Manifest;
    title: string;
    filesChanged: FileChange[];
};

export type SnippetFileRevisions = {
    [snippetId: string]: string; // compressed as SnippetRevision[];
};

const LocalRevisionKey = "localSnippetRevisions";

// For unsaved Playground sessions we use a default token
const GetDefaultToken = (globalState: GlobalState) => {
    return globalState.currentSnippetToken || "local-session";
};

/**
 * @param globalState
 * @returns
 */
export function LoadFileRevisions(globalState: GlobalState): SnippetRevision[] {
    const revisions: SnippetRevision[] = [];
    const storedRevisions = Utilities.ReadStringFromStore(LocalRevisionKey, "{}");
    if (!storedRevisions) {
        return revisions;
    }

    try {
        const parsed = JSON.parse(storedRevisions) as SnippetFileRevisions;
        const snippetId = GetDefaultToken(globalState);
        if (parsed[snippetId]) {
            const compressed = parsed[snippetId];
            const decompressed = DecompressJson(compressed);
            const revisions = JSON.parse(decompressed) as SnippetRevision[];
            return revisions;
        }
    } catch (e) {
        Logger.Warn("Failed to load local revisions: " + (e as any)?.message);
    }
    return revisions;
}

export function AddFileRevision(globalState: GlobalState, manifest: V2Manifest) {
    const token = GetDefaultToken(globalState);
    const revisions = LoadFileRevisions(globalState);

    const previousManifest = revisions.length > 0 ? revisions[0].manifest : null;
    const filesChanged = DiffFiles(previousManifest, manifest);

    // Only push diffs so we don't dupe the stack
    if (!filesChanged.length) {
        return;
    }

    revisions.push({
        date: Date.now(),
        title: globalState.currentSnippetTitle || "Local Session",
        manifest,
        filesChanged,
    });

    revisions.sort((a, b) => b.date - a.date);
    while (revisions.length > 10) {
        revisions.pop();
    }

    const toStore: SnippetFileRevisions = {};
    toStore[token] = CompressJson(JSON.stringify(revisions));

    const existing = Utilities.ReadStringFromStore(LocalRevisionKey, "{}");
    let existingObj: SnippetFileRevisions = {};
    try {
        existingObj = JSON.parse(existing) as SnippetFileRevisions;
    } catch {}
    existingObj[token] = toStore[token];

    Utilities.StoreStringToStore(LocalRevisionKey, JSON.stringify(existingObj));
}

export function RemoveFileRevision(globalState: GlobalState, index: number) {
    const token = GetDefaultToken(globalState);
    const revisions = LoadFileRevisions(globalState);

    if (index < 0 || index >= revisions.length) {
        return;
    }

    revisions.splice(index, 1);

    const toStore: SnippetFileRevisions = {};
    toStore[token] = CompressJson(JSON.stringify(revisions));

    const existing = Utilities.ReadStringFromStore(LocalRevisionKey, "{}");
    let existingObj: SnippetFileRevisions = {};
    try {
        existingObj = JSON.parse(existing) as SnippetFileRevisions;
    } catch {}
    existingObj[token] = toStore[token];

    Utilities.StoreStringToStore(LocalRevisionKey, JSON.stringify(existingObj));
}

export function ClearSnippetFileRevisions(globalState: GlobalState) {
    const token = GetDefaultToken(globalState);
    if (token === "local-session") {
        Utilities.StoreStringToStore(LocalRevisionKey, "{}");
        return;
    }

    const existing = Utilities.ReadStringFromStore(LocalRevisionKey, "{}");
    let existingObj: SnippetFileRevisions = {};
    try {
        existingObj = JSON.parse(existing) as SnippetFileRevisions;
    } catch {}
    if (existingObj[token]) {
        delete existingObj[token];
        Utilities.StoreStringToStore(LocalRevisionKey, JSON.stringify(existingObj));
    }
}

/**
 *
 * @param jsonData - JSON string to compress
 * @returns
 */
export const CompressJson = (jsonData: string): string => {
    const data = Encoder.encode(jsonData);
    const compressed = Compress(data);
    return btoa(String.fromCharCode(...compressed));
};

/**
 *
 * @param base64Data
 * @returns
 */
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

/**
 *
 * @param prev
 * @param next
 * @returns
 */
const DiffFiles = (prev: V2Manifest | null, next: V2Manifest): FileChange[] => {
    const changes: FileChange[] = [];
    const prevFiles = prev?.files ?? {};
    const nextFiles = next.files ?? {};

    const prevKeys = new Set(Object.keys(prevFiles));
    const nextKeys = new Set(Object.keys(nextFiles));

    // added or modified
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

    // sort: modified, added, removed (and alphabetically within)
    const rank = { modified: 0, added: 1, removed: 2 } as const;
    changes.sort((a, b) => {
        const r = rank[a.type] - rank[b.type];
        return r !== 0 ? r : a.file.localeCompare(b.file);
    });

    return changes;
};
