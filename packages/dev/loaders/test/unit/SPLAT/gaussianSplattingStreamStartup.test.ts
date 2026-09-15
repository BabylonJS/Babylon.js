import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";
import { GaussianSplattingStream, type IGaussianSplattingStreamOptions, type ISOGLODMetadata } from "loaders/SPLAT/gaussianSplattingStream";
import { GaussianSplattingResidencyController } from "loaders/SPLAT/gaussianSplattingResidencyController";
import * as Sog from "loaders/SPLAT/sog.pure";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/SPLAT/gaussianSplattingWorkBuffer", () => ({
    GaussianSplattingWorkBuffer: class {
        public readonly supportsAsyncCentersReadback = false;
        public readonly textures = [{}, {}, {}, {}];
        public readonly shTextures: unknown[] = [];
        public readonly rotationTextures: unknown[] = [];
        public async decodeAsync(): Promise<void> {}
        public dispose(): void {}
    },
}));

const makeMetadata = (fineFileCount = 1): ISOGLODMetadata => {
    const leaves = Array.from({ length: fineFileCount }, (_, file) => ({
        bound: { min: [file, 0, 0], max: [file + 0.5, 0.5, 0.5] },
        lods: {
            "0": { file, offset: 0, count: 80 },
            "1": { file: fineFileCount, offset: file * 10, count: 10 },
        },
    }));
    return {
        lodLevels: 2,
        filenames: [...Array.from({ length: fineFileCount }, (_, file) => `fine-${file}/meta.json`), "base/meta.json"],
        tree: { bound: { min: [0, 0, 0], max: [fineFileCount + 1, 1, 1] }, children: leaves },
    };
};

const makePack = (): any => ({
    positions: new Float32Array(4),
    meansTextureL: { dispose: vi.fn() },
    meansTextureU: { dispose: vi.fn() },
    scalesTexture: { dispose: vi.fn() },
    quatsTexture: { dispose: vi.fn() },
    sh0Texture: { dispose: vi.fn() },
});

