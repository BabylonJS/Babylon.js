/** This file must only contain pure code and pure imports */

import { type Nullable } from "core/types";

/**
 * Message commands exchanged with the Gaussian Splatting depth-sort worker. Every message carries a
 * `command` field naming the intended work, instead of inferring it from which payload is present.
 */
export const GaussianSplattingSortWorkerCommand = {
    /** Main -> worker: set the source splat centers (stride 4: xyz + 1). */
    POSITIONS: "positions",
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
 *                  cameraId, sortRequestId }` and post back a `sorted` result.
 *
 * @param self - the worker global scope
 */
export const GaussianSplattingSortWorker = function (self: Worker) {
    let positions: Float32Array;
    let depthMix: BigInt64Array;
    let indices: Uint32Array;
    let floatMix: Float32Array;
    let partIndices: Uint8Array;
    let partMatrices: Float32Array[];
    // Active source-splat intervals as flat [start0, count0, start1, count1, ...]. Persisted between
    // sort requests and refreshed by the main thread via the `intervals` message.
    let intervals: Nullable<Uint32Array> = null;

    self.onmessage = (e: any) => {
        // The intended work is selected explicitly via the message `command` field. These string
        // literals must match GaussianSplattingSortWorkerCommand above (this body is serialized in
        // isolation and cannot reference the shared constant).
        const command = e.data.command;
        if (command === "positions") {
            positions = e.data.positions;
        } else if (command === "partMatrices") {
            partMatrices = e.data.partMatrices;
        } else if (command === "partIndices") {
            partIndices = e.data.partIndices;
        } else if (command === "intervals") {
            intervals = e.data.intervals;
        } else if (command === "sort") {
            const cameraId = e.data.cameraId;
            const sortRequestId = e.data.sortRequestId;
            const globalWorldMatrix = e.data.worldMatrix;
            const cameraForward = e.data.cameraForward;
            const cameraPosition = e.data.cameraPosition;

            depthMix = e.data.depthMix;

            if (!positions || !cameraForward) {
                // Sort request arrived before positions were initialized — return the buffer unchanged so the main thread can unlock _canPostToWorker.
                self.postMessage({ command: "sorted", depthMix, cameraId, sortRequestId }, [depthMix.buffer]);
                return;
            }

            // Resolve the active interval set. The main thread always sends an `intervals` message,
            // but fall back to "all source splats" if a sort somehow arrives before it.
            const activeIntervals = intervals;
            let renderSplatCount = positions.length / 4;
            if (activeIntervals) {
                renderSplatCount = 0;
                for (let rangeIndex = 1; rangeIndex < activeIntervals.length; rangeIndex += 2) {
                    renderSplatCount += activeIntervals[rangeIndex];
                }
            }
            const vertexCountPadded = Math.max((renderSplatCount + 15) & ~0xf, 16);

            indices = new Uint32Array(depthMix.buffer);
            floatMix = new Float32Array(depthMix.buffer);

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
                // Pad up to a multiple of 16 with an existing (back-to-front-harmless) source index.
                for (; writeIndex < vertexCountPadded; writeIndex++) {
                    indices[2 * writeIndex] = 0;
                }
            } else {
                for (let j = 0; j < vertexCountPadded; j++) {
                    indices[2 * j] = j;
                }
            }

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

            try {
                if (partMatrices && partIndices) {
                    // Precompute depth coefficients for each rig node
                    const depthCoeffs = partMatrices.map((m) => computeDepthCoeffs(m));

                    // NB: For performance reasons, we assume that part indices are valid
                    const length = partIndices.length;
                    for (let j = 0; j < vertexCountPadded; j++) {
                        const sourceIndex = indices[2 * j];
                        // NB: We need this 'min' because vertex array is padded, not partIndices
                        const partIndex = partIndices[Math.min(sourceIndex, length - 1)];
                        const coeff = depthCoeffs[partIndex];
                        floatMix[2 * j + 1] =
                            coeff[0] * positions[4 * sourceIndex + 0] + coeff[1] * positions[4 * sourceIndex + 1] + coeff[2] * positions[4 * sourceIndex + 2] + coeff[3];
                        // instead of using minus to sort back to front, we use bitwise not operator to invert the order of indices
                        // might not be faster but a minus sign implies a reference value that may not be enough and will decrease floatting precision
                        indices[2 * j + 1] = ~indices[2 * j + 1];
                    }
                } else {
                    // Compute depth coefficients from global world matrix
                    const [a, b, c, d] = computeDepthCoeffs(globalWorldMatrix);
                    for (let j = 0; j < vertexCountPadded; j++) {
                        const sourceIndex = indices[2 * j];
                        floatMix[2 * j + 1] = a * positions[4 * sourceIndex + 0] + b * positions[4 * sourceIndex + 1] + c * positions[4 * sourceIndex + 2] + d;
                        indices[2 * j + 1] = ~indices[2 * j + 1];
                    }
                }

                depthMix.sort();
            } catch (sortError) {
                // Transient data inconsistency (e.g. partIndices/partMatrices mismatch during addPart/removePart rebuild).
                // Return the buffer unsorted so the main thread can unlock _canPostToWorker and retry next frame.
                // Logger is unavailable inside the worker — console is the only option.
                // eslint-disable-next-line no-console
                console.error("Gaussian splat sort worker encountered an error (will retry next frame):", sortError);
            }

            self.postMessage({ command: "sorted", depthMix, cameraId, sortRequestId }, [depthMix.buffer]);
        }
    };
};
