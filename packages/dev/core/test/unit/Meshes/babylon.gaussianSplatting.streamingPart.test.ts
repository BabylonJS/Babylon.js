import { NullEngine } from "core/Engines/nullEngine";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { GaussianSplattingCompoundMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh";
import { Scene } from "core/scene";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Builds `count` splats (32 bytes each) with distinct positions so vertexCount is deterministic.
const createMultiSplatData = (count: number): ArrayBuffer => {
    const data = new ArrayBuffer(count * 32);
    const floats = new Float32Array(data);
    const bytes = new Uint8Array(data);
    for (let i = 0; i < count; i++) {
        const f = i * 8;
        floats[f + 0] = i;
        floats[f + 1] = i;
        floats[f + 2] = i;
        floats[f + 3] = 0.5;
        floats[f + 4] = 0.5;
        floats[f + 5] = 0.5;
        const b = i * 32;
        bytes[b + 24] = 255;
        bytes[b + 25] = 255;
        bytes[b + 26] = 255;
        bytes[b + 27] = 255;
        // Identity quaternion in the packed splat layout.
        bytes[b + 28] = 0;
        bytes[b + 29] = 128;
        bytes[b + 30] = 128;
        bytes[b + 31] = 128;
    }
    return data;
};

describe("GaussianSplatting reserveStreamingPart / setPartSplatRanges", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        // NullEngine cannot perform sub-texture uploads (updateTextureData), so keep the atlas width small:
        // reserving after a static part then grows the texture HEIGHT, which forces _addPartsInternal down the
        // full-rebuild path (RawTexture recreation) instead of the incremental sub-upload path — the same way
        // the existing compound tests only ever build via addParts on an empty compound. Rendering/upload
        // correctness (the incremental path, writeSplats) is covered by the Gate 1 Playwright screenshot on a
        // real engine.
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // A fully-loaded standalone GS mesh usable as a static part source.
    const createSource = (splatCount: number) => {
        const mesh = new GaussianSplattingMesh("src", null, scene);
        mesh.disableDepthSort = true;
        mesh.updateData(createMultiSplatData(splatCount));
        return mesh;
    };

    const createCompound = () => {
        const compound = new GaussianSplattingCompoundMesh("compound", null, scene);
        compound.disableDepthSort = true;
        return compound;
    };

    // A compound holding a static part (part 0) followed by a reserved streaming part (part 1). With the defaults
    // the static part occupies atlas splats [0, 16) and the streaming region [16, 64) (atlas width 16).
    const createStaticPlusStream = (staticCount = 16, streamCount = 48) => {
        const compound = createCompound();
        compound.addPart(createSource(staticCount));
        const handle = compound.reserveStreamingPart(streamCount);
        return { compound, handle };
    };

    it("reserves an empty region on an empty compound with correct (row-aligned) bookkeeping", () => {
        const compound = createCompound();
        // Requested 30; the region is row-aligned up to a multiple of the atlas width (16 here) => 32.
        const handle = compound.reserveStreamingPart(30);

        expect(handle.base).toBe(0);
        expect(handle.capacity).toBe(32); // ceil(30 / 16) * 16
        expect(handle.partIndex).toBe(0);
        expect(compound.partCount).toBe(1);
        expect((compound as any)._vertexCount).toBe(32);
        const partIndices = (compound as any)._partIndices as Uint8Array;
        expect(partIndices.length).toBeGreaterThanOrEqual(32);
        for (let i = 0; i < 32; i++) {
            expect(partIndices[i]).toBe(0);
        }
        // Reserved (unwritten) region renders as invisible padding but is still counted when no filter is set.
        expect(compound.renderedSplatCount).toBe(32);
        // NOTE: the atlas textures require a real GPU backend (the MRT is skipped on NullEngine); their
        // existence/population is verified by the runtime spike + viewer, not here.
    });

    it("row-aligns the base past a static part's tail padding", () => {
        const compound = createCompound();
        compound.addPart(createSource(20)); // part 0 => [0, 20); atlas width 16 => occupies rows 0..1 (0..32)
        const handle = compound.reserveStreamingPart(10);

        // base rounds 20 up to the next row boundary (32); capacity 10 rounds up to 16.
        expect(handle.base).toBe(32);
        expect(handle.capacity).toBe(16);
        expect(handle.partIndex).toBe(1);
        // Region spans [20, 48): front padding [20,32) + usable [32,48), all tagged with the streaming part.
        expect((compound as any)._vertexCount).toBe(48);
    });

    it("reserves a region after a static part with the correct base, partIndex, and part indices", () => {
        const compound = createCompound();
        compound.addPart(createSource(16)); // part 0 => [0, 16), atlas height 1

        const handle = compound.reserveStreamingPart(48); // part 1 => [16, 64), grows height (full rebuild)

        expect(handle.base).toBe(16);
        expect(handle.capacity).toBe(48);
        expect(handle.partIndex).toBe(1);
        expect(compound.partCount).toBe(2);
        expect((compound as any)._vertexCount).toBe(64);

        const partIndices = (compound as any)._partIndices as Uint8Array;
        for (let i = 0; i < 16; i++) {
            expect(partIndices[i]).toBe(0);
        }
        for (let i = 16; i < 64; i++) {
            expect(partIndices[i]).toBe(1);
        }
    });

    it("throws on a non-positive, non-integer, or non-finite capacity", () => {
        const compound = createCompound();
        expect(() => compound.reserveStreamingPart(0)).toThrow();
        expect(() => compound.reserveStreamingPart(-5)).toThrow();
        expect(() => compound.reserveStreamingPart(Infinity)).toThrow();
        expect(() => compound.reserveStreamingPart(NaN)).toThrow();
        // 0.5 must NOT be accepted-then-floored to a 0-capacity region.
        expect(() => compound.reserveStreamingPart(0.5)).toThrow();
        expect(() => compound.reserveStreamingPart(3.5)).toThrow();
    });

    it("validates the resulting atlas size, not just the input capacity", () => {
        // maxTextureSize is 16 => maxCapacity 256. A capacity that exactly fills the atlas leaves no room for the
        // always-reserved trailing empty sentinel slot, so it must be rejected (would otherwise be silently clamped).
        expect(() => createCompound().reserveStreamingPart(256)).toThrow();
        expect(() => createCompound().reserveStreamingPart(255)).toThrow(); // rounds up to 256 => same overflow
        // 240 (=15 rows) leaves index 240 for the sentinel within the 256-texel atlas — fits.
        expect(() => createCompound().reserveStreamingPart(240)).not.toThrow();
        // Existing splats + a second region must be validated against the TOTAL, not each region's capacity alone.
        const compound = createCompound();
        compound.reserveStreamingPart(128); // ok on its own
        expect(() => compound.reserveStreamingPart(128)).toThrow(); // 128 + 128 fills the atlas => no sentinel room
    });

    it("validates the SH sizing parameters", () => {
        // shDegree 3 => coeffs 15 => ceil(15*3/16) = 3 SH textures. This exact pairing is accepted.
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", 3, 3)).not.toThrow();
        // Degree out of the supported [0, 4] range, or non-integer.
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", 6, 5)).toThrow();
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", 3, 2.5)).toThrow();
        // Non-integer / negative / non-finite texture count.
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", -1, 3)).toThrow();
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", Infinity, 3)).toThrow();
        // One positive, the other zero — SH must be all-or-nothing.
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", 0, 3)).toThrow();
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", 3, 0)).toThrow();
        // Texture count that doesn't match the degree's implied layout.
        expect(() => createCompound().reserveStreamingPart(16, undefined, "s", 2, 3)).toThrow();
    });

    it("builds the global interval union: static part full + streaming part active ranges", () => {
        const { compound, handle } = createStaticPlusStream();

        // With no override the whole atlas renders.
        expect(compound.renderedSplatCount).toBe(64);

        // Activate two local sub-ranges of the streaming part: local [0,5) and [30,7) => global [16,21) and [46,53).
        handle.setActiveRanges([
            { offset: 0, count: 5 },
            { offset: 30, count: 7 },
        ]);

        // Union = static full [0,16) + streamed [16,21) + [46,53) = 16 + 5 + 7 = 28.
        expect(compound.renderedSplatCount).toBe(28);
    });

    it("coalesces a static part adjacent to the streaming part into a single contiguous range", () => {
        const { compound, handle } = createStaticPlusStream();

        // Stream renders its first 16 splats: global [16, 32) — directly adjacent to the static part [0,16).
        handle.setActiveRanges([{ offset: 0, count: 16 }]);

        expect(compound.renderedSplatCount).toBe(32);
        const active = (compound as any)._activeSplatRanges as Uint32Array;
        // Coalesced into a single [0, 32) interval (offset0=0, count0=32).
        expect(Array.from(active)).toEqual([0, 32]);
    });

    it("clears the filter (renders all) when the streaming part's ranges are set back to null", () => {
        const { compound, handle } = createStaticPlusStream();

        handle.setActiveRanges([{ offset: 0, count: 5 }]);
        expect(compound.renderedSplatCount).toBe(21);

        handle.setActiveRanges(null);
        // No part carries an override => base fast path => everything renders.
        expect(compound.renderedSplatCount).toBe(64);
        expect((compound as any)._activeSplatRanges).toBeNull();
    });

    it("tombstones (does not compact) a part removed while a streaming part is reserved", () => {
        const { compound, handle } = createStaticPlusStream();
        handle.setActiveRanges([{ offset: 0, count: 16 }]); // stream renders its first 16 splats

        const vertexCountBefore = (compound as any)._vertexCount;
        const streamBaseBefore = handle.base;

        // Remove the static part while the stream is resident: no throw, no compaction/shift.
        expect(() => compound.removePart(0)).not.toThrow();

        // The streamed region's offset is untouched (it decodes at a fixed base), and the atlas did not shrink.
        expect(handle.base).toBe(streamBaseBefore);
        expect((compound as any)._vertexCount).toBe(vertexCountBefore);
        // partCount is unchanged — the slot is tombstoned, not spliced (so later parts keep their indices).
        expect(compound.partCount).toBe(2);
        // The removed part is excluded from the render union: only the streamed 16 splats remain.
        expect(compound.renderedSplatCount).toBe(16);
        expect(compound.getPartVisibility(0)).toBe(0);
    });

    it("keeps the streamed splats when its own part is removed via tombstone (union excludes it)", () => {
        const { compound, handle } = createStaticPlusStream();
        handle.setActiveRanges([{ offset: 0, count: 16 }]);
        expect(compound.renderedSplatCount).toBe(32); // static 16 + streamed 16

        // Remove the streaming part itself: it drops out of the union, the static part still renders fully.
        compound.removePart(handle.partIndex);
        expect(compound.getPartVisibility(handle.partIndex)).toBe(0);
        expect(compound.renderedSplatCount).toBe(16); // only the static part
    });

    it("respects the maximum part count", () => {
        // Force a tiny max part count and confirm reserving beyond it throws.
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 45; // -> maxPartCount = floor((45-40)/5) = 1
        const compound = createCompound();
        compound.reserveStreamingPart(8); // part 0 ok
        expect(() => compound.reserveStreamingPart(8)).toThrow();
    });

    it("compactAtlas is a no-op when nothing is tombstoned", () => {
        const { compound, handle } = createStaticPlusStream(16, 16);
        const vcBefore = (compound as any)._vertexCount;
        const baseBefore = handle.base;

        compound.compactAtlas();

        expect(compound.partCount).toBe(2);
        expect((compound as any)._vertexCount).toBe(vcBefore);
        expect(handle.base).toBe(baseBefore);
    });

    it("compactAtlas reclaims a tombstoned static part and relocates the surviving stream to the front", () => {
        const { compound, handle } = createStaticPlusStream(16, 16); // static [0,16) + stream base 16 (row-aligned)
        handle.setActiveRanges([{ offset: 0, count: 5 }]); // stream renders local [0,5) => global [16,21)
        expect(handle.base).toBe(16);
        const vcBefore = (compound as any)._vertexCount; // 32

        // Remove the static part: tombstoned (slot retained, stream keeps its base), so 5 streamed splats render.
        compound.removePart(0);
        expect(compound.partCount).toBe(2);
        expect(compound.renderedSplatCount).toBe(5);
        expect(handle.base).toBe(16); // not yet relocated

        // Reclaim: the tombstoned static rows are freed and the stream relocates to the front (base 0, index 0).
        compound.compactAtlas();
        expect(compound.partCount).toBe(1);
        expect(handle.partIndex).toBe(0);
        expect(handle.base).toBe(0);
        expect((compound as any)._vertexCount).toBeLessThan(vcBefore);
        // The stream's active ranges were re-posted at the new base — still exactly 5 splats render.
        expect(compound.renderedSplatCount).toBe(5);
        expect((compound as any)._tombstonedPartIndices.size).toBe(0);
    });

    it("drops SH degree to 0 when the only SH streaming part is removed (non-SH stream survives, stays neutral)", () => {
        const compound = createCompound();
        // A SH streaming part (degree 3 => 3 packed-u32 SH textures) turns on the shared SH atlas at degree 3;
        // a second, non-SH streaming part (no shN) shares the atlas — its SH rows must stay neutral, never SH-filled.
        const shHandle = compound.reserveStreamingPart(16, undefined, "shStream", /*shTextureCount*/ 3, /*shDegree*/ 3);
        const plainHandle = compound.reserveStreamingPart(16, undefined, "plainStream", /*shTextureCount*/ 0, /*shDegree*/ 0);
        expect(compound.shDegree).toBe(3);
        expect((compound as any)._useShMrtAtlas).toBe(true);
        expect((compound as any)._streamingShDegree).toBe(3);

        // Remove the SH stream (tombstone) then reclaim. The non-SH stream survives; with no SH source left the SH
        // atlas must turn OFF and SH_DEGREE drop to 0 — otherwise the survivor would sample never-filled (raw-0) SH.
        compound.removePart(shHandle.partIndex);
        compound.compactAtlas();
        expect(compound.partCount).toBe(1);
        expect(plainHandle.partIndex).toBe(0);
        expect((compound as any)._useShMrtAtlas).toBe(false);
        expect((compound as any)._streamingShDegree).toBe(0);
        expect(compound.shDegree).toBe(0);
    });

    it("drops stale per-part range overrides on compaction so a later-added part isn't constrained by them", () => {
        // static part 0 [0,16), stream part 1 base 16; give the stream an active-range override (non-null entry at index 1).
        const { compound, handle } = createStaticPlusStream(16, 16);
        handle.setActiveRanges([{ offset: 0, count: 8 }]);
        expect(compound.renderedSplatCount).toBe(24); // static 16 (full) + stream 8 (active)

        compound.removePart(0); // tombstone the static part
        compound.compactAtlas(); // stream relocates to index 0; the old index-1 override must not linger
        expect(compound.partCount).toBe(1);
        expect(compound.renderedSplatCount).toBe(8);
        expect(((compound as any)._partSplatRanges as unknown[]).length).toBeLessThanOrEqual(compound.partCount);

        // A newly added part takes index 1 and must render its FULL extent — not inherit the stale index-1 override.
        compound.addPart(createSource(16));
        expect(compound.partCount).toBe(2);
        expect(compound.renderedSplatCount).toBe(24); // stream 8 + new static 16 (full)
    });

    it("compactAtlas that removes the only (streaming) part empties the compound", () => {
        const compound = createCompound();
        const handle = compound.reserveStreamingPart(16); // streaming part 0
        compound.removePart(handle.partIndex); // tombstone the stream
        compound.compactAtlas();
        expect(compound.partCount).toBe(0);
        expect((compound as any)._hasStreamingPart).toBe(false);
    });

    it("clears all streaming/atlas capability flags when compaction empties the compound", () => {
        const compound = createCompound();
        // A SH + rotation streaming part turns on the render-target atlases and SH degree.
        const handle = compound.reserveStreamingPart(16, undefined, "stream", /*shTextureCount*/ 3, /*shDegree*/ 3, /*needsRotationScale*/ true);
        expect((compound as any)._useShMrtAtlas).toBe(true);
        expect((compound as any)._useRotMrtAtlas).toBe(true);
        expect((compound as any)._useMrtAtlas).toBe(true);

        compound.removePart(handle.partIndex);
        compound.compactAtlas(); // empties the compound

        // A reused empty compound must not carry stale streaming/SH/rotation config into plain content.
        expect((compound as any)._useShMrtAtlas).toBe(false);
        expect((compound as any)._shMrtAtlasTextureCount).toBe(0);
        expect((compound as any)._streamingShDegree).toBe(0);
        expect((compound as any)._useRotMrtAtlas).toBe(false);
        expect((compound as any)._useMrtAtlas).toBe(false);
        // _useRGBACovariants resets to the engine-derived default — RGBA on WebGL 1 (which can't render the RG
        // half-float path), RG otherwise — so a reused compound keeps a supported covariance format.
        const engine = compound.getScene().getEngine();
        expect((compound as any)._useRGBACovariants).toBe(!engine.isWebGPU && engine.version === 1.0);
    });

    it("invalidates a removed part's streaming handle (cannot mutate a surviving part that reused its index)", () => {
        const compound = createCompound();
        const removedHandle = compound.reserveStreamingPart(16); // part 0
        const survivor = compound.reserveStreamingPart(16); // part 1
        compound.removePart(removedHandle.partIndex); // tombstone part 0
        compound.compactAtlas(); // survivor relocates to part 0 / base 0

        // The removed handle must reject every mutating call rather than affect the survivor now at its old index.
        expect(() => removedHandle.setActiveRanges([{ offset: 0, count: 4 }])).toThrow();
        expect(() => removedHandle.postPositionsRange(0, 4)).toThrow();
        expect(() => removedHandle.writeSplats(0, 4, createMultiSplatData(4))).toThrow();
        // The surviving handle still works.
        expect(() => survivor.setActiveRanges([{ offset: 0, count: 4 }])).not.toThrow();
    });

    it("reports finite world-space hierarchy bounds for a part proxy (geometry-less; bounds via setBoundingInfo)", () => {
        const compound = createCompound();
        const proxy = compound.addPart(createSource(20)); // splats at (i,i,i) for i in [0,20) => bounds ~[0,19]

        // The proxy owns no geometry (subMeshes is undefined), so the base getHierarchyBoundingVectors would
        // return a degenerate ±MAX_VALUE box; the override must instead report the part's real world bounds —
        // otherwise camera framing / grounding derive NaN or astronomically large offsets.
        const hb = proxy.getHierarchyBoundingVectors(true);
        expect(Number.isFinite(hb.min.x) && Number.isFinite(hb.min.y) && Number.isFinite(hb.min.z)).toBe(true);
        expect(Number.isFinite(hb.max.x) && Number.isFinite(hb.max.y) && Number.isFinite(hb.max.z)).toBe(true);
        expect(hb.max.x).toBeLessThan(1e6); // not the ±MAX_VALUE degenerate seed
        expect(hb.min.x).toBeGreaterThan(-1e6);

        // Matches the proxy's own world-space bounding box.
        proxy.computeWorldMatrix(true);
        const info = proxy.getBoundingInfo();
        info.update(proxy.getWorldMatrix());
        expect(hb.min.y).toBeCloseTo(info.boundingBox.minimumWorld.y, 4);
        expect(hb.max.z).toBeCloseTo(info.boundingBox.maximumWorld.z, 4);
    });

    it("rejects writeSplats ranges outside the reserved region (never touches another part)", () => {
        const compound = createCompound();
        const handle = compound.reserveStreamingPart(30); // aligned capacity 32 at width 16
        const data = createMultiSplatData(4);
        // Negative offset, negative count, and a range past the region's capacity all throw.
        expect(() => handle.writeSplats(-1, 4, data)).toThrow();
        expect(() => handle.writeSplats(0, -4, data)).toThrow();
        expect(() => handle.writeSplats(handle.capacity - 2, 4, data)).toThrow();
        // A too-short input for the requested count throws (would read past the buffer).
        expect(() => handle.writeSplats(0, 8, createMultiSplatData(2))).toThrow();
        // A valid in-region write does not throw.
        expect(() => handle.writeSplats(0, 4, data)).not.toThrow();
    });

    it("rejects setActiveRanges / postPositionsRange local ranges outside the reserved region", () => {
        const compound = createCompound();
        const handle = compound.reserveStreamingPart(30); // aligned capacity 32 at width 16
        // A local range extending past the region's capacity would activate/patch another part's splats.
        expect(() => handle.setActiveRanges([{ offset: 0, count: handle.capacity + 1 }])).toThrow();
        expect(() => handle.setActiveRanges([{ offset: -1, count: 4 }])).toThrow();
        expect(() => handle.postPositionsRange(handle.capacity - 2, 4)).toThrow();
        expect(() => handle.postPositionsRange(-1, 4)).toThrow();
        // In-region ranges (including the full region and clearing) are accepted.
        expect(() => handle.setActiveRanges([{ offset: 0, count: handle.capacity }])).not.toThrow();
        expect(() => handle.setActiveRanges(null)).not.toThrow();
        expect(() => handle.postPositionsRange(0, handle.capacity)).not.toThrow();
    });

    it("excludes a tombstoned part from the compound's bounds", () => {
        const compound = createCompound();
        compound.addPart(createSource(20)); // part 0 near the origin (~[0,19])
        const far = compound.addPart(createSource(20)); // part 1
        far.position.set(1000, 1000, 1000);
        far.computeWorldMatrix(true);
        compound.reserveStreamingPart(16); // enables tombstoning removePart
        (compound as any)._updateBoundingInfoFromProxies();
        const withFar = compound.getBoundingInfo().boundingBox.maximumWorld.x;
        expect(withFar).toBeGreaterThan(500);

        compound.removePart(far.partIndex); // tombstone the far part
        const withoutFar = compound.getBoundingInfo().boundingBox.maximumWorld.x;
        expect(withoutFar).toBeLessThan(500); // the removed distant part no longer inflates the bounds
    });

    it("recomputes compound bounds from the surviving stream after compaction (not the zero-box placeholder)", () => {
        const { compound, handle } = createStaticPlusStream(16, 16); // static [0,16) near origin + stream base 16
        // Give the streaming region real, far-away world bounds (as a decode would via writeSplats/expandBounds).
        handle.expandBounds(new Vector3(1000, 1000, 1000), new Vector3(1020, 1020, 1020));
        expect(compound.getBoundingInfo().boundingBox.maximumWorld.x).toBeGreaterThan(500);

        // Tombstone the static part, then reclaim. _addPartsInternal rebuilds bounds from the stream's ZERO-box
        // placeholder source, so compaction must recompute from the restored proxy afterward — otherwise the stream
        // (now the only part) collapses to a degenerate box and isInFrustum can cull the whole mesh.
        compound.removePart(0);
        compound.compactAtlas();
        expect(compound.partCount).toBe(1);
        expect(handle.base).toBe(0);
        // Assert the CACHED bounds directly: getBoundingInfo() would lazily recompute and mask the bug, but a
        // static-transform compound never flags bounds dirty, so isInFrustum reads exactly this stale cache.
        expect((compound as any)._cachedBoundingMax.x).toBeGreaterThan(500);
    });

    it("sizes the render-backed SH atlas to the merged (max) SH degree across parts", () => {
        const compound = createCompound();
        // A degree-1 stream needs 1 packed-u32 SH texture.
        compound.reserveStreamingPart(16, undefined, "s1", /*shTextureCount*/ 1, /*shDegree*/ 1);
        expect((compound as any)._shMrtAtlasTextureCount).toBe(1);
        // Adding a degree-3 stream grows the shared atlas to 3 textures (the material samples shTexture0..2).
        compound.reserveStreamingPart(16, undefined, "s3", /*shTextureCount*/ 3, /*shDegree*/ 3);
        expect((compound as any)._shMrtAtlasTextureCount).toBe(3);
        expect(compound.shDegree).toBe(3);
    });

    it("SH reuse guard compares against the required (merged) SH count, not the stale cached field", () => {
        // White-box: the real incremental reserve->addPart path (where a higher-degree part must grow the SH atlas)
        // needs sub-texture uploads, which NullEngine can't do — so drive the guard directly. It must reject reuse
        // when the update REQUIRES more SH textures than the committed atlas, even though _shMrtAtlasTextureCount is
        // stale (it is only refreshed inside _updateTextures, which the incremental path never runs).
        const noopDisposable = { dispose: () => {} }; // afterEach disposes the compound, so mocks need dispose()
        const compound = createCompound() as any;
        compound._useShMrtAtlas = true;
        compound._shMrtAtlas = [noopDisposable]; // a committed degree-1 atlas: 1 texture
        compound._shMrtAtlasTextureCount = 1; // stale field agrees with the atlas length (== 1)
        compound._covariancesATexture = noopDisposable;
        compound._splatPositions = new Float32Array(4);
        compound._cachedBoundingMin = new Vector3();
        compound._cachedBoundingMax = new Vector3();
        compound._textureSize = new Vector2(16, 1);

        // A degree-3 add requires 3 SH textures: reuse must be rejected (atlas length 1 != required 3), so the
        // caller takes the full-rebuild path and grows the atlas — the pre-fix guard read the stale field (1 == 1)
        // and wrongly reused.
        expect(compound._canReuseCachedData(1, 1, 3)).toBe(false);
        // Same required count as the committed atlas: reuse is allowed.
        expect(compound._canReuseCachedData(1, 1, 1)).toBe(true);
    });
});
