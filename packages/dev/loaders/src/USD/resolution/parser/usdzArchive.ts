import { Tools } from "core/Misc/tools.pure";

type FflateUnzipModule = {
    unzipSync(
        data: Uint8Array,
        options?: {
            filter?: (file: { name: string; size: number; originalSize: number; compression: number }) => boolean;
        }
    ): Record<string, Uint8Array>;
};

type ZipCentralDirectoryEntry = {
    fileName: string;
    localHeaderOffset: number;
    centralDirectoryIndex: number;
};

const DefaultFflateUrl = "https://unpkg.com/fflate@0.8.2/umd/index.js";
const EndOfCentralDirectorySignature = 0x06054b50;
const EndOfCentralDirectoryMinSize = 22;
const MaxZipCommentLength = 0xffff;
const CentralDirectoryFileHeaderSignature = 0x02014b50;
const CentralDirectoryFileHeaderSize = 46;
const MaxArchiveEntryCount = 4096;
const MaxArchiveUncompressedBytes = 1024 * 1024 * 1024;

/**
 * Extracted contents of a USDZ archive.
 */
export interface IUsdzArchive {
    /** The archive's default/root layer: its raw bytes and its in-archive file name. */
    rootLayer: { data: ArrayBuffer; fileName: string };
    /** All archive entries keyed by their in-archive path (textures, extra layers, etc.). */
    assets: Map<string, Uint8Array>;
}

/**
 * Reads a USDZ archive and extracts its root USD layer plus every embedded asset.
 *
 * @param data the raw USDZ archive bytes
 * @param fflateInstance optional preloaded fflate module; when omitted, fflate is loaded on demand
 * @param deflateUrl optional URL for the fflate UMD script used when fflate must be loaded on demand
 * @returns the extracted USDZ root layer and archive assets
 */
export async function ReadUsdzArchive(data: ArrayBuffer, fflateInstance?: unknown, deflateUrl?: string): Promise<IUsdzArchive> {
    const fflateModule = await LoadFflateAsync(fflateInstance, deflateUrl);
    const archiveBytes = new Uint8Array(data);
    let entryCount = 0;
    let uncompressedBytes = 0;
    const unzipped = fflateModule.unzipSync(archiveBytes, {
        filter: (file) => {
            entryCount++;
            uncompressedBytes += file.originalSize;
            ValidateArchiveResourceLimits(entryCount, uncompressedBytes);
            return true;
        },
    });
    const assets = new Map<string, Uint8Array>();

    for (const [fileName, content] of Object.entries(unzipped)) {
        assets.set(fileName, content);
    }
    ValidateExtractedArchive(assets);

    const orderedFileNames = ReadZipFileOrder(archiveBytes);
    const rootFileName = FindRootLayerFileName(assets, orderedFileNames);
    if (!rootFileName) {
        throw new Error("USDZ archive does not contain a USD root layer.");
    }

    const rootData = assets.get(rootFileName);
    if (!rootData) {
        throw new Error(`USDZ root layer '${rootFileName}' was not found in the extracted archive.`);
    }

    return {
        rootLayer: {
            data: CopyToArrayBuffer(rootData),
            fileName: rootFileName,
        },
        assets,
    };
}

async function LoadFflateAsync(fflateInstance: unknown, deflateUrl: string | undefined): Promise<FflateUnzipModule> {
    if (fflateInstance !== undefined) {
        if (HasUnzipSync(fflateInstance)) {
            return fflateInstance;
        }

        throw new Error("USDZ archive reader requires an fflate-compatible object with unzipSync.");
    }

    if (typeof window === "undefined") {
        throw new Error("USDZ archive reader requires a preloaded fflate instance outside a browser.");
    }

    const windowWithFflate = window as Window & { fflate?: unknown };
    if (!windowWithFflate.fflate) {
        await Tools.LoadScriptAsync(deflateUrl ?? DefaultFflateUrl);
    }

    if (!HasUnzipSync(windowWithFflate.fflate)) {
        throw new Error("USDZ archive reader could not load fflate.");
    }

    return windowWithFflate.fflate;
}

function HasUnzipSync(value: unknown): value is FflateUnzipModule {
    return typeof value === "object" && value !== null && "unzipSync" in value && typeof (value as { unzipSync?: unknown }).unzipSync === "function";
}

