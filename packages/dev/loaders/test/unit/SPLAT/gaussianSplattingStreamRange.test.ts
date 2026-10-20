import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { GaussianSplattingStream, type IGaussianSplattingStreamOptions, type ISOGLODMetadata } from "loaders/SPLAT/gaussianSplattingStream";
import { GaussianSplattingResidencyController } from "loaders/SPLAT/gaussianSplattingResidencyController";
import { GaussianSplattingDownloadManager } from "loaders/SPLAT/gaussianSplattingDownloadManager";
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

const SourceSize = 100;

// File 0 is a fine source serving three leaf intervals: [0,10) and [5,15) overlap and share a page, [60,70) gets its own.
// File 1 is the pinned coarse file.
const makeMetadata = (extraEntry?: { offset: number; count: number }): ISOGLODMetadata => {
    const leaf = (index: number, offset: number, count: number, coarseOffset: number) => ({
        bound: { min: [index, 0, 0], max: [index + 0.5, 0.5, 0.5] },
        lods: {
            "0": { file: 0, offset, count },
            "1": { file: 1, offset: coarseOffset, count: 5 },
        },
    });
    const children = [leaf(0, 0, 10, 0), leaf(1, 5, 10, 5), leaf(2, 60, 10, 10)];
    if (extraEntry) {
        children.push(leaf(3, extraEntry.offset, extraEntry.count, 15));
    }
    return {
        lodLevels: 2,
        filenames: ["fine/meta.json", "base/meta.json"],
        tree: { bound: { min: [0, 0, 0], max: [4, 1, 1] }, children },
    };
};

const makeSourceData = (count: number) => ({
    count,
    means: { files: ["means_l.webp", "means_u.webp"] },
    scales: { files: ["scales.webp"] },
    quats: { files: ["quats.webp"] },
    sh0: { files: ["sh0.webp"] },
});

const makePack = (splatCount = SourceSize): any => ({
    splatCount,
    positions: new Float32Array(splatCount * 4),
    meansTextureL: { dispose: vi.fn() },
    meansTextureU: { dispose: vi.fn() },
    scalesTexture: { dispose: vi.fn() },
    quatsTexture: { dispose: vi.fn() },
    sh0Texture: { dispose: vi.fn() },
});

const snapshot = (metadata: ISOGLODMetadata): string => JSON.stringify(metadata);

const useControlledDownloads = (stream: any) => {
    const requests: Array<{ url: string; aborted: boolean; succeed: () => void }> = [];
    vi.spyOn(Tools, "LoadFile").mockImplementation(((url: string, onSuccess: (data: ArrayBuffer) => void) => {
        const request = { url, aborted: false, succeed: () => onSuccess(new ArrayBuffer(4)) };
        requests.push(request);
        return { abort: () => (request.aborted = true) } as any;
    }) as any);
    stream._downloadManager = new GaussianSplattingDownloadManager({ maxConcurrent: 16, maxRetries: 0 });
    return requests;
};

