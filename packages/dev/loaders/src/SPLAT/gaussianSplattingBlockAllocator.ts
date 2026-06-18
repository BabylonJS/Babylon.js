import { type Nullable } from "core/types";

/**
 * A node in the {@link GaussianSplattingBlockAllocator}'s linked list, representing either an allocated
 * block or a free region. Callers receive {@link GaussianSplattingMemBlock} instances as handles from
 * {@link GaussianSplattingBlockAllocator.allocate} and must treat their {@link offset}/{@link size} as
 * read-only.
 *
 * Ported from the PlayCanvas engine (`src/core/block-allocator.js`).
 * @experimental
 */
export class GaussianSplattingMemBlock {
    /** @internal Position in the address space. */
    public _offset = 0;
    /** @internal Size of this block. */
    public _size = 0;
    /** @internal True if this is a free region, false if allocated. */
    public _free = true;
    /** @internal Previous node in the main (all-nodes, offset-ordered) list. */
    public _prev: Nullable<GaussianSplattingMemBlock> = null;
    /** @internal Next node in the main (all-nodes, offset-ordered) list. */
    public _next: Nullable<GaussianSplattingMemBlock> = null;
    /** @internal Previous node in the bucket free-list. */
    public _prevFree: Nullable<GaussianSplattingMemBlock> = null;
    /** @internal Next node in the bucket free-list. */
    public _nextFree: Nullable<GaussianSplattingMemBlock> = null;
    /** @internal Index of the size bucket this free block belongs to, or -1 if not in any bucket. */
    public _bucket = -1;

    /**
     * The offset of this block in the address space.
     */
    public get offset(): number {
        return this._offset;
    }

    /**
     * The size of this block.
     */
    public get size(): number {
        return this._size;
    }
}

/**
 * A general-purpose 1D block allocator backed by a doubly-linked list with segregated free-list buckets.
 * Manages a linear address space where contiguous blocks can be allocated and freed.
 *
 * Free blocks are organized into power-of-2 size buckets for best-fit allocation, which reduces
 * fragmentation compared to a single first-fit free list. Supports incremental defragmentation and
 * automatic growth. Used to place streamed Gaussian Splatting LOD files into the unified GPU work buffer.
 *
 * Ported from the PlayCanvas engine (`src/core/block-allocator.js`).
 * @experimental
 */
export class GaussianSplattingBlockAllocator {
    // Head/tail of the main list (all blocks, offset-ordered).
    private _headAll: Nullable<GaussianSplattingMemBlock> = null;
    private _tailAll: Nullable<GaussianSplattingMemBlock> = null;
    // Segregated free-list bucket heads. Bucket i covers sizes [2^i, 2^(i+1)). Grows as larger free blocks appear.
    private readonly _freeBucketHeads: Array<Nullable<GaussianSplattingMemBlock>> = [];
    // Pool of recycled MemBlock objects.
    private readonly _pool: GaussianSplattingMemBlock[] = [];
    private _capacity = 0;
    private _usedSize = 0;
    private _freeSize = 0;
    // Number of free regions; maintained O(1) for the fragmentation metric.
    private _freeRegionCount = 0;
    // Multiplicative growth factor used by updateAllocation.
    private readonly _growMultiplier: number;

    /**
     * Creates a new block allocator.
     * @param capacity initial address space capacity (defaults to 0)
     * @param growMultiplier multiplicative growth factor for auto-grow in {@link updateAllocation} (defaults to 1.1)
     */
    public constructor(capacity = 0, growMultiplier = 1.1) {
        this._growMultiplier = growMultiplier;
        if (capacity > 0) {
            this._capacity = capacity;
            this._freeSize = capacity;
            const block = this._obtain(0, capacity, true);
            this._headAll = block;
            this._tailAll = block;
            this._addToBucket(block);
        }
    }

    /**
     * Total address space capacity.
     */
    public get capacity(): number {
        return this._capacity;
    }

    /**
     * Total size of all allocated blocks.
     */
    public get usedSize(): number {
        return this._usedSize;
    }

    /**
     * Total size of all free regions.
     */
    public get freeSize(): number {
        return this._freeSize;
    }

    /**
     * Fragmentation ratio in the range [0, 1]. Returns 0 when all free space is one contiguous block
     * (ideal), and approaches 1 when free space is split into many pieces. Computed O(1).
     */
    public get fragmentation(): number {
        return this._freeSize > 0 ? 1 - 1 / this._freeRegionCount : 0;
    }

