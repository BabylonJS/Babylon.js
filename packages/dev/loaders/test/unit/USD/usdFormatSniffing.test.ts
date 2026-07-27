import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { USDFileLoaderMetadata } from "loaders/USD/usdFileLoader.metadata";
import { UsdUnsupportedFormatError } from "loaders/USD/usdErrors";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";

// The public USD loader is a single-layer USDA text importer. It selects USDA text from the *bytes*
// (content sniffing) rather than trusting the extension, and rejects binary crate (PXR-USDC) and
// USDZ/ZIP packages with a typed error before the text parser ever runs.
const triangleUsda = `#usda 1.0

def Mesh "Triangle"
{
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`;

// Encodes USDA source into a standalone, exactly-sized ArrayBuffer so it flows through the loader's
// byte path (the same path a fetched ".usda"/".usd" file takes).
function encodeUsda(text: string): ArrayBuffer {
    const bytes = new TextEncoder().encode(text);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

// "PXR-USDC" crate magic followed by filler; this is binary and must never be decoded as USDA text.
function crateBytes(): ArrayBuffer {
    return new Uint8Array([0x50, 0x58, 0x52, 0x2d, 0x55, 0x53, 0x44, 0x43, 0x00, 0x01, 0x02, 0x03]).buffer;
}

// ZIP local-file-header magic ("PK\x03\x04"), the signature shared by USDZ packages.
function zipBytes(): ArrayBuffer {
    return new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]).buffer;
}

async function importMeshSummaries(loader: USDFileLoader, data: string | ArrayBuffer, fileName: string): Promise<{ name: string; vertices: number }[]> {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
        const result = await loader.importMeshAsync(null, scene, data, "", undefined, fileName);
        return result.meshes.map((mesh) => ({ name: mesh.name, vertices: mesh.getTotalVertices() }));
    } finally {
        scene.dispose();
        engine.dispose();
    }
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
    try {
        await promise;
    } catch (error) {
        return error;
    }
    return undefined;
}

describe("USD loader metadata", () => {
    it("advertises only USDA text extensions and drops binary containers", () => {
        const extensions = USDFileLoaderMetadata.extensions;
        expect(Object.keys(extensions).sort()).toEqual([".usd", ".usda"]);
        expect(extensions).not.toHaveProperty(".usdc");
        expect(extensions).not.toHaveProperty(".usdz");
        // ".usd" stays byte-readable so its bytes can be sniffed: a ".usd" may be USDA text or a crate.
        expect(extensions[".usd"].isBinary).toBe(true);
        expect(extensions[".usda"].isBinary).toBe(true);
    });

    it("exposes the same extensions on a loader instance", () => {
        const loader = new USDFileLoader();
        expect(Object.keys(loader.extensions).sort()).toEqual([".usd", ".usda"]);
    });
});

describe("USD content sniffing - accepted USDA text", () => {
    it("loads a USDA string, .usda bytes, and .usd bytes through the same text path", async () => {
        const loader = new USDFileLoader();
        const fromString = await importMeshSummaries(loader, triangleUsda, "triangle.usda");
        const fromUsdaBytes = await importMeshSummaries(loader, encodeUsda(triangleUsda), "triangle.usda");
        const fromUsdBytes = await importMeshSummaries(loader, encodeUsda(triangleUsda), "triangle.usd");

        expect(fromString.some((mesh) => mesh.name === "Triangle")).toBe(true);
        // Bytes named ".usda", bytes named ".usd", and a raw string all resolve identically: the format
        // is chosen from the content, and ".usd" text is not diverted to a binary reader.
        expect(fromUsdaBytes).toEqual(fromString);
        expect(fromUsdBytes).toEqual(fromString);
    });
});

describe("USD content sniffing - rejected binary containers", () => {
    it("rejects PXR-USDC crate bytes from the public loader with a typed error", async () => {
        const loader = new USDFileLoader();
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const error = await captureRejection(loader.importMeshAsync(null, scene, crateBytes(), "", undefined, "model.usd"));
            expect(error).toBeInstanceOf(UsdUnsupportedFormatError);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects ZIP/USDZ package bytes from the public loader with a typed error", async () => {
        const loader = new USDFileLoader();
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const error = await captureRejection(loader.importMeshAsync(null, scene, zipBytes(), "", undefined, "model.usd"));
            expect(error).toBeInstanceOf(UsdUnsupportedFormatError);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects crate bytes at the resolution seam before the text parser, tagging the format", async () => {
        const error = await captureRejection(
            ResolveUsdStageWithFetcherAsync(crateBytes(), "", "model.usd", {}, async () => {
                throw new Error("external assets must never be fetched for rejected binary input");
            })
        );
        expect(error).toBeInstanceOf(UsdUnsupportedFormatError);
        expect((error as UsdUnsupportedFormatError).format).toBe("usdc");
    });

    it("rejects ZIP bytes at the resolution seam, tagging the package format", async () => {
        const error = await captureRejection(
            ResolveUsdStageWithFetcherAsync(zipBytes(), "", "model.usd", {}, async () => {
                throw new Error("external assets must never be fetched for rejected binary input");
            })
        );
        expect(error).toBeInstanceOf(UsdUnsupportedFormatError);
        expect((error as UsdUnsupportedFormatError).format).toBe("usdz");
    });
});