describe("GaussianSplattingStream source-range residency", () => {
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

    const makeDormantStream = (metadata: ISOGLODMetadata, options: IGaussianSplattingStreamOptions = {}): any => {
        const stream = new GaussianSplattingStream("stream", metadata, "", scene, options);
        startupSpy.mockRestore();
        return stream;
    };

    // Builds a stream whose fine source has been "gathered" and paged, with a decode environment ready to run.
    const makeRangeStream = (options: IGaussianSplattingStreamOptions = {}, metadata = makeMetadata()): any => {
        const stream = makeDormantStream(metadata, { rangeResidency: true, ...options });
        stream._baseFileIds.add(1);
        stream._fileCounts.set(0, SourceSize);
        stream._fileMeta.set(0, { sogData: makeSourceData(SourceSize), subRootUrl: "fine/" });
        stream._fileCounts.set(1, 20);
        stream._fileMeta.set(1, { sogData: makeSourceData(20), subRootUrl: "base/" });
        if (options.rangeResidency !== false) {
            stream._initializeResidencyPages([0]);
        }
        stream._residency = new GaussianSplattingResidencyController(1000, 0, vi.fn());
        stream._workBuffer = { decodeAsync: vi.fn().mockResolvedValue(undefined), dispose: vi.fn() };
        stream._splatPositions = new Float32Array(4000);
        vi.spyOn(stream._downloadManager, "loadFileAsync").mockResolvedValue(new ArrayBuffer(4));
        vi.spyOn(stream._downloadManager, "cancelGroup").mockImplementation(() => {});
        vi.spyOn(stream, "_applyDecodedPositionsAsync").mockResolvedValue(true);
        return stream;
    };

    describe("construction", () => {
        it("keeps the caller metadata and reports disabled stats by default", () => {
            const metadata = makeMetadata();
            const stream = makeDormantStream(metadata);

            expect(stream._metadata).toBe(metadata);
            expect(stream._residencyPages.size).toBe(0);
            expect(stream.getSourceRange(0)).toBeNull();
            expect(stream.isSplitPage(0)).toBe(false);
            expect(stream.rangeResidencyStats).toEqual({ enabled: false, pages: 0, sourcePackLoads: 0, sourcePackReuses: 0, splitPackLoads: 0, cachedSourceSplats: 0 });
        });

        it("works on a copy of the metadata so the caller object is never rewritten", () => {
            const metadata = makeMetadata();
            const before = snapshot(metadata);
            const stream = makeRangeStream({}, metadata);

            expect(stream._metadata).not.toBe(metadata);
            expect(stream._metadata.tree).not.toBe(metadata.tree);
            expect(snapshot(metadata)).toBe(before);
            expect(stream._leafNodes.some((node: any) => node.lods["0"].file !== 0)).toBe(true);
        });

        it("rejects rangePack without rangeResidency before registering a mesh", () => {
            const meshes = scene.meshes.slice();

            expect(() => new GaussianSplattingStream("invalid", makeMetadata(), "", scene, { rangePack: () => null })).toThrow(/rangePack requires rangeResidency/);
            expect(scene.meshes).toEqual(meshes);
        });
    });

    describe("paging", () => {
        it("pages the fine file by its leaf intervals and points entries at relative offsets", () => {
            const stream = makeRangeStream();

            expect(stream.getSourceRange(2)).toEqual({ file: 0, offset: 0, count: 15 });
            expect(stream.getSourceRange(3)).toEqual({ file: 0, offset: 60, count: 10 });
            expect(Object.isFrozen(stream.getSourceRange(2))).toBe(true);
            expect(stream._fileCounts.get(2)).toBe(15);
            expect(stream._fileCounts.get(3)).toBe(10);
            expect(stream._fileMeta.get(2)).toBe(stream._fileMeta.get(0));
            const [first, second, third] = stream._leafNodes.map((node: any) => node.lods["0"]);
            expect(first).toMatchObject({ file: 2, offset: 0, count: 10 });
            expect(second).toMatchObject({ file: 2, offset: 5, count: 10 });
            expect(third).toMatchObject({ file: 3, offset: 0, count: 10 });
            expect(stream.rangeResidencyStats.pages).toBe(2);
            expect(stream.getSourceRange(0)).toBeNull();
        });

        it("leaves pinned coarse files whole", () => {
            const stream = makeRangeStream();

            expect(stream.getSourceRange(1)).toBeNull();
            expect(stream._leafNodes.map((node: any) => node.lods["1"].file)).toEqual([1, 1, 1]);
        });

        it.each([2, -1, 0.5, Number.NaN, 3, Number.POSITIVE_INFINITY])("keeps invalid source ID %s out of the page namespace", (invalidFile) => {
            const metadata = makeMetadata({ offset: 40, count: 10 });
            (metadata.tree.children![3].lods!["0"] as any).file = invalidFile;
            const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
            const stream = makeRangeStream({}, metadata);
            const invalidLeaf = stream._leafNodes[3];

            expect(stream.getSourceRange(2)).toEqual({ file: 0, offset: 0, count: 15 });
            expect(invalidLeaf.availableLevels).toEqual([1]);
            expect(invalidLeaf.baseLod).toBe(1);
            stream._decodedFiles.add(2);
            expect(stream._residentLevelAtLeast(invalidLeaf, 0)).toBeNull();
            expect(stream._collectAllFileIds()).toEqual([1, 2, 3]);
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/invalid.*file/i));
        });

        it("does not reject when a source has no metadata", () => {
            const stream = makeDormantStream(makeMetadata(), { rangeResidency: true });
            stream._baseFileIds.add(1);

            expect(() => stream._initializeResidencyPages([0])).not.toThrow();
            expect(stream._residencyPages.size).toBe(0);
        });

        it("warns and keeps the file whole when an interval exceeds the file", () => {
            const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
            const stream = makeRangeStream({}, makeMetadata({ offset: 95, count: 10 }));

            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/invalid LOD interval in file 0/));
            expect(stream._residencyPages.size).toBe(0);
            expect(stream._leafNodes.map((node: any) => node.lods["0"].file)).toEqual([0, 0, 0, 0]);
        });

        it("keeps the default path free of pages when the option is off", () => {
            const stream = makeDormantStream(makeMetadata());
            stream._fileCounts.set(0, SourceSize);
            stream._fileMeta.set(0, { sogData: makeSourceData(SourceSize), subRootUrl: "fine/" });

            expect(stream._residencyPages.size).toBe(0);
            expect(stream.rangeResidencyStats.enabled).toBe(false);
        });
    });

    describe("split packs", () => {
        const makeSplit = (count: number) => ({ sogData: makeSourceData(count), subRootUrl: "pages/" });

        it("asks the resolver once per page and exposes split pages", () => {
            const rangePack = vi.fn((source: { count: number }) => makeSplit(source.count));
            const stream = makeRangeStream({ rangePack });

            expect(rangePack).toHaveBeenCalledTimes(2);
            expect(rangePack).toHaveBeenCalledWith({ file: 0, offset: 0, count: 15 }, stream._fileMeta.get(0).sogData);
            expect(stream.isSplitPage(2)).toBe(true);
            expect(stream.isSplitPage(3)).toBe(true);
            expect(stream.isSplitPage(0)).toBe(false);
        });

        it("falls back to the source pack when the resolver returns null", () => {
            const stream = makeRangeStream({ rangePack: () => null });

            expect(stream.isSplitPage(2)).toBe(false);
        });

        it("warns and falls back when the split pack holds a different splat count", () => {
            const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
            const stream = makeRangeStream({ rangePack: () => makeSplit(7) });

            expect(stream.isSplitPage(2)).toBe(false);
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/split pack for page 2 does not hold 15 splats/));
        });

        it("warns and falls back when the resolver throws", () => {
            const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
            const stream = makeRangeStream({
                rangePack: () => {
                    throw new Error("no pack");
                },
            });

            expect(stream.isSplitPage(2)).toBe(false);
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/rangePack failed for page 2: no pack/));
        });
    });

    describe("decoding", () => {
        it("applies only the requested source positions at the allocated destination on the CPU path", async () => {
            const stream = makeRangeStream();
            vi.mocked(stream._applyDecodedPositionsAsync).mockRestore();
            const pack = makePack();
            for (let i = 0; i < SourceSize * 4; i++) {
                pack.positions[i] = i + 1;
            }
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);

            await expect(stream._decodeFileAsync(3)).resolves.toBe(true);

            const base = stream._residency.offset(3)!;
            expect(stream._splatPositions.slice(base * 4, (base + 10) * 4)).toEqual(pack.positions.slice(60 * 4, 70 * 4));
            expect(stream._splatPositions.slice((base + 10) * 4, (base + 11) * 4)).toEqual(new Float32Array(4));
        });

        it("writes GPU-readback positions to the allocated destination rather than the source offset", async () => {
            const stream = makeRangeStream();
            vi.mocked(stream._applyDecodedPositionsAsync).mockRestore();
            stream._useGpuPositionReadback = true;
            const positions = new Float32Array(Array.from({ length: 40 }, (_, index) => index + 101));
            stream._workBuffer.readCentersRangeAsync = vi.fn().mockResolvedValue(positions);
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);

            await expect(stream._decodeFileAsync(3)).resolves.toBe(true);

            const base = stream._residency.offset(3)!;
            expect(stream._workBuffer.readCentersRangeAsync).toHaveBeenCalledWith(base, 10);
            expect(stream._splatPositions.slice(base * 4, (base + 10) * 4)).toEqual(positions);
        });

        it("decodes a source page from the shared source pack at its source offset", async () => {
            const stream = makeRangeStream();
            const pack = makePack();
            const parse = vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);

            await expect(stream._decodeFileAsync(2)).resolves.toBe(true);

            const files = parse.mock.calls[0][0] as Map<string, Uint8Array>;
            expect(files).toBeInstanceOf(Map);
            expect(Array.from(files.keys()).sort()).toEqual(["means_l.webp", "means_u.webp", "meta.json", "quats.webp", "scales.webp", "sh0.webp"]);
            expect(stream._downloadManager.loadFileAsync).toHaveBeenCalledWith("fine/means_l.webp", 0);
            expect(stream._workBuffer.decodeAsync).toHaveBeenCalledWith(pack, expect.any(Number), 0, 15);
            expect(stream._applyDecodedPositionsAsync).toHaveBeenCalledWith(pack, expect.any(Number), 15, 0);
            expect(stream._decodedFiles.has(2)).toBe(true);
            expect(pack.meansTextureL.dispose).not.toHaveBeenCalled();
            expect(stream.rangeResidencyStats).toMatchObject({ sourcePackLoads: 1, sourcePackReuses: 0, cachedSourceSplats: SourceSize });
        });

        it("reuses the cached source pack for another page of the same source", async () => {
            const stream = makeRangeStream();
            const pack = makePack();
            const parse = vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);

            await stream._decodeFileAsync(2);
            await stream._decodeFileAsync(3);

            expect(parse).toHaveBeenCalledTimes(1);
            expect(stream._workBuffer.decodeAsync).toHaveBeenLastCalledWith(pack, expect.any(Number), 60, 10);
            expect(stream._applyDecodedPositionsAsync).toHaveBeenLastCalledWith(pack, expect.any(Number), 10, 60);
            expect(stream.rangeResidencyStats).toMatchObject({ sourcePackLoads: 1, sourcePackReuses: 1 });
        });

        it("disposes the cached source pack once the stream is idle", () => {
            const stream = makeRangeStream();
            const pack = makePack();
            stream._rangeSourcePack = { file: 0, pack };
            stream._baseLayerReady = true;
            stream._loadingFiles.add(3);
            vi.spyOn(stream, "_pumpDecodeQueue").mockImplementation(() => {});

            stream._onLodFrame();
            expect(pack.meansTextureL.dispose).not.toHaveBeenCalled();

            stream._loadingFiles.clear();
            stream._decodeQueue.length = 0;
            stream._onLodFrame();
            stream._onLodFrame();
            for (const texture of [pack.meansTextureL, pack.meansTextureU, pack.scalesTexture, pack.quatsTexture, pack.sh0Texture]) {
                expect(texture.dispose).toHaveBeenCalledOnce();
            }
            expect(stream.rangeResidencyStats.cachedSourceSplats).toBe(0);
        });

        it("drops a source pack when only unrelated or split page work remains, but keeps it for queued same-source work", () => {
            const stream = makeRangeStream({
                rangePack: (source: { count: number }) => (source.count === 15 ? { sogData: makeSourceData(15), subRootUrl: "pages/" } : null),
            });
            const pack = makePack();
            stream._rangeSourcePack = { file: 0, pack };
            stream._baseLayerReady = true;
            stream._loadingFiles.add(1);
            stream._loadingFiles.add(2);
            vi.spyOn(stream, "_pumpDecodeQueue").mockImplementation(() => {});

            stream._onLodFrame();
            expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
            expect(stream.rangeResidencyStats.cachedSourceSplats).toBe(0);

            const next = makePack();
            stream._rangeSourcePack = { file: 0, pack: next };
            stream._loadingFiles.clear();
            stream._decodeQueue.push(3);
            stream._onLodFrame();
            expect(next.meansTextureL.dispose).not.toHaveBeenCalled();
            stream._decodeQueue.length = 0;
            stream._onLodFrame();
            expect(next.meansTextureL.dispose).toHaveBeenCalledOnce();
        });

        it("retains the cached pack until cancelled in-flight GPU readback stops using it", async () => {
            const stream = makeRangeStream();
            vi.mocked(stream._applyDecodedPositionsAsync).mockRestore();
            stream._baseLayerReady = true;
            stream._useGpuPositionReadback = true;
            const pack = makePack();
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);
            let releaseReadback!: (positions: Float32Array) => void;
            stream._workBuffer.readCentersRangeAsync = vi.fn().mockImplementation(() => new Promise<Float32Array>((resolve) => (releaseReadback = resolve)));
            vi.spyOn(stream, "_pumpDecodeQueue").mockImplementation(() => {});
            const decoding = stream._decodeFileAsync(2);
            await vi.waitFor(() => expect(stream._workBuffer.readCentersRangeAsync).toHaveBeenCalled());
            stream.cancelRangeLoads([2]);
            stream._onLodFrame();
            expect(pack.meansTextureL.dispose).not.toHaveBeenCalled();
            releaseReadback(new Float32Array(15 * 4));
            await expect(decoding).resolves.toBe(false);
            stream._onLodFrame();
            expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
        });

        it("disposes the cached source pack with the stream", async () => {
            const stream = makeRangeStream();
            const pack = makePack();
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);
            await stream._decodeFileAsync(2);

            stream.dispose();

            expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
            expect(stream.rangeResidencyStats.pages).toBe(0);
        });

        it("does not resurrect a source pack when disposal runs between load completion and cache publication", async () => {
            const stream = makeRangeStream();
            const pack = makePack();
            vi.spyOn(stream, "_loadPrefetchedPackAsync").mockImplementation(async () => {
                queueMicrotask(() => stream.dispose());
                return pack;
            });

            await expect(stream._getRangeSourcePackAsync(0, stream._fileMeta.get(0))).resolves.toBeNull();

            expect(stream._rangeSourcePack).toBeNull();
            expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
            expect(stream.rangeResidencyStats.cachedSourceSplats).toBe(0);
        });

        it("decodes a split page from its own pack and disposes that pack", async () => {
            const rangePack = (source: { count: number }) => ({ sogData: makeSourceData(source.count), subRootUrl: "pages/" });
            const stream = makeRangeStream({ rangePack });
            const pack = makePack(15);
            const parse = vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);

            await expect(stream._decodeFileAsync(2)).resolves.toBe(true);

            expect(stream._downloadManager.loadFileAsync).toHaveBeenCalledWith("pages/means_l.webp", 2);
            expect(parse).toHaveBeenCalledTimes(1);
            expect(stream._workBuffer.decodeAsync).toHaveBeenCalledWith(pack, expect.any(Number), 0, 15);
            expect(stream._applyDecodedPositionsAsync).toHaveBeenCalledWith(pack, expect.any(Number), 15, 0);
            expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
            expect(stream.rangeResidencyStats).toMatchObject({ splitPackLoads: 1, sourcePackLoads: 0, cachedSourceSplats: 0 });
        });

        it("keeps the whole-file decode path unchanged in a range stream", async () => {
            const stream = makeRangeStream();
            const pack = makePack(20);
            const parse = vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: pack } as any);

            await expect(stream._decodeFileAsync(1)).resolves.toBe(true);

            const meta = stream._fileMeta.get(1);
            expect(parse).toHaveBeenCalledWith(meta.sogData, "base/", scene, expect.any(Boolean), stream._downloadManager, 1);
            expect(stream._workBuffer.decodeAsync).toHaveBeenCalledWith(pack, expect.any(Number));
            expect(stream._applyDecodedPositionsAsync).toHaveBeenCalledWith(pack, expect.any(Number), 20, 0);
            expect(pack.meansTextureL.dispose).toHaveBeenCalledOnce();
            expect(stream.rangeResidencyStats.sourcePackLoads).toBe(0);
        });
    });

    describe("cancelRangeLoads", () => {
        const startLoading = (stream: any, ...ids: number[]) => {
            for (const id of ids) {
                stream._loadingFiles.add(id);
            }
        };

        it("keeps the shared download while another page of the source is still loading", () => {
            const stream = makeRangeStream();
            startLoading(stream, 2, 3);

            stream.cancelRangeLoads([2]);

            expect(stream._cancelledDecodes.has(2)).toBe(true);
            expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalled();
        });

        describe("reference release", () => {
            it("cancels the source group when its last unsplit page loses its reference", () => {
                const stream = makeRangeStream();
                stream._fileRefs.set(2, 1);
                stream._loadingFiles.add(2);

                stream._releaseFileRef(2);

                expect(stream._cancelledDecodes.has(2)).toBe(true);
                expect(stream._downloadManager.cancelGroup).toHaveBeenCalledExactlyOnceWith(0);
            });

            it("does not cancel a shared source while another unsplit page is loading", () => {
                const stream = makeRangeStream();
                stream._fileRefs.set(2, 1);
                stream._loadingFiles.add(2);
                stream._loadingFiles.add(3);

                stream._releaseFileRef(2);

                expect(stream._cancelledDecodes.has(2)).toBe(true);
                expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalled();
            });

            it("keeps a shared source download when an unsplit sibling is queued", () => {
                const stream = makeRangeStream();
                stream._fileRefs.set(2, 1);
                stream._fileRefs.set(3, 1);
                stream._loadingFiles.add(2);
                stream._decodeQueue.push(3);

                stream._releaseFileRef(2);

                expect(stream._cancelledDecodes.has(2)).toBe(true);
                expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalled();
                expect(stream._decodeQueue).toContain(3);
            });

            it("aborts a real source download when its last queued sibling is released and unblocks unrelated decoding", async () => {
                const stream = makeRangeStream();
                const requests = useControlledDownloads(stream);
                vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack(20) } as any);
                stream._fileRefs.set(2, 1);
                stream._fileRefs.set(3, 1);
                const first = stream._decodeFileAsync(2);
                stream._decodeQueue.push(3);
                await vi.waitFor(() => expect(requests).toHaveLength(5));

                stream._releaseFileRef(2);
                expect(requests.every((request) => !request.aborted)).toBe(true);
                stream._releaseFileRef(3);
                expect(stream._decodeQueue).not.toContain(3);
                expect(requests.every((request) => request.aborted)).toBe(true);
                await expect(first).resolves.toBe(false);

                await expect(stream._decodeFileAsync(1)).resolves.toBe(true);
                expect(stream._decodedFiles.has(1)).toBe(true);
            });

            it("keeps the source request while a third same-source queued page still needs it", async () => {
                const stream = makeRangeStream({}, makeMetadata({ offset: 80, count: 10 }));
                const requests = useControlledDownloads(stream);
                vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
                stream._fileRefs.set(2, 1);
                stream._fileRefs.set(3, 1);
                stream._fileRefs.set(4, 1);
                const first = stream._decodeFileAsync(2);
                stream._decodeQueue.push(3, 4);
                await vi.waitFor(() => expect(requests).toHaveLength(5));

                stream._releaseFileRef(2);
                stream._releaseFileRef(3);
                expect(requests.every((request) => !request.aborted)).toBe(true);
                expect(stream._decodeQueue).toEqual([4]);
                requests.forEach((request) => request.succeed());
                await expect(first).resolves.toBe(false);
                await expect(stream._decodeFileAsync(4)).resolves.toBe(true);
                expect(stream._decodedFiles.has(4)).toBe(true);
            });

            it("does not keep an unsplit source load for a split sibling", () => {
                const stream = makeRangeStream({
                    rangePack: (source: { count: number }) => (source.count === 10 ? { sogData: makeSourceData(10), subRootUrl: "pages/" } : null),
                });
                stream._fileRefs.set(2, 1);
                stream._loadingFiles.add(2);
                stream._loadingFiles.add(3);

                stream._releaseFileRef(2);

                expect(stream._downloadManager.cancelGroup).toHaveBeenCalledWith(0);
                expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalledWith(3);
            });

            it("leaves a multiply-referenced page alive and removes queued work on last release", () => {
                const stream = makeRangeStream();
                stream._fileRefs.set(2, 2);
                stream._decodeQueue.push(2);
                stream._releaseFileRef(2);
                expect(stream._fileRefs.get(2)).toBe(1);
                expect(stream._decodeQueue).toContain(2);

                stream._releaseFileRef(2);
                expect(stream._decodeQueue).not.toContain(2);
                expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalled();
            });

            it("preserves whole-file cancellation in default mode and can retry after reacquisition", async () => {
                const stream = makeRangeStream({ rangeResidency: false });
                expect(stream._residencyPages.size).toBe(0);
                expect(stream.getSourceRange(0)).toBeNull();
                expect(stream._leafNodes.map((node: any) => node.lods["0"].file)).toEqual([0, 0, 0]);
                let completeDownload!: (value: { sogTextures: ReturnType<typeof makePack> }) => void;
                const parse = vi.spyOn(Sog, "ParseSogMetaAsTextures");
                parse.mockImplementationOnce(() => new Promise((resolve) => (completeDownload = resolve)));
                parse.mockResolvedValueOnce({ sogTextures: makePack() } as any);
                stream._fileRefs.set(0, 1);
                const firstDecode = stream._decodeFileAsync(0);
                stream._releaseFileRef(0);
                expect(stream._downloadManager.cancelGroup).toHaveBeenCalledWith(0);
                stream._acquirePendingFile(0);
                expect(stream._loadingFiles.has(0)).toBe(true);
                expect(stream._decodeQueue).not.toContain(0);
                completeDownload({ sogTextures: makePack() });
                await expect(firstDecode).resolves.toBe(false);
                expect(stream._loadingFiles.has(0)).toBe(false);
                expect(stream._decodeQueue).toContain(0);
                await expect(stream._decodeFileAsync(0)).resolves.toBe(true);
                expect(stream._decodedFiles.has(0)).toBe(true);
            });

            it("cancels unneeded source HTTP downloads and lets a loaded split page acquire the decode gate", async () => {
                const stream = makeRangeStream({
                    rangePack: (source: { count: number }) => (source.count === 10 ? { sogData: makeSourceData(10), subRootUrl: "split/" } : null),
                });
                const requests = useControlledDownloads(stream);
                vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack(10) } as any);
                stream._fileRefs.set(2, 1);
                stream._fileRefs.set(3, 1);
                const nextNode = stream._leafNodes[2];
                nextNode.targetLevel = 0;
                nextNode.pendingFile = 3;
                const first = stream._decodeFileAsync(2);
                const second = stream._decodeFileAsync(3);
                await vi.waitFor(() => expect(requests).toHaveLength(10));
                requests.filter((request) => request.url.startsWith("split/")).forEach((request) => request.succeed());
                await vi.waitFor(() => expect(stream._rangeSplitPackLoads).toBe(1));

                stream._releaseFileRef(2);
                await expect(first).resolves.toBe(false);
                expect(requests.filter((request) => request.url.startsWith("fine/")).every((request) => request.aborted)).toBe(true);
                expect(requests.filter((request) => request.url.startsWith("split/")).every((request) => !request.aborted)).toBe(true);
                await expect(second).resolves.toBe(true);
                expect(requests).toHaveLength(10);
                expect(stream._decodedFiles.has(3)).toBe(true);
                expect(nextNode.pendingFile).toBeUndefined();
                expect(nextNode.activeFile).toBe(3);
            });

            it("retains one source download for a live same-source page waiting for the decode gate", async () => {
                const stream = makeRangeStream();
                const requests = useControlledDownloads(stream);
                vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
                stream._fileRefs.set(2, 1);
                stream._fileRefs.set(3, 1);
                const nextNode = stream._leafNodes[2];
                nextNode.targetLevel = 0;
                nextNode.pendingFile = 3;
                const first = stream._decodeFileAsync(2);
                const second = stream._decodeFileAsync(3);
                await vi.waitFor(() => expect(requests).toHaveLength(5));

                stream._releaseFileRef(2);
                expect(requests.every((request) => !request.aborted)).toBe(true);
                requests.forEach((request) => request.succeed());
                await expect(first).resolves.toBe(false);
                await expect(second).resolves.toBe(true);
                expect(requests).toHaveLength(5);
                expect(stream.rangeResidencyStats.sourcePackLoads).toBe(1);
                expect(stream.rangeResidencyStats.sourcePackReuses).toBe(1);
                expect(nextNode.pendingFile).toBeUndefined();
                expect(nextNode.activeFile).toBe(3);
            });

            it("does not cancel another split page joined to the first page's centroid URL", async () => {
                const stream = makeRangeStream({
                    rangePack: (source: { offset: number; count: number }) => ({
                        sogData: {
                            count: source.count,
                            means: { files: [`means-l-${source.offset}.webp`, `means-u-${source.offset}.webp`] },
                            scales: { files: [`scales-${source.offset}.webp`] },
                            quats: { files: [`quats-${source.offset}.webp`] },
                            sh0: { files: [`sh0-${source.offset}.webp`] },
                            shN: { files: ["centroid.webp", `labels-${source.offset}.webp`], bands: 1 },
                        },
                        subRootUrl: "pages/",
                    }),
                });
                const requests = useControlledDownloads(stream);
                vi.spyOn(Sog, "ParseSogMetaAsTextures").mockImplementation(
                    async (files) =>
                        ({
                            sogTextures: makePack(JSON.parse(new TextDecoder().decode((files as Map<string, Uint8Array>).get("meta.json"))).count as number),
                        }) as any
                );
                stream._fileRefs.set(2, 1);
                stream._fileRefs.set(3, 1);
                const nextNode = stream._leafNodes[2];
                nextNode.targetLevel = 0;
                nextNode.pendingFile = 3;
                const first = stream._decodeFileAsync(2);
                const second = stream._decodeFileAsync(3);
                expect(requests.filter((request) => request.url === "pages/centroid.webp")).toHaveLength(1);
                expect(requests).toHaveLength(13);

                stream._releaseFileRef(2);
                await expect(first).resolves.toBe(false);
                expect(requests.find((request) => request.url === "pages/centroid.webp")?.aborted).toBe(false);
                requests.filter((request) => !request.aborted).forEach((request) => request.succeed());
                await expect(second).resolves.toBe(true);
                expect(stream._decodedFiles.has(3)).toBe(true);
                expect(nextNode.pendingFile).toBeUndefined();
                expect(nextNode.activeFile).toBe(3);
                expect(stream._fileRefs.get(3)).toBe(1);
            });
        });

        it("cancels the shared download once when every loading page of the source is cancelled", () => {
            const stream = makeRangeStream();
            startLoading(stream, 2, 3);

            stream.cancelRangeLoads([2, 3]);

            expect(stream._downloadManager.cancelGroup).toHaveBeenCalledTimes(1);
            expect(stream._downloadManager.cancelGroup).toHaveBeenCalledWith(0);
        });

        it("keeps a source listed in keepSources", () => {
            const stream = makeRangeStream();
            startLoading(stream, 2, 3);

            stream.cancelRangeLoads([2, 3], [0]);

            expect(stream._cancelledDecodes.has(2)).toBe(true);
            expect(stream._cancelledDecodes.has(3)).toBe(true);
            expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalled();
        });

        it("cancels a split page under its own group and leaves the source download alone", () => {
            const stream = makeRangeStream({ rangePack: (source: { count: number }) => ({ sogData: makeSourceData(source.count), subRootUrl: "pages/" }) });
            startLoading(stream, 2);

            stream.cancelRangeLoads([2]);

            expect(stream._downloadManager.cancelGroup).toHaveBeenCalledTimes(1);
            expect(stream._downloadManager.cancelGroup).toHaveBeenCalledWith(2);
        });

        it("cancels the source download for an unsplit page even while a split sibling is loading", () => {
            const stream = makeRangeStream({ rangePack: (source: { count: number }) => (source.count === 15 ? { sogData: makeSourceData(15), subRootUrl: "pages/" } : null) });
            startLoading(stream, 2, 3);

            stream.cancelRangeLoads([3]);

            expect(stream._downloadManager.cancelGroup).toHaveBeenCalledTimes(1);
            expect(stream._downloadManager.cancelGroup).toHaveBeenCalledWith(0);
        });

        it("ignores pages that are not loading and whole-file IDs", () => {
            const stream = makeRangeStream();
            startLoading(stream, 1);

            stream.cancelRangeLoads([1, 2, 99]);

            expect(stream._cancelledDecodes.size).toBe(0);
            expect(stream._downloadManager.cancelGroup).not.toHaveBeenCalled();
        });
    });

    describe("cancellation during decode", () => {
        it.each([true, false])("frees a %s-range allocation cancelled after readback and retries when referenced", async (ranged) => {
            const stream = makeRangeStream({ rangeResidency: ranged });
            const id = ranged ? 2 : 0;
            stream._fileRefs.set(id, 1);
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
            vi.spyOn(stream, "_applyDecodedPositionsAsync").mockImplementation(async () => {
                if (ranged) {
                    stream.cancelRangeLoads([id]);
                } else {
                    stream._cancelledDecodes.add(id);
                }
                return true;
            });
            const free = vi.spyOn(stream._residency, "free");

            await expect(stream._decodeFileAsync(id)).resolves.toBe(false);

            expect(free).toHaveBeenCalledWith(id);
            expect(stream._residency.has(id)).toBe(false);
            expect(stream._decodeQueue).toContain(id);
            expect(stream._cancelledDecodes.has(id)).toBe(false);
        });

        it("frees the allocation when cancelled after the position readback", async () => {
            const stream = makeRangeStream();
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
            vi.spyOn(stream, "_applyDecodedPositionsAsync").mockImplementation(async () => {
                stream.cancelRangeLoads([2]);
                return true;
            });
            const free = vi.spyOn(stream._residency, "free");

            await expect(stream._decodeFileAsync(2)).resolves.toBe(false);

            expect(stream._decodedFiles.has(2)).toBe(false);
            expect(free).toHaveBeenCalledWith(2);
            expect(stream._residency.has(2)).toBe(false);
            expect(stream._loadingFiles.has(2)).toBe(false);
            expect(stream._cancelledDecodes.has(2)).toBe(false);
        });

        it("re-queues a cancelled page that a node still references", async () => {
            const stream = makeRangeStream();
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
            stream._fileRefs.set(2, 1);
            let releaseDecode!: () => void;
            stream._workBuffer.decodeAsync.mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        releaseDecode = resolve;
                    })
            );

            const decoding = stream._decodeFileAsync(2);
            await vi.waitFor(() => expect(stream._workBuffer.decodeAsync).toHaveBeenCalled());
            stream.cancelRangeLoads([2]);
            releaseDecode();

            await expect(decoding).resolves.toBe(false);
            expect(stream._decodeQueue).toContain(2);
        });

        it("does not re-queue a cancelled page that nothing references", async () => {
            const stream = makeRangeStream();
            vi.spyOn(Sog, "ParseSogMetaAsTextures").mockResolvedValue({ sogTextures: makePack() } as any);
            let releaseDecode!: () => void;
            stream._workBuffer.decodeAsync.mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        releaseDecode = resolve;
                    })
            );

            const decoding = stream._decodeFileAsync(2);
            await vi.waitFor(() => expect(stream._workBuffer.decodeAsync).toHaveBeenCalled());
            stream.cancelRangeLoads([2]);
            releaseDecode();

            await expect(decoding).resolves.toBe(false);
            expect(stream._decodeQueue).not.toContain(2);
        });
    });
});
