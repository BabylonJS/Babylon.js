/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";

/**
 * Message commands exchanged with the Gaussian Splatting depth-sort worker. Every message carries a
 * `command` field naming the intended work, instead of inferring it from which payload is present.
 */
export const GaussianSplattingSortWorkerCommand = {
    /** Main -> worker: set the source splat centers (stride 4: xyz + 1). */
    POSITIONS: "positions",
    /** Main -> worker: patch a contiguous sub-range of the existing source splat centers in place. */
    POSITIONS_UPDATE: "positionsUpdate",
    /** Main -> worker: set the compound-mesh rig node matrices. */
    PART_MATRICES: "partMatrices",
    /** Main -> worker: set the compound-mesh per-splat rig node indices. */
    PART_INDICES: "partIndices",
    /** Main -> worker: set the active source-splat ranges (flat [start0, count0, ...]). */
    INTERVALS: "intervals",
    /** Main -> worker: sort the active splats for a camera view. */
    SORT: "sort",
    /** Worker -> main: a completed sort result. */
    SORTED: "sorted",
} as const;

/**
 * Depth-sort web worker body for Gaussian Splatting meshes.
 *
 * The function is self-contained: it is serialized with `Function.prototype.toString()` and run
 * inside a `Blob`-backed `Worker`, so it must not reference anything from its enclosing module
 * (including {@link GaussianSplattingSortWorkerCommand} — the command literals are duplicated here).
 *
 * The intended work for each message is selected explicitly via its `command` field:
 * - `positions`    set source splat centers (stride 4: xyz + 1).
 * - `partMatrices` set compound-mesh rig node matrices.
 * - `partIndices`  set compound-mesh per-splat rig node indices.
 * - `intervals`    set active source-splat ranges (flat [start0, count0, ...]); persisted across sorts.
 * - `sort`         sort the active splats for `{ worldMatrix, cameraForward, cameraPosition, depthMix,
 *                  cameraId, sortRequestId, rightHanded }` and post back a `sorted` result.
 *
 * @param self - the worker global scope
 */