    /**
     * Allocates a contiguous block of the given size.
     * @param size the number of units to allocate (must be \> 0)
     * @returns a block handle, or null if no space is available
     */
    public allocate(size: number): Nullable<GaussianSplattingMemBlock> {
        if (size <= 0) {
            return null;
        }

        const gap = this._findFreeBlock(size);
        if (!gap) {
            return null;
        }

        this._usedSize += size;
        this._freeSize -= size;

        if (gap._size === size) {
            // Perfect fit: convert free block to allocated.
            gap._free = false;
            this._removeFromBucket(gap);
            return gap;
        }

        // Split: create allocated block at start of gap, shrink gap.
        const alloc = this._obtain(gap._offset, size, false);
        gap._offset += size;
        gap._size -= size;
        this._rebucket(gap);
        this._insertAfterInMainList(alloc, gap._prev);
        return alloc;
    }

    /**
     * Frees a previously allocated block. Adjacent free regions are merged automatically.
     * @param block the block to free (must have been returned by {@link allocate})
     */
    public free(block: GaussianSplattingMemBlock): void {
        if (!block || block._free) {
            return;
        }

        block._free = true;
        this._usedSize -= block._size;
        this._freeSize += block._size;

        const prev = block._prev;
        const next = block._next;
        const prevFree = prev && prev._free;
        const nextFree = next && next._free;

        if (prevFree && nextFree) {
            // Both neighbors free: merge all three into prev.
            prev._size += block._size + next._size;
            this._removeFromMainList(block);
            this._removeFromMainList(next);
            this._removeFromBucket(next);
            this._release(block);
            this._release(next);
            this._rebucket(prev);
        } else if (prevFree) {
            // Left neighbor free: merge into prev.
            prev._size += block._size;
            this._removeFromMainList(block);
            this._release(block);
            this._rebucket(prev);
        } else if (nextFree) {
            // Right neighbor free: absorb right into block.
            block._size += next._size;
            this._removeFromMainList(next);
            this._removeFromBucket(next);
            this._release(next);
            this._addToBucket(block);
        } else {
            // Neither neighbor free: insert into bucket.
            this._addToBucket(block);
        }
    }

    /**
     * Grows the address space. Only increases capacity, never decreases.
     * @param newCapacity the new capacity (must be \> current capacity)
     */
    public grow(newCapacity: number): void {
        if (newCapacity <= this._capacity) {
            return;
        }

        const added = newCapacity - this._capacity;
        this._capacity = newCapacity;
        this._freeSize += added;

        if (this._tailAll && this._tailAll._free) {
            // Extend existing tail free block.
            this._tailAll._size += added;
            this._rebucket(this._tailAll);
        } else {
            // Append new free block.
            const block = this._obtain(this._capacity - added, added, true);
            this._insertAfterInMainList(block, this._tailAll);
            this._addToBucket(block);
        }
    }

    /**
     * Defragments the allocator by moving allocated blocks to reduce fragmentation.
     *
     * When maxMoves is 0, performs a full compaction in a single O(n) pass: all allocated blocks are packed
     * contiguously from offset 0 and a single free block is placed at the end. When maxMoves \> 0, performs
     * incremental defragmentation (relocate the last block into the first fitting gap, then slide blocks left).
     *
     * Moved blocks have their {@link GaussianSplattingMemBlock.offset} updated in place (handles stay valid),
     * so callers must relocate the corresponding GPU data for every block in the returned set.
     * @param maxMoves maximum number of block moves (0 = full compaction, the default)
     * @param result optional set to receive the moved blocks (defaults to a new set)
     * @returns the set of blocks that were moved
     */
    public defrag(maxMoves = 0, result: Set<GaussianSplattingMemBlock> = new Set()): Set<GaussianSplattingMemBlock> {
        result.clear();

        if (this._freeRegionCount === 0) {
            return result;
        }

        if (maxMoves === 0) {
            this._defragFull(result);
        } else {
            this._defragIncremental(maxMoves, result);
        }

        return result;
    }

