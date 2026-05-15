import { describe, it, expect } from "vitest";

/**
 * The z-order sorting algorithm used in RenderingManager.ready().
 * Extracted here for unit testing since RenderingManager requires a GPU engine.
 *
 * Sorts sprites back-to-front: higher original layer indices render first (further back).
 * Ties are broken by insertion order descending (later-added sprites are further back).
 */
function sortSpriteIndices(layerIndices: number[]): number[] {
    const count = layerIndices.length;
    const indices = new Array<number>(count);
    for (let i = 0; i < count; i++) {
        indices[i] = i;
    }
    indices.sort((a, b) => {
        const layerDiff = layerIndices[b] - layerIndices[a];
        if (layerDiff !== 0) {
            return layerDiff;
        }
        return b - a;
    });
    return indices;
}

describe("RenderingManager z-order sorting", () => {
    it("sorts sprites back-to-front by descending layer index", () => {
        // Layer indices: [0, 1, 2] → sorted: [2, 1, 0] (highest layer first = furthest back)
        const layerIndices = [0, 1, 2];
        const sorted = sortSpriteIndices(layerIndices);

        expect(sorted).toEqual([2, 1, 0]);
    });

    it("breaks ties by insertion order descending", () => {
        // Two sprites in same layer: later-added one should come first (further back)
        const layerIndices = [1, 1];
        const sorted = sortSpriteIndices(layerIndices);

        expect(sorted).toEqual([1, 0]);
    });

    it("handles mixed layer indices with ties", () => {
        // Sprite 0: layer 2
        // Sprite 1: layer 0
        // Sprite 2: layer 2
        // Sprite 3: layer 1
        // Expected order: layer 2 sprites first (2, 0), then layer 1 (3), then layer 0 (1)
        const layerIndices = [2, 0, 2, 1];
        const sorted = sortSpriteIndices(layerIndices);

        expect(sorted).toEqual([2, 0, 3, 1]);
    });

    it("handles single sprite", () => {
        const layerIndices = [5];
        const sorted = sortSpriteIndices(layerIndices);

        expect(sorted).toEqual([0]);
    });

    it("handles empty array", () => {
        const layerIndices: number[] = [];
        const sorted = sortSpriteIndices(layerIndices);

        expect(sorted).toEqual([]);
    });

    it("preserves stable order for all same layer index", () => {
        // All same layer → sorted by insertion order descending
        const layerIndices = [3, 3, 3, 3];
        const sorted = sortSpriteIndices(layerIndices);

        expect(sorted).toEqual([3, 2, 1, 0]);
    });

    it("correctly orders a realistic Lottie scenario with parent-child reordering", () => {
        // Simulates a case where parser reorders layers for parent-child relationships:
        // Original Lottie order: layers [0, 1, 2, 3, 4]
        // After parent-child reorder, parseLayer is called in order: [0, 2, 1, 4, 3]
        // So _currentLayerOriginalIndex values passed to addSprite are: [0, 2, 1, 4, 3]
        // Expected render order (back to front): layer 4, 3, 2, 1, 0
        const layerIndices = [0, 2, 1, 4, 3];
        const sorted = sortSpriteIndices(layerIndices);

        // Index 3 has layer 4 (furthest back)
        // Index 4 has layer 3
        // Index 1 has layer 2
        // Index 2 has layer 1
        // Index 0 has layer 0 (frontmost, rendered last)
        expect(sorted).toEqual([3, 4, 1, 2, 0]);
    });
});
