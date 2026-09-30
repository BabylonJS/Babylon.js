import { describe, expect, it } from "vitest";
import { CollectGltfDropFilesAsync, GetGltfFilePath, ResolveGltfCompanionFiles } from "flow-graph-editor/khrGltfCompanionFiles";

function FileEntry(path: string, error?: Error): FileSystemEntry {
    return {
        isFile: true,
        fullPath: path,
        file: (resolve: (file: File) => void, reject: (error: Error) => void) => {
            queueMicrotask(() => (error ? reject(error) : resolve({ name: path.split("/").pop(), webkitRelativePath: "" } as File)));
        },
    } as unknown as FileSystemEntry;
}

function FolderEntry(path: string, batches: FileSystemEntry[][], error?: Error): FileSystemEntry {
    return {
        isDirectory: true,
        fullPath: path,
        createReader: () => {
            let index = 0;
            return {
                readEntries: (resolve: (entries: FileSystemEntry[]) => void, reject: (error: Error) => void) =>
                    queueMicrotask(() => (error ? reject(error) : resolve(batches[index++] ?? []))),
            };
        },
    } as unknown as FileSystemEntry;
}

function Drop(entries: FileSystemEntry[]): DataTransfer {
    return { files: [], items: entries.map((entry) => ({ kind: "file", webkitGetAsEntry: () => entry, getAsFile: () => null })) } as unknown as DataTransfer;
}

describe("glTF native folder collection", () => {
    it("retains nested paths across directory batches and keeps same-named resources distinct", async () => {
        const files = await CollectGltfDropFilesAsync(
            Drop([
                FolderEntry("/asset", [
                    [
                        FileEntry("/asset/assembly.gltf"),
                        FolderEntry("/asset/textures", [[FileEntry("/asset/textures/red/diffuse.png")], [FileEntry("/asset/textures/blue/diffuse.png")]]),
                    ],
                    [FileEntry("/asset/geometry.bin")],
                ]),
            ])
        );
        expect(files.map(GetGltfFilePath)).toEqual(["asset/assembly.gltf", "asset/textures/red/diffuse.png", "asset/textures/blue/diffuse.png", "asset/geometry.bin"]);
        const mapping = ResolveGltfCompanionFiles(files[0], ["textures/red/diffuse.png", "textures/blue/diffuse.png"], files.slice(1));
        expect(mapping.get("textures/red/diffuse.png")).toBe(files[1]);
        expect(mapping.get("textures/blue/diffuse.png")).toBe(files[2]);
        expect(() => ResolveGltfCompanionFiles(files[0], ["textures/blue/diffuse.png"], [files[1]])).toThrow("Missing companion file");
    });

    it.each(["file", "directory"])("rejects a partial import when a nested %s cannot be read", async (kind) => {
        const bad = kind === "file" ? FileEntry("/asset/blocked.bin", new Error("permission denied")) : FolderEntry("/asset/blocked", [], new Error("permission denied"));
        await expect(CollectGltfDropFilesAsync(Drop([FolderEntry("/asset", [[FileEntry("/asset/assembly.gltf"), bad]])]))).rejects.toThrow("permission denied");
    });

    it("supports flat drops without entry APIs and directory-picker relative paths", async () => {
        const file = { name: "diffuse.png", webkitRelativePath: "asset/texture/diffuse.png" } as File;
        expect(await CollectGltfDropFilesAsync({ files: [file], items: [] } as unknown as DataTransfer)).toEqual([file]);
        expect(GetGltfFilePath(file)).toBe("asset/texture/diffuse.png");
        expect(await CollectGltfDropFilesAsync({ files: [file], items: [{ kind: "file", getAsFile: () => file }] } as unknown as DataTransfer)).toEqual([file]);
        expect(await CollectGltfDropFilesAsync(Drop([FolderEntry("/empty", [[]])]))).toEqual([]);
    });

    it("prefers a selected file's directory-picker path over a basename-only native entry", async () => {
        const file = { name: "diffuse.png", webkitRelativePath: "asset/textures/blue/diffuse.png" } as File;
        const transfer = { files: [file], items: [{ kind: "file", getAsFile: () => file, webkitGetAsEntry: () => FileEntry("/diffuse.png") }] } as unknown as DataTransfer;
        const collected = await CollectGltfDropFilesAsync(transfer);
        expect(collected[0]).toBe(file);
        expect(GetGltfFilePath(collected[0])).toBe("asset/textures/blue/diffuse.png");
    });
});