    /**
     * Batch update: frees a set of blocks and allocates new ones. Handles growth and compaction internally
     * when allocations cannot be satisfied. The `toAllocate` array is modified in place: each numeric size
     * entry is replaced with the allocated block.
     * @param toFree blocks to release
     * @param toAllocate sizes to allocate; modified in place (numbers are replaced with block handles)
     * @returns true if a full defrag was performed (all existing blocks have new offsets and must be re-rendered)
     */
    public updateAllocation(toFree: GaussianSplattingMemBlock[], toAllocate: Array<number | GaussianSplattingMemBlock>): boolean {
        // Phase 1: free old blocks.
        for (let i = 0; i < toFree.length; i++) {
            this.free(toFree[i]);
        }

        // Phase 2: try to allocate all new blocks.
        for (let i = 0; i < toAllocate.length; i++) {
            const size = toAllocate[i] as number;
            const block = this.allocate(size);
            if (block) {
                toAllocate[i] = block;
            } else {
                // Allocation failed at index i; entries [0..i-1] are blocks, [i..n-1] are still numbers.
                let totalRemaining = size;
                for (let j = i + 1; j < toAllocate.length; j++) {
                    totalRemaining += toAllocate[j] as number;
                }

                // Grow if the free space would be below the headroom threshold.
                const neededCapacity = this._usedSize + totalRemaining;
                const headroomCapacity = Math.ceil(neededCapacity * this._growMultiplier);
                if (headroomCapacity > this._capacity) {
                    this.grow(headroomCapacity);
                }

                // Full defrag: compact everything, then allocate the remainder (guaranteed to succeed).
                this.defrag(0);
                for (let j = i; j < toAllocate.length; j++) {
                    toAllocate[j] = this.allocate(toAllocate[j] as number)!;
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Computes the bucket index for a given block size (= floor(log2(size))).
     * @param size block size (must be \> 0)
     * @returns the bucket index
     */
    private _bucketFor(size: number): number {
        return 31 - Math.clz32(size);
    }

    private _addToBucket(block: GaussianSplattingMemBlock): void {
        const b = this._bucketFor(block._size);
        block._bucket = b;
        while (b >= this._freeBucketHeads.length) {
            this._freeBucketHeads.push(null);
        }
        block._prevFree = null;
        block._nextFree = this._freeBucketHeads[b];
        if (this._freeBucketHeads[b]) {
            this._freeBucketHeads[b]!._prevFree = block;
        }
        this._freeBucketHeads[b] = block;
        this._freeRegionCount++;
    }

    private _removeFromBucket(block: GaussianSplattingMemBlock): void {
        const b = block._bucket;
        if (block._prevFree) {
            block._prevFree._nextFree = block._nextFree;
        } else {
            this._freeBucketHeads[b] = block._nextFree;
        }
        if (block._nextFree) {
            block._nextFree._prevFree = block._prevFree;
        }
        block._prevFree = null;
        block._nextFree = null;
        block._bucket = -1;
        this._freeRegionCount--;
    }

    private _rebucket(block: GaussianSplattingMemBlock): void {
        const newBucket = this._bucketFor(block._size);
        if (newBucket !== block._bucket) {
            this._removeFromBucket(block);
            this._addToBucket(block);
        }
    }

    private _obtain(offset: number, size: number, free: boolean): GaussianSplattingMemBlock {
        const block = this._pool.length > 0 ? this._pool.pop()! : new GaussianSplattingMemBlock();
        block._offset = offset;
        block._size = size;
        block._free = free;
        block._prev = null;
        block._next = null;
        block._prevFree = null;
        block._nextFree = null;
        block._bucket = -1;
        return block;
    }

    private _release(block: GaussianSplattingMemBlock): void {
        block._prev = null;
        block._next = null;
        block._prevFree = null;
        block._nextFree = null;
        block._bucket = -1;
        this._pool.push(block);
    }

    private _insertAfterInMainList(block: GaussianSplattingMemBlock, after: Nullable<GaussianSplattingMemBlock>): void {
        if (after === null) {
            block._prev = null;
            block._next = this._headAll;
            if (this._headAll) {
                this._headAll._prev = block;
            }
            this._headAll = block;
            if (!this._tailAll) {
                this._tailAll = block;
            }
        } else {
            block._prev = after;
            block._next = after._next;
            if (after._next) {
                after._next._prev = block;
            }
            after._next = block;
            if (this._tailAll === after) {
                this._tailAll = block;
            }
        }
    }

    private _removeFromMainList(block: GaussianSplattingMemBlock): void {
        if (block._prev) {
            block._prev._next = block._next;
        } else {
            this._headAll = block._next;
        }
        if (block._next) {
            block._next._prev = block._prev;
        } else {
            this._tailAll = block._prev;
        }
        block._prev = null;
        block._next = null;
    }

    private _findFreeBlock(size: number): Nullable<GaussianSplattingMemBlock> {
        const startBucket = this._bucketFor(size);
        const len = this._freeBucketHeads.length;

        // Target bucket: best-fit (smallest block >= size).
        if (startBucket < len) {
            let best: Nullable<GaussianSplattingMemBlock> = null;
            let node = this._freeBucketHeads[startBucket];
            while (node) {
                if (node._size >= size) {
                    if (!best || node._size < best._size) {
                        best = node;
                        if (node._size === size) {
                            break;
                        }
                    }
                }
                node = node._nextFree;
            }
            if (best) {
                return best;
            }
        }

        // Higher buckets: first-fit (any block is large enough).
        for (let b = startBucket + 1; b < len; b++) {
            if (this._freeBucketHeads[b]) {
                return this._freeBucketHeads[b];
            }
        }
        return null;
    }

    private _defragFull(result: Set<GaussianSplattingMemBlock>): void {
        // Remove all free blocks from all buckets and pool them.
        for (let b = 0; b < this._freeBucketHeads.length; b++) {
            let node = this._freeBucketHeads[b];
            while (node) {
                const nextFree = node._nextFree;
                this._removeFromMainList(node);
                node._prevFree = null;
                node._nextFree = null;
                node._bucket = -1;
                this._pool.push(node);
                node = nextFree;
            }
            this._freeBucketHeads[b] = null;
        }
        this._freeRegionCount = 0;

        // Walk remaining (all allocated) blocks, assigning sequential offsets.
        let offset = 0;
        let block = this._headAll;
        while (block) {
            if (block._offset !== offset) {
                block._offset = offset;
                result.add(block);
            }
            offset += block._size;
            block = block._next;
        }

        // Create a single free block at the end if there is remaining capacity.
        const remaining = this._capacity - offset;
        if (remaining > 0) {
            const freeBlock = this._obtain(offset, remaining, true);
            this._insertAfterInMainList(freeBlock, this._tailAll);
            this._addToBucket(freeBlock);
        }
    }

    private _defragIncremental(maxMoves: number, result: Set<GaussianSplattingMemBlock>): void {
        const phase1Moves = Math.ceil(maxMoves / 2);
        const phase2Moves = maxMoves - phase1Moves;

        // Phase 1: relocate the last allocated block to the first fitting gap (maximizes tail free space).
        for (let i = 0; i < phase1Moves; i++) {
            let lastAlloc = this._tailAll;
            while (lastAlloc && lastAlloc._free) {
                lastAlloc = lastAlloc._prev;
            }
            if (!lastAlloc) {
                break;
            }

            const gap = this._findFreeBlock(lastAlloc._size);
            if (!gap || gap._offset >= lastAlloc._offset) {
                break;
            }

            this._moveBlock(lastAlloc, gap);
            result.add(lastAlloc);
        }

        // Phase 2: slide allocated blocks left into adjacent free gaps (cleans up interior fragmentation).
        let block = this._headAll;
        for (let i = 0; i < phase2Moves && block; ) {
            const next = block._next;

            if (block._free && next && !next._free) {
                const allocBlock = next;
                const freeBlock = block;

                allocBlock._offset = freeBlock._offset;
                freeBlock._offset = allocBlock._offset + allocBlock._size;

                // Swap in the main list.
                const a = freeBlock._prev;
                const b = allocBlock._next;

                allocBlock._prev = a;
                allocBlock._next = freeBlock;
                freeBlock._prev = allocBlock;
                freeBlock._next = b;
                if (a) {
                    a._next = allocBlock;
                } else {
                    this._headAll = allocBlock;
                }
                if (b) {
                    b._prev = freeBlock;
                } else {
                    this._tailAll = freeBlock;
                }

                // Merge the free block with its new right neighbor if also free.
                if (freeBlock._next && freeBlock._next._free) {
                    const right = freeBlock._next;
                    freeBlock._size += right._size;
                    this._removeFromMainList(right);
                    this._removeFromBucket(right);
                    this._release(right);
                    this._rebucket(freeBlock);
                }

                result.add(allocBlock);
                i++;

                // Continue from the block after freeBlock to find more opportunities.
                block = freeBlock._next;
            } else {
                block = next;
            }
        }
    }

    private _moveBlock(block: GaussianSplattingMemBlock, gap: GaussianSplattingMemBlock): void {
        const blockSize = block._size;
        const newOffset = gap._offset;

        // 1. Remove the block from its current position, freeing that space.
        const prev = block._prev;
        this._removeFromMainList(block);

        // Create a free region where the block was.
        const freed = this._obtain(block._offset, blockSize, true);
        this._insertAfterInMainList(freed, prev);
        this._addToBucket(freed);

        // Merge freed with its right neighbor.
        if (freed._next && freed._next._free) {
            const right = freed._next;
            freed._size += right._size;
            this._removeFromMainList(right);
            this._removeFromBucket(right);
            this._release(right);
            this._rebucket(freed);
        }
        // Merge freed with its left neighbor.
        if (freed._prev && freed._prev._free) {
            const left = freed._prev;
            left._size += freed._size;
            this._removeFromMainList(freed);
            this._removeFromBucket(freed);
            this._release(freed);
            this._rebucket(left);
        }

        // 2. Place the block at the gap.
        block._offset = newOffset;

        if (gap._size === blockSize) {
            // Perfect fit: replace the gap with the block.
            const gapPrev = gap._prev;
            this._removeFromMainList(gap);
            this._removeFromBucket(gap);
            this._release(gap);
            this._insertAfterInMainList(block, gapPrev);
        } else {
            // Partial fit: shrink the gap, insert the block before it.
            gap._offset += blockSize;
            gap._size -= blockSize;
            this._rebucket(gap);
            this._insertAfterInMainList(block, gap._prev);
        }
    }
}