export const GaussianSplattingSortWorker = function (self: Worker) {
    let positions: Float32Array;
    let depthMix: BigInt64Array;
    let partIndices: Uint8Array;
    let partMatrices: Float32Array[];
    // Active source-splat intervals as flat [start0, count0, start1, count1, ...]. Persisted between
    // sort requests and refreshed by the main thread via the `intervals` message.
    let intervals: Nullable<Uint32Array> = null;
    // Reusable counting-sort scratch buffers (grown on demand, never per-sort allocations).
    let sortSourceIndices: Uint32Array; // active source splat index for each compact slot
    let sortDepths: Float32Array; // view-space depth for each compact slot
    let sortKeys: Uint32Array; // depth-derived integer bucket key for each compact slot
    let sortCounts: Uint32Array; // counting-sort histogram (one entry per bucket)

    self.onmessage = (e: any) => {
        // The intended work is selected explicitly via the message `command` field. These string
        // literals must match GaussianSplattingSortWorkerCommand above (this body is serialized in
        // isolation and cannot reference the shared constant).
        const command = e.data.command;
        if (command === "positions") {
            positions = e.data.positions;
        } else if (command === "positionsUpdate") {
            // Patch only the changed sub-range in place, avoiding a full re-copy/transfer of the entire
            // (potentially hundreds-of-MB) position buffer on every streamed LOD decode.
            if (positions && e.data.data) {
                positions.set(e.data.data, e.data.offset);
            }
        } else if (command === "partMatrices") {
            partMatrices = e.data.partMatrices;
        } else if (command === "partIndices") {
            partIndices = e.data.partIndices;
        } else if (command === "intervals") {
            intervals = e.data.intervals;
        } else if (command === "sort") {
            const cameraId = e.data.cameraId;
            const sortRequestId = e.data.sortRequestId;
            const rangeVersion = e.data.rangeVersion;
            const globalWorldMatrix = e.data.worldMatrix;
            const cameraForward = e.data.cameraForward;
            const cameraPosition = e.data.cameraPosition;

            depthMix = e.data.depthMix;

            if (!positions || !cameraForward) {
                // Sort request arrived before positions were initialized — return the buffer unchanged so the main thread can unlock _canPostToWorker.
                self.postMessage({ command: "sorted", depthMix, cameraId, sortRequestId, rangeVersion }, [depthMix.buffer]);
                return;
            }

            // Feature flags are forwarded by the main thread on each sort request (the worker body is
            // serialized in isolation and cannot read shared statics directly). useCountingSort defaults to
            // true; set it false to fall back to the legacy comparison sort.
            const useCountingSort = e.data.useCountingSort !== false;
            const logSortPerformance = !!e.data.logSortPerformance;

            // `cameraForward` is the view matrix's third row [m[2], m[6], m[10]], which points into the scene
            // in a left-handed scene but back toward the viewer in a right-handed one. As a result the signed
            // `depth = dot(cameraForward, worldPos - cameraPos)` increases with distance in left-handed scenes
            // but decreases with distance in right-handed ones. The counting sort below relies on "larger depth
            // = farther", so negate the depth in right-handed scenes to keep that invariant and preserve correct
            // back-to-front ordering. (The legacy comparison sort handles either sign naturally and is untouched.)
            const depthSign = e.data.rightHanded ? -1 : 1;

            // Resolve the active interval set. The main thread always sends an `intervals` message,
            // but fall back to "all source splats" if a sort somehow arrives before it.
            const activeIntervals = intervals;
            const totalSplats = positions.length / 4;
            let renderSplatCount = totalSplats;
            if (activeIntervals) {
                renderSplatCount = 0;
                for (let rangeIndex = 1; rangeIndex < activeIntervals.length; rangeIndex += 2) {
                    renderSplatCount += activeIntervals[rangeIndex];
                }
            }
            const vertexCountPadded = Math.max((renderSplatCount + 15) & ~0xf, 16);

            // depth = dot(cameraForward, worldPos - cameraPos)
            const camDot = cameraForward[0] * cameraPosition[0] + cameraForward[1] * cameraPosition[1] + cameraForward[2] * cameraPosition[2];

            const computeDepthCoeffs = (m: Float32Array): number[] => {
                return [
                    cameraForward[0] * m[0] + cameraForward[1] * m[1] + cameraForward[2] * m[2],
                    cameraForward[0] * m[4] + cameraForward[1] * m[5] + cameraForward[2] * m[6],
                    cameraForward[0] * m[8] + cameraForward[1] * m[9] + cameraForward[2] * m[10],
                    cameraForward[0] * m[12] + cameraForward[1] * m[13] + cameraForward[2] * m[14] - camDot,
                ];
            };

            // Optional, flag-gated sort timing (a simple wall-clock delta logged to the worker console).
            const perf = (globalThis as { performance?: { now(): number } }).performance;
            const sortStart = logSortPerformance && perf ? perf.now() : 0;

            try {
                if (useCountingSort) {
                    // ===== Fast O(n) counting (radix) sort =====
                    // Output view: the even 32-bit words of the depthMix buffer hold the sorted source indices
                    // (the main thread reads indexMix[2*j]); the odd words are left unused.
                    const outIndices = new Uint32Array(depthMix.buffer);

                    // Grow the reusable scratch buffers when the active count increases (kept across sorts).
                    if (!sortSourceIndices || sortSourceIndices.length < renderSplatCount) {
                        const capacity = Math.max(renderSplatCount, 16);
                        sortSourceIndices = new Uint32Array(capacity);
                        sortDepths = new Float32Array(capacity);
                        sortKeys = new Uint32Array(capacity);
                    }

                    // Compound (rig) meshes give each splat its own world transform via its part: depth uses the
                    // splat's part coefficients. Single meshes use the one global world matrix. Both produce
                    // depths in the same camera-forward space, so all active splats sort together correctly.
                    const compound = !!(partMatrices && partIndices);
                    let depthCoeffs: number[][] = [];
                    let partLen = 0;
                    let a = 0;
                    let b = 0;
                    let c = 0;
                    let d = 0;
                    if (compound) {
                        depthCoeffs = partMatrices.map((m) => {
                            const co = computeDepthCoeffs(m);
                            co[0] *= depthSign;
                            co[1] *= depthSign;
                            co[2] *= depthSign;
                            co[3] *= depthSign;
                            return co;
                        });
                        partLen = partIndices.length;
                    } else {
                        const coeff = computeDepthCoeffs(globalWorldMatrix);
                        a = coeff[0] * depthSign;
                        b = coeff[1] * depthSign;
                        c = coeff[2] * depthSign;
                        d = coeff[3] * depthSign;
                    }

                    // Pass 1: gather the active source indices, compute each splat's view-space depth (signed
                    // distance from the camera along the forward axis), and track the depth range. The compound
                    // branch is hoisted out of the inner loop so the hot path stays straight-line.
                    let writeIndex = 0;
                    let minDepth = Infinity;
                    let maxDepth = -Infinity;
                    const rangeWords = activeIntervals ? activeIntervals.length : 2;
                    for (let r = 0; r < rangeWords; r += 2) {
                        const start = activeIntervals ? activeIntervals[r] : 0;
                        const end = start + (activeIntervals ? activeIntervals[r + 1] : totalSplats);
                        if (compound) {
                            for (let sourceIndex = start; sourceIndex < end; sourceIndex++) {
                                const o = 4 * sourceIndex;
                                const coeff = depthCoeffs[partIndices[sourceIndex < partLen ? sourceIndex : partLen - 1]];
                                const depth = coeff[0] * positions[o] + coeff[1] * positions[o + 1] + coeff[2] * positions[o + 2] + coeff[3];
                                sortSourceIndices[writeIndex] = sourceIndex;
                                sortDepths[writeIndex] = depth;
                                writeIndex++;
                                if (depth < minDepth) {
                                    minDepth = depth;
                                }
                                if (depth > maxDepth) {
                                    maxDepth = depth;
                                }
                            }
                        } else {
                            for (let sourceIndex = start; sourceIndex < end; sourceIndex++) {
                                const o = 4 * sourceIndex;
                                const depth = a * positions[o] + b * positions[o + 1] + c * positions[o + 2] + d;
                                sortSourceIndices[writeIndex] = sourceIndex;
                                sortDepths[writeIndex] = depth;
                                writeIndex++;
                                if (depth < minDepth) {
                                    minDepth = depth;
                                }
                                if (depth > maxDepth) {
                                    maxDepth = depth;
                                }
                            }
                        }
                    }

                    // Counting (radix) sort by a depth-derived integer key — O(n) vs the legacy comparison sort.
                    // Bucket bit depth follows PlayCanvas: round(log2(n/4)) clamped to [10, 20]. The farthest splat
                    // gets key 0 so the ascending counting sort yields back-to-front order for alpha blending.
                    const compareBits = Math.max(10, Math.min(20, Math.round(Math.log2(Math.max(1, renderSplatCount) / 4))));
                    const bucketCount = 2 ** compareBits + 1;
                    if (!sortCounts || sortCounts.length !== bucketCount) {
                        sortCounts = new Uint32Array(bucketCount);
                    } else {
                        sortCounts.fill(0);
                    }

                    const range = maxDepth - minDepth;
                    if (!(range > 1e-12)) {
                        // All active splats share a depth (or none are active): identity order, single bucket.
                        for (let k = 0; k < renderSplatCount; k++) {
                            sortKeys[k] = 0;
                        }
                        sortCounts[0] = renderSplatCount;
                    } else {
                        const scale = (bucketCount - 1) / range;
                        const maxKey = bucketCount - 1;
                        for (let k = 0; k < renderSplatCount; k++) {
                            // maxDepth -> 0 (rendered first), minDepth -> bucketCount-1 (rendered last). Clamp
                            // against float rounding (a tiny `range` makes `scale` huge), which could otherwise
                            // produce key >= bucketCount and corrupt the histogram with out-of-bounds writes.
                            let key = ((maxDepth - sortDepths[k]) * scale) >>> 0;
                            if (key > maxKey) {
                                key = maxKey;
                            }
                            sortKeys[k] = key;
                            sortCounts[key]++;
                        }
                    }

                    // Prefix-sum the histogram into bucket end offsets, then scatter source indices into place.
                    for (let i = 1; i < bucketCount; i++) {
                        sortCounts[i] += sortCounts[i - 1];
                    }
                    for (let k = 0; k < renderSplatCount; k++) {
                        const dest = --sortCounts[sortKeys[k]];
                        outIndices[2 * dest] = sortSourceIndices[k];
                    }

                    // Pad the remainder up to the 16-multiple with the reserved (invisible) splat index 0.
                    for (let dest = renderSplatCount; dest < vertexCountPadded; dest++) {
                        outIndices[2 * dest] = 0;
                    }
                } else {
                    // ===== Legacy comparison sort: pack (index, ~depthBits) into each 64-bit lane and sort it =====
                    const indices = new Uint32Array(depthMix.buffer);
                    const floatMix = new Float32Array(depthMix.buffer);

                    // Build the compact list of source-splat indices to sort.
                    if (activeIntervals) {
                        let writeIndex = 0;
                        for (let rangeIndex = 0; rangeIndex < activeIntervals.length; rangeIndex += 2) {
                            const start = activeIntervals[rangeIndex];
                            const count = activeIntervals[rangeIndex + 1];
                            for (let sourceIndex = start; sourceIndex < start + count; sourceIndex++) {
                                indices[2 * writeIndex++] = sourceIndex;
                            }
                        }
                        // Pad up to a multiple of 16 with the reserved (invisible) splat index 0.
                        for (; writeIndex < vertexCountPadded; writeIndex++) {
                            indices[2 * writeIndex] = 0;
                        }
                    } else {
                        for (let j = 0; j < vertexCountPadded; j++) {
                            indices[2 * j] = j;
                        }
                    }

                    if (partMatrices && partIndices) {
                        // Precompute depth coefficients for each rig node.
                        const depthCoeffs = partMatrices.map((m) => computeDepthCoeffs(m));
                        // NB: For performance reasons, we assume that part indices are valid.
                        const length = partIndices.length;
                        for (let j = 0; j < vertexCountPadded; j++) {
                            const sourceIndex = indices[2 * j];
                            // NB: We need this 'min' because the vertex array is padded, not partIndices.
                            const partIndex = partIndices[Math.min(sourceIndex, length - 1)];
                            const coeff = depthCoeffs[partIndex];
                            floatMix[2 * j + 1] =
                                coeff[0] * positions[4 * sourceIndex + 0] + coeff[1] * positions[4 * sourceIndex + 1] + coeff[2] * positions[4 * sourceIndex + 2] + coeff[3];
                            // Invert the depth bits (bitwise not) so the ascending sort renders back to front.
                            indices[2 * j + 1] = ~indices[2 * j + 1];
                        }
                    } else {
                        const [a, b, c, d] = computeDepthCoeffs(globalWorldMatrix);
                        for (let j = 0; j < vertexCountPadded; j++) {
                            const sourceIndex = indices[2 * j];
                            floatMix[2 * j + 1] = a * positions[4 * sourceIndex + 0] + b * positions[4 * sourceIndex + 1] + c * positions[4 * sourceIndex + 2] + d;
                            indices[2 * j + 1] = ~indices[2 * j + 1];
                        }
                    }

                    depthMix.sort();
                }
            } catch (sortError) {
                // Transient data inconsistency (e.g. partIndices/partMatrices mismatch during addPart/removePart rebuild).
                // Return the buffer unsorted so the main thread can unlock _canPostToWorker and retry next frame.
                // Logger is unavailable inside the worker — console is the only option.
                // eslint-disable-next-line no-console
                console.error("Gaussian splat sort worker encountered an error (will retry next frame):", sortError);
            }

            if (logSortPerformance && perf) {
                // eslint-disable-next-line no-console
                console.log(`[GaussianSplatting] ${useCountingSort ? "counting" : "legacy"} sort: ${renderSplatCount} splats in ${(perf.now() - sortStart).toFixed(2)}ms`);
            }

            self.postMessage({ command: "sorted", depthMix, cameraId, sortRequestId, rangeVersion }, [depthMix.buffer]);
        }
    };
};
