import { describe, expect, it } from "vitest";
import { GaussianSplattingBlockAllocator, type GaussianSplattingMemBlock } from "loaders/SPLAT/gaussianSplattingBlockAllocator";

// Validates the allocator's internal consistency: blocks tile [0, capacity) with no gaps/overlaps,
// and the reported used/free sizes match the walked totals.
function AssertConsistent(alloc: GaussianSplattingBlockAllocator, blocks: GaussianSplattingMemBlock[]): void {
    const sorted = blocks.slice().sort((a, b) => a.offset - b.offset);
    let cursor = 0;
    let used = 0;
    for (const b of sorted) {
        expect(b.offset).toBeGreaterThanOrEqual(cursor);
        cursor = b.offset + b.size;
        used += b.size;
        expect(cursor).toBeLessThanOrEqual(alloc.capacity);
    }
    // No two allocated blocks overlap (cursor advanced monotonically above).
    expect(used).toBe(alloc.usedSize);
    expect(alloc.usedSize + alloc.freeSize).toBe(alloc.capacity);
}

describe("GaussianSplattingBlockAllocator", () => {
    it("allocates contiguous blocks from a fresh allocator", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const a = alloc.allocate(10)!;
        const b = alloc.allocate(20)!;
        const c = alloc.allocate(5)!;

        expect(a.offset).toBe(0);
        expect(a.size).toBe(10);
        expect(b.offset).toBe(10);
        expect(c.offset).toBe(30);
        expect(alloc.usedSize).toBe(35);
        expect(alloc.freeSize).toBe(65);
        AssertConsistent(alloc, [a, b, c]);
    });

    it("returns null when no block is large enough", () => {
        const alloc = new GaussianSplattingBlockAllocator(16);
        expect(alloc.allocate(20)).toBeNull();
        const a = alloc.allocate(16)!;
        expect(a.offset).toBe(0);
        // Fully used now.
        expect(alloc.allocate(1)).toBeNull();
        expect(alloc.freeSize).toBe(0);
    });

    it("rejects non-positive sizes", () => {
        const alloc = new GaussianSplattingBlockAllocator(16);
        expect(alloc.allocate(0)).toBeNull();
        expect(alloc.allocate(-4)).toBeNull();
    });

    it("converts an exact-fit free block in place (no split)", () => {
        const alloc = new GaussianSplattingBlockAllocator(10);
        const a = alloc.allocate(10)!;
        expect(a.offset).toBe(0);
        expect(a.size).toBe(10);
        expect(alloc.freeSize).toBe(0);
    });

    it("coalesces with the left neighbor on free", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const a = alloc.allocate(10)!;
        const b = alloc.allocate(10)!;
        alloc.allocate(10); // keep a right wall so freeing b only merges left
        alloc.free(a);
        alloc.free(b);
        // a (0..10) and b (10..20) coalesce into one 20-wide free region; a 20-wide alloc reuses offset 0.
        const big = alloc.allocate(20)!;
        expect(big.offset).toBe(0);
        expect(big.size).toBe(20);
    });

    it("coalesces with both neighbors on free", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const a = alloc.allocate(10)!;
        const b = alloc.allocate(10)!;
        const c = alloc.allocate(10)!;
        alloc.allocate(10); // right wall
        alloc.free(a);
        alloc.free(c);
        // Freeing b merges a+b+c into one 30-wide region.
        alloc.free(b);
        const big = alloc.allocate(30)!;
        expect(big.offset).toBe(0);
        expect(big.size).toBe(30);
    });

    it("reuses a freed region for a same-or-smaller allocation", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const a = alloc.allocate(40)!;
        alloc.allocate(40); // wall
        alloc.free(a);
        const reused = alloc.allocate(30)!;
        expect(reused.offset).toBe(0);
        expect(reused.size).toBe(30);
        // Remainder of the freed region is still available.
        const remainder = alloc.allocate(10)!;
        expect(remainder.offset).toBe(30);
    });

    it("reports fragmentation and grows to satisfy a large request", () => {
        const alloc = new GaussianSplattingBlockAllocator(50);
        const a = alloc.allocate(10)!;
        const b = alloc.allocate(10)!;
        const c = alloc.allocate(10)!;
        const d = alloc.allocate(10)!;
        const e = alloc.allocate(10)!;
        // Fully used (no tail free block). Free a and c -> two isolated size-10 holes between allocated walls.
        alloc.free(a);
        alloc.free(c);
        expect(alloc.fragmentation).toBeGreaterThan(0);

        // No single contiguous 15-wide block exists (holes are size 10), though total free >= 15.
        expect(alloc.allocate(15)).toBeNull();
        alloc.grow(80);
        const big = alloc.allocate(15)!;
        expect(big.offset).toBe(50);
        expect(big.size).toBe(15);
        AssertConsistent(alloc, [b, d, e, big]);
    });

    it("grow extends the tail free block and never shrinks", () => {
        const alloc = new GaussianSplattingBlockAllocator(50);
        alloc.allocate(50); // fully used, no tail free block
        alloc.grow(80);
        expect(alloc.capacity).toBe(80);
        const a = alloc.allocate(30)!;
        expect(a.offset).toBe(50);
        // grow to a smaller/equal capacity is a no-op.
        alloc.grow(80);
        alloc.grow(10);
        expect(alloc.capacity).toBe(80);
    });

    it("full defrag compacts allocated blocks to the front and reports moves", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const a = alloc.allocate(10)!;
        const b = alloc.allocate(10)!;
        const c = alloc.allocate(10)!;
        const d = alloc.allocate(10)!;
        // Free a and c -> holes at 0..10 and 20..30.
        alloc.free(a);
        alloc.free(c);

        const moved = alloc.defrag(0);
        // b (was at 10) and d (was at 30) slide forward; the order of surviving blocks is preserved.
        expect(b.offset).toBe(0);
        expect(d.offset).toBe(10);
        expect(moved.has(b)).toBe(true);
        expect(moved.has(d)).toBe(true);
        expect(alloc.usedSize).toBe(20);
        expect(alloc.fragmentation).toBe(0);
        AssertConsistent(alloc, [b, d]);

        // The compacted tail is one contiguous free region of 80.
        const big = alloc.allocate(80)!;
        expect(big.offset).toBe(20);
    });

    it("incremental defrag moves at most the requested number of blocks", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const blocks: GaussianSplattingMemBlock[] = [];
        for (let i = 0; i < 8; i++) {
            blocks.push(alloc.allocate(10)!);
        }
        // Free every other block to create interior holes.
        alloc.free(blocks[1]);
        alloc.free(blocks[3]);
        alloc.free(blocks[5]);
        const survivors = [blocks[0], blocks[2], blocks[4], blocks[6], blocks[7]];

        const moved = alloc.defrag(2);
        expect(moved.size).toBeGreaterThan(0);
        expect(moved.size).toBeLessThanOrEqual(2);
        AssertConsistent(alloc, survivors);
    });

    it("updateAllocation frees and allocates in batch, growing+compacting on pressure", () => {
        const alloc = new GaussianSplattingBlockAllocator(100, 1.5);
        const a = alloc.allocate(30)!;
        const b = alloc.allocate(30)!;
        const c = alloc.allocate(30)!;

        // Free b; request three 30-wide blocks. Total needed (120) exceeds capacity -> grow + full defrag.
        const toAllocate: Array<number | GaussianSplattingMemBlock> = [30, 30, 30];
        const fullRebuild = alloc.updateAllocation([b], toAllocate);

        expect(fullRebuild).toBe(true);
        for (const entry of toAllocate) {
            expect(typeof entry).not.toBe("number");
        }
        const newBlocks = toAllocate as GaussianSplattingMemBlock[];
        // a and c survive; the three new blocks all got real offsets within the grown capacity.
        AssertConsistent(alloc, [a, c, ...newBlocks]);
        expect(alloc.usedSize).toBe(30 * 5);
    });

    it("updateAllocation without pressure does not report a full rebuild", () => {
        const alloc = new GaussianSplattingBlockAllocator(100);
        const a = alloc.allocate(10)!;
        const toAllocate: Array<number | GaussianSplattingMemBlock> = [20];
        const fullRebuild = alloc.updateAllocation([], toAllocate);
        expect(fullRebuild).toBe(false);
        expect((toAllocate[0] as GaussianSplattingMemBlock).offset).toBe(10);
        AssertConsistent(alloc, [a, toAllocate[0] as GaussianSplattingMemBlock]);
    });

    it("double free is a no-op", () => {
        const alloc = new GaussianSplattingBlockAllocator(50);
        const a = alloc.allocate(10)!;
        alloc.free(a);
        const freeBefore = alloc.freeSize;
        alloc.free(a);
        expect(alloc.freeSize).toBe(freeBefore);
    });

    it("handles a zero-capacity allocator (grow then allocate)", () => {
        const alloc = new GaussianSplattingBlockAllocator();
        expect(alloc.capacity).toBe(0);
        expect(alloc.allocate(10)).toBeNull();
        alloc.grow(40);
        const a = alloc.allocate(10)!;
        expect(a.offset).toBe(0);
        expect(alloc.capacity).toBe(40);
    });
});
