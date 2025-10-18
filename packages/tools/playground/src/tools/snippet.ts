/* eslint-disable jsdoc/require-jsdoc */
import { EncodeArrayBufferToBase64 } from "@dev/core";
import { Utilities } from "./utilities";
import type { GlobalState } from "../globalState";

export const ManifestVersion = 2;

export type V2Manifest = {
    v: number;
    language: "JS" | "TS";
    entry: string;
    imports: Record<string, string>;
    files: Record<string, string>;
    cdnBase?: string;
};

export type SnippetData = {
    payload?: string;
    jsonPayload?: string;
    name: string;
    description: string;
    tags: string;
};

export type SnippetPayload = {
    code: string;
    unicode?: string;
    engine: string;
    version?: number;
};

export function GenerateV2Manifest(globalState: GlobalState): V2Manifest {
    const entry = globalState.entryFilePath || (globalState.language === "JS" ? "index.js" : "index.ts");
    const files = Object.keys(globalState.files || {}).length ? globalState.files : { [entry]: globalState.currentCode || "" };
    return {
        v: ManifestVersion,
        language: (globalState.language === "JS" ? "JS" : "TS") as "JS" | "TS",
        entry,
        imports: globalState.importsMap || {},
        files,
    };
}

export function PackSnippetData(globalState: GlobalState): string {
    const activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2", true);
    const v2 = GenerateV2Manifest(globalState);
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
        version: ManifestVersion,
    } as SnippetPayload);
    const snippetData: SnippetData = {
        payload,
        name: globalState.currentSnippetTitle,
        description: globalState.currentSnippetDescription,
        tags: globalState.currentSnippetTags,
    };

    return JSON.stringify(snippetData);
}