describe("GaussianSplattingStream coarse-first startup", () => {
    let engine: NullEngine;
    let scene: Scene;
    let startupSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        engine = new NullEngine({ textureSize: 2048 });
        (engine.getCaps() as any).maxTextureSize = 2048;
        scene = new Scene(engine);
        startupSpy = vi.spyOn(GaussianSplattingStream.prototype as any, "_streamAllAsync").mockResolvedValue(undefined);
    });

    afterEach(() => {
        startupSpy.mockRestore();
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    const makeDormantStream = (metadata = makeMetadata(), options: IGaussianSplattingStreamOptions = {}): any => {
        const stream = new GaussianSplattingStream("stream", metadata, "", scene, options);
        startupSpy.mockRestore();
        return stream;
    };

    it("computes the minimum from unique whole coarse files, padding, and environment, then clamps both initial limits", () => {
        const metadata: ISOGLODMetadata = {
            lodLevels: 2,
            filenames: ["fine/meta.json", "base-a/meta.json", "base-b/meta.json"],
            tree: {
                bound: { min: [0, 0, 0], max: [2, 1, 1] },
                children: [
                    { bound: { min: [0, 0, 0], max: [1, 1, 1] }, lods: { "0": { file: 0, offset: 0, count: 80 }, "1": { file: 1, offset: 0, count: 10 } } },
                    { bound: { min: [1, 0, 0], max: [2, 1, 1] }, lods: { "0": { file: 0, offset: 80, count: 80 }, "1": { file: 1, offset: 10, count: 10 } } },
                    { bound: { min: [2, 0, 0], max: [3, 1, 1] }, lods: { "0": { file: 0, offset: 160, count: 80 }, "1": { file: 2, offset: 0, count: 15 } } },
                ],
            },
        };
        const stream = makeDormantStream(metadata, { maxResidentSplats: 5, memoryBudgetMb: 0.001 });
        stream._fileCounts.set(1, 100);
        stream._fileCounts.set(2, 200);

        const baseFiles = stream._collectBaseFileIds();
        stream._resolveMinimumResidentSplats(baseFiles, 50);
        const capacity = stream._resolveResidentBudget(10_000, 200);

        expect(baseFiles).toEqual([1, 2]);
        expect(stream.minimumResidentSplats).toBe(351);
        expect(stream.residentSplatBudget).toBe(351);
        expect(capacity).toBe(351);
    });

    it("keeps a huge default allocation bounded while reserving one coarse-file-sized refinement slot", () => {
        const stream = makeDormantStream(makeMetadata());
        stream._fileCounts.set(1, 535_548);
        stream._resolveMinimumResidentSplats([1], 0);
        stream._shTextureCount = 5;

        const capacity = stream._resolveResidentBudget(265_459_067, 535_548);

        expect(capacity).toBeGreaterThanOrEqual(1_071_097);
        expect(capacity).toBeLessThan(10_000_000);
        expect(stream.residentSplatBudget).toBe(capacity);
    });

    it.each([false, true])("uses the device memory tier when fine source counts are not yet known (mobile: %s)", (isMobile) => {
        const stream = makeDormantStream();
        engine.getCaps().maxTextureSize = 4096;
        engine.hostInformation.isMobile = isMobile;
        stream._fileCounts.set(1, 100);
        stream._resolveMinimumResidentSplats([1], 0);
        stream._shTextureCount = 5;

        const capacity = stream._resolveResidentBudget(null, 100);
        const expectedCapacity = Math.floor(((isMobile ? 256 : 512) * 1024 * 1024) / (84 + 5 * 16));
        const residency = new GaussianSplattingResidencyController(capacity, 0, vi.fn());
        residency.pin(-2, 1);
        residency.pin(1, 100);

        expect(capacity).toBe(expectedCapacity);
        expect(residency.allocate(0, 800)).not.toBeNull();
    });

    it.each([NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects invalid residency %s without registering an incomplete mesh", (value) => {
        const originalMeshes = scene.meshes.slice();

        expect(() => new GaussianSplattingStream("invalid", makeMetadata(), "", scene, { maxResidentSplats: value })).toThrow(RangeError);
        expect(scene.meshes).toEqual(originalMeshes);
    });

    it.each([0, -1])("preserves the automatic-budget sentinel %s", (value) => {
        const stream = makeDormantStream(makeMetadata(), { maxResidentSplats: value, memoryBudgetMb: value });
        stream._fileCounts.set(1, 100);
        stream._resolveMinimumResidentSplats([1], 0);

        expect(stream._resolveResidentBudget(901, 100)).toBe(901);
    });

    it("rejects a coarse minimum that exceeds the device texture address space before allocation", () => {
        const stream = makeDormantStream(makeMetadata());
        engine.getCaps().maxTextureSize = 16;
        stream._fileCounts.set(1, 300);
        stream._resolveMinimumResidentSplats([1], 0);

        expect(() => stream._resolveResidentBudget(1_000, 300)).toThrow(/minimum resident.*device.*capacity/i);
    });

    it("publishes and pins a coarse file only after decoded positions are successfully applied", async () => {
        const stream = makeDormantStream(makeMetadata());
        const residency = new GaussianSplattingResidencyController(100, 0, vi.fn());
        const pinSpy = vi.spyOn(residency, "pin");
        stream._residency = residency;
        stream._workBuffer = { decodeAsync: vi.fn().mockResolvedValue(undefined), dispose: vi.fn() };
        stream._splatPositions = new Float32Array(400);
        stream._fileCounts.set(1, 10);
        stream._fileMeta.set(1, { sogData: { count: 10 }, subRootUrl: "" });
        stream._baseFileIds.add(1);
        vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
        vi.spyOn(stream, "_applyDecodedPositionsAsync").mockResolvedValue(true);
        const rangesSpy = vi.spyOn(stream, "_sinkSetActiveRanges");

        await expect(stream._decodeFileAsync(1)).resolves.toBe(true);

        expect(stream._decodedFiles.has(1)).toBe(true);
        expect(pinSpy).toHaveBeenCalledWith(1, 10);
        expect(rangesSpy).toHaveBeenCalledWith([{ offset: 0, count: 10 }]);
        residency.scheduleEviction(1);
        residency.tick();
        expect(residency.has(1)).toBe(true);

        stream._fileCounts.set(0, 80);
        stream._fileMeta.set(0, { sogData: { count: 80 }, subRootUrl: "" });
        vi.mocked(Sog.ParseSogMetaAsTextures).mockRejectedValueOnce(new Error("fine download failed"));
        await expect(stream._decodeFileAsync(0)).rejects.toThrow("fine download failed");
        expect(stream._leafNodes[0].activeLod).toBe(1);
        expect(residency.has(1)).toBe(true);
        expect(rangesSpy).toHaveBeenCalledTimes(1);
    });

    it("does not publish a file whose decoded positions could not be applied", async () => {
        const stream = makeDormantStream(makeMetadata());
        const residency = new GaussianSplattingResidencyController(100, 0, vi.fn());
        stream._residency = residency;
        stream._workBuffer = { decodeAsync: vi.fn().mockResolvedValue(undefined), dispose: vi.fn() };
        stream._splatPositions = new Float32Array(400);
        stream._fileCounts.set(1, 10);
        stream._fileMeta.set(1, { sogData: { count: 10 }, subRootUrl: "" });
        stream._baseFileIds.add(1);
        vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
        vi.spyOn(stream, "_applyDecodedPositionsAsync").mockResolvedValue(false);
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        await expect(stream._decodeFileAsync(1)).resolves.toBe(false);

        expect(stream._decodedFiles.has(1)).toBe(false);
        expect(residency.has(1)).toBe(false);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/positions.*file 1/i));
    });

    it("completes decode cleanup when disposal clears residency during an in-flight decode", async () => {
        const stream = makeDormantStream(makeMetadata());
        let releaseDecode!: () => void;
        const decodePending = new Promise<void>((resolve) => {
            releaseDecode = resolve;
        });
        stream._residency = new GaussianSplattingResidencyController(100, 0, vi.fn());
        const workBuffer = { decodeAsync: vi.fn(() => decodePending), dispose: vi.fn() };
        stream._workBuffer = workBuffer;
        stream._splatPositions = new Float32Array(400);
        stream._fileCounts.set(1, 10);
        stream._fileMeta.set(1, { sogData: { count: 10 }, subRootUrl: "" });
        vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);

        const decoding = stream._decodeFileAsync(1);
        await vi.waitFor(() => expect(stream._workBuffer.decodeAsync).toHaveBeenCalled());
        stream.dispose();
        releaseDecode();

        await expect(decoding).resolves.toBe(false);
        expect(workBuffer.dispose).toHaveBeenCalledOnce();
    });

    it("decodes and exposes the full coarse layer before requesting fine metadata", async () => {
        const metadata = makeMetadata(40);
        Object.assign(metadata, { count: 1 });
        const stream = makeDormantStream(metadata, { decodeSh: true, maxResidentSplats: 1000 });
        vi.spyOn(stream, "_setExternalWorkBuffer").mockImplementation(() => {});
        const events: string[] = [];
        let releaseFineMetadata!: () => void;
        const fineMetadataPending = new Promise<void>((resolve) => {
            releaseFineMetadata = resolve;
        });
        vi.spyOn(stream, "_gatherCountsAsync").mockImplementation(async (fileIds: number[]) => {
            if (fileIds.length === 1 && fileIds[0] === 40) {
                events.push("coarse-metadata");
                stream._fileCounts.set(40, 400);
                stream._fileMeta.set(40, { sogData: { count: 400 }, subRootUrl: "" });
                return 0;
            }
            events.push("fine-metadata");
            await fineMetadataPending;
            return 0;
        });
        vi.spyOn(stream, "_decodeFileAsync").mockImplementation(async (fileId: number) => {
            events.push(`decode-${fileId}`);
            stream._decodedFiles.add(fileId);
            for (const node of stream._leafNodes) {
                if (node.lods[String(node.baseLod)].file === fileId) {
                    node.activeLod = node.baseLod;
                    node.activeFile = fileId;
                }
            }
            return true;
        });

        const streaming = stream._streamAllAsync();
        await vi.waitFor(() => expect(events).toContain("fine-metadata"));

        expect(events).toEqual(["coarse-metadata", "decode-40", "fine-metadata"]);
        expect(stream._baseLayerReady).toBe(true);
        expect(stream._leafNodes.every((node: any) => node.activeLod === node.baseLod)).toBe(true);
        expect(stream._streamShDegree).toBe(4);
        expect(stream._shTextureCount).toBe(5);
        expect(stream._isLoadingIdle()).toBe(false);

        releaseFineMetadata();
        await streaming;
        expect(stream._isLoadingIdle()).toBe(true);
    });

    it("does not signal coarse readiness when required source metadata is missing", async () => {
        const stream = makeDormantStream();
        vi.spyOn(stream, "_gatherCountsAsync").mockResolvedValue(0);
        const allocateSpy = vi.spyOn(stream, "_setExternalWorkBuffer");

        await expect(stream._streamAllAsync()).rejects.toThrow(/required coarse metadata/);

        expect(stream._baseLayerReady).toBe(false);
        expect(allocateSpy).not.toHaveBeenCalled();
    });

    it("reports failed environment position application without publishing its range", async () => {
        const stream = makeDormantStream();
        stream._environmentRange = { offset: 1, count: 10 };
        stream._environmentFiles = new Map();
        stream._workBuffer = { decodeAsync: vi.fn().mockResolvedValue(undefined), dispose: vi.fn() };
        const pack = makePack();
        vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);
        vi.spyOn(stream, "_applyDecodedPositionsAsync").mockResolvedValue(false);
        const rangesSpy = vi.spyOn(stream, "_sinkSetActiveRanges");
        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        await stream._decodeEnvironmentAsync();

        expect(stream._environmentRange).toBeNull();
        expect(rangesSpy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/positions.*environment/i));
        expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
    });

    it.each(["positions", "parse", "decode", "success"])("reclaims unsuccessful environment allocations and pins only usable data (%s)", async (outcome) => {
        const stream = makeDormantStream(makeMetadata(), { maxResidentSplats: 91 });
        vi.spyOn(stream, "_setExternalWorkBuffer").mockImplementation(() => {});
        vi.spyOn(stream, "_gatherCountsAsync").mockImplementation(async () => {
            stream._fileCounts.set(0, 80);
            stream._fileCounts.set(1, 40);
            stream._fileMeta.set(0, { sogData: { count: 80 }, subRootUrl: "" });
            stream._fileMeta.set(1, { sogData: { count: 40 }, subRootUrl: "" });
            stream._environmentFiles = new Map();
            return 50;
        });
        vi.spyOn(Sog, "ParseSogMetaAsTextures").mockImplementation(async () => {
            if (outcome === "parse") {
                throw new Error("environment parsing failed");
            }
            if (outcome === "decode") {
                vi.spyOn(stream._workBuffer, "decodeAsync").mockRejectedValueOnce(new Error("environment decoding failed"));
            }
            return { sogTextures: makePack() } as any;
        });
        vi.spyOn(stream, "_applyDecodedPositionsAsync").mockResolvedValue(outcome === "success");
        vi.spyOn(stream, "_decodeFileAsync").mockImplementation(async (fileId: number) => {
            stream._residency.pin(fileId, stream._fileCounts.get(fileId));
            stream._decodedFiles.add(fileId);
            stream._applyDesiredLods();
            return true;
        });
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        await stream._streamAllAsync();

        const residency: GaussianSplattingResidencyController = stream._residency;
        expect(stream._baseLayerReady).toBe(true);
        if (outcome === "success") {
            residency.free(-1);
            expect(residency.has(-1)).toBe(true);
            expect(residency.freeSize).toBe(0);
        } else {
            expect(stream._environmentRange).toBeNull();
            expect(residency.has(-1)).toBe(false);
            expect(residency.freeSize).toBe(50);
            expect(residency.allocate(0, 50)).not.toBeNull();
        }
    });

    it.each(["metadata", "decode"])("disposes standalone streams when required coarse %s fails", async (failure) => {
        startupSpy.mockRestore();
        vi.spyOn(GaussianSplattingStream.prototype as any, "_gatherCountsAsync").mockImplementation(async function (this: any, fileIds: number[]) {
            if (failure === "decode") {
                for (const fileId of fileIds) {
                    this._fileCounts.set(fileId, 100);
                    this._fileMeta.set(fileId, { sogData: { count: 100 }, subRootUrl: "" });
                }
            }
            return 0;
        });
        vi.spyOn(GaussianSplattingStream.prototype as any, "_setExternalWorkBuffer").mockImplementation(() => {});
        vi.spyOn(GaussianSplattingStream.prototype as any, "_decodeFileAsync").mockResolvedValue(false);
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const stream = new GaussianSplattingStream("failed", makeMetadata(), "", scene) as any;
        const disposeSpy = vi.spyOn(stream, "dispose");

        await vi.waitFor(() => expect(stream.isDisposed()).toBe(true));

        expect(disposeSpy).toHaveBeenCalledOnce();
        expect(scene.meshes).not.toContain(stream);
        expect(stream._workBuffer).toBeNull();
        expect(stream._residency).toBeNull();
    });

    it("disposes a standalone stream when its tree contains no renderable splats", async () => {
        startupSpy.mockRestore();
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const metadata: ISOGLODMetadata = {
            lodLevels: 1,
            filenames: [],
            tree: { bound: { min: [0, 0, 0], max: [1, 1, 1] }, children: [] },
        };
        const stream = new GaussianSplattingStream("empty", metadata, "", scene) as any;

        await vi.waitFor(() => expect(stream.isDisposed()).toBe(true));

        expect(scene.meshes).not.toContain(stream);
        expect(stream._baseLayerReady).toBe(false);
        expect(stream._workBuffer).toBeNull();
        expect(stream._residency).toBeNull();
    });

    it("caps an all-coarse stream at its complete source size even above the progressive metadata threshold", async () => {
        const metadata: ISOGLODMetadata = {
            lodLevels: 1,
            filenames: Array.from({ length: 40 }, (_, file) => `${file}/meta.json`),
            tree: {
                bound: { min: [0, 0, 0], max: [40, 1, 1] },
                children: Array.from({ length: 40 }, (_, file) => ({
                    bound: { min: [file, 0, 0], max: [file + 1, 1, 1] },
                    lods: { "0": { file, offset: 0, count: 10 } },
                })),
            },
        };
        const stream = makeDormantStream(metadata);
        vi.spyOn(stream, "_setExternalWorkBuffer").mockImplementation(() => {});
        vi.spyOn(stream, "_gatherCountsAsync").mockImplementation(async (fileIds: number[]) => {
            for (const fileId of fileIds) {
                stream._fileCounts.set(fileId, 10);
                stream._fileMeta.set(fileId, { sogData: { count: 10 }, subRootUrl: "" });
            }
            return 0;
        });
        vi.spyOn(stream, "_decodeFileAsync").mockImplementation(async (fileId: number) => {
            stream._decodedFiles.add(fileId);
            stream._applyDesiredLods();
            return true;
        });

        await stream._streamAllAsync();

        expect(stream.minimumResidentSplats).toBe(401);
        expect(stream.residentSplatBudget).toBe(401);
    });

    it("keeps the minimum pending until the coarse metadata promise resolves", async () => {
        const stream = makeDormantStream();
        let releaseMetadata!: () => void;
        const metadataPending = new Promise<void>((resolve) => {
            releaseMetadata = resolve;
        });
        vi.spyOn(stream, "_setExternalWorkBuffer").mockImplementation(() => {});
        vi.spyOn(stream, "_gatherCountsAsync").mockImplementation(async () => {
            await metadataPending;
            stream._fileCounts.set(1, 100);
            stream._fileMeta.set(1, { sogData: { count: 100 }, subRootUrl: "" });
            return 0;
        });
        vi.spyOn(stream, "_decodeFileAsync").mockImplementation(async (fileId: number) => {
            stream._decodedFiles.add(fileId);
            stream._applyDesiredLods();
            return true;
        });

        expect(stream.minimumResidentSplats).toBe(0);
        const streaming = stream._streamAllAsync();
        await Promise.resolve();
        expect(stream.minimumResidentSplats).toBe(0);
        releaseMetadata();
        await streaming;
        expect(stream.minimumResidentSplats).toBe(101);
    });

    it("clamps a large finite MB request to device capacity when finer source counts are unknown", () => {
        const stream = makeDormantStream(makeMetadata(), { memoryBudgetMb: Number.MAX_SAFE_INTEGER });
        stream._fileCounts.set(1, 100);
        stream._resolveMinimumResidentSplats([1], 0);

        expect(stream._resolveResidentBudget(null, 100)).toBe(2048 * 2048);
    });

    it.each([0.5, Number.MIN_VALUE])("raises a positive fractional residency request %s to the coarse minimum", (maxResidentSplats) => {
        const stream = makeDormantStream(makeMetadata(), { maxResidentSplats });
        stream._fileCounts.set(1, 100);
        stream._resolveMinimumResidentSplats([1], 0);

        expect(stream._resolveResidentBudget(901, 100)).toBe(101);
    });
});