function ValidateExtractedArchive(assets: Map<string, Uint8Array>): void {
    let totalBytes = 0;
    for (const content of Array.from(assets.values())) {
        totalBytes += content.byteLength;
    }
    ValidateArchiveResourceLimits(assets.size, totalBytes);
}

function ValidateArchiveResourceLimits(entryCount: number, uncompressedBytes: number): void {
    if (entryCount > MaxArchiveEntryCount) {
        throw new Error(`USDZ archive entry count exceeds the ${MaxArchiveEntryCount}-entry resource cap.`);
    }
    if (!Number.isSafeInteger(uncompressedBytes) || uncompressedBytes > MaxArchiveUncompressedBytes) {
        throw new Error(`USDZ archive uncompressed size exceeds the ${MaxArchiveUncompressedBytes}-byte resource cap.`);
    }
}

function FindRootLayerFileName(assets: Map<string, Uint8Array>, orderedFileNames: string[] | undefined): string | undefined {
    // USDZ defines the first archive file as the root layer. fflate returns an object record without a
    // formal ordering contract, so prefer the ZIP central directory's local-header order when it can be
    // read, then fall back to the first USD-extension entry from fflate's record iteration order.
    const firstFileName = (orderedFileNames ?? Array.from(assets.keys()))[0];
    if (!firstFileName || !assets.has(firstFileName) || !IsUsdLayerFileName(firstFileName)) {
        throw new Error("USDZ archive first entry must be a USD root layer.");
    }
    return firstFileName;
}

function IsUsdLayerFileName(fileName: string): boolean {
    const normalizedFileName = fileName.toLowerCase();
    return normalizedFileName.endsWith(".usd") || normalizedFileName.endsWith(".usda") || normalizedFileName.endsWith(".usdc");
}

function ReadZipFileOrder(data: Uint8Array): string[] | undefined {
    const endOfCentralDirectoryOffset = FindEndOfCentralDirectory(data);
    if (endOfCentralDirectoryOffset === undefined) {
        return undefined;
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const entryCount = view.getUint16(endOfCentralDirectoryOffset + 10, true);
    const centralDirectoryOffset = view.getUint32(endOfCentralDirectoryOffset + 16, true);
    const entries: ZipCentralDirectoryEntry[] = [];
    const decoder = new TextDecoder();
    let offset = centralDirectoryOffset;

    for (let i = 0; i < entryCount; i++) {
        if (offset + CentralDirectoryFileHeaderSize > data.byteLength || view.getUint32(offset, true) !== CentralDirectoryFileHeaderSignature) {
            return undefined;
        }

        const fileNameLength = view.getUint16(offset + 28, true);
        const extraFieldLength = view.getUint16(offset + 30, true);
        const fileCommentLength = view.getUint16(offset + 32, true);
        const localHeaderOffset = view.getUint32(offset + 42, true);
        const fileNameStart = offset + CentralDirectoryFileHeaderSize;
        const fileNameEnd = fileNameStart + fileNameLength;
        const nextOffset = fileNameEnd + extraFieldLength + fileCommentLength;
        if (fileNameEnd > data.byteLength || nextOffset > data.byteLength) {
            return undefined;
        }

        entries.push({
            fileName: decoder.decode(data.subarray(fileNameStart, fileNameEnd)),
            localHeaderOffset,
            centralDirectoryIndex: i,
        });
        offset = nextOffset;
    }

    entries.sort((left, right) => left.localHeaderOffset - right.localHeaderOffset || left.centralDirectoryIndex - right.centralDirectoryIndex);
    return entries.map((entry) => entry.fileName);
}

function FindEndOfCentralDirectory(data: Uint8Array): number | undefined {
    if (data.byteLength < EndOfCentralDirectoryMinSize) {
        return undefined;
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const searchStart = Math.max(0, data.byteLength - EndOfCentralDirectoryMinSize - MaxZipCommentLength);
    for (let offset = data.byteLength - EndOfCentralDirectoryMinSize; offset >= searchStart; offset--) {
        if (view.getUint32(offset, true) === EndOfCentralDirectorySignature) {
            return offset;
        }
    }

    return undefined;
}

function CopyToArrayBuffer(data: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return copy.buffer;
}
