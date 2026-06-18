import { describe, expect, it, vi } from "vitest";
import { GaussianSplattingResidencyController } from "loaders/SPLAT/gaussianSplattingResidencyController";

describe("GaussianSplattingResidencyController", () => {
    it("allocates resident blocks and reports offsets", () => {
        const ctl = new GaussianSplattingResidencyController(100, 50, () => {});
        const a = ctl.allocate(1, 10);
        const b = ctl.allocate(2, 20);

        expect(a).toBe(0);
        expect(b).toBe(10);
        expect(ctl.has(1)).toBe(true);
        expect(ctl.offset(2)).toBe(10);
        expect(ctl.residentCount).toBe(2);
    });

    it("returns the same offset when re-allocating an already-resident file", () => {
        const ctl = new GaussianSplattingResidencyController(100, 50, () => {});
        const first = ctl.allocate(7, 10);
        const second = ctl.allocate(7, 10);
        expect(second).toBe(first);
        expect(ctl.residentCount).toBe(1);
    });

    it("schedules eviction and evicts after the cooldown elapses", () => {
        const onEvict = vi.fn();
        const ctl = new GaussianSplattingResidencyController(100, 3, onEvict);
        ctl.allocate(1, 10);
        ctl.scheduleEviction(1);

        // 3-frame cooldown: ticks 1 and 2 keep it, tick 3 evicts.
        expect(ctl.tick()).toEqual([]);
        expect(ctl.tick()).toEqual([]);
        expect(ctl.has(1)).toBe(true);
        expect(ctl.tick()).toEqual([1]);

        expect(ctl.has(1)).toBe(false);
        expect(onEvict).toHaveBeenCalledWith(1);
        expect(ctl.residentCount).toBe(0);
    });

    it("cancels a scheduled eviction when the file is referenced again", () => {
        const onEvict = vi.fn();
        const ctl = new GaussianSplattingResidencyController(100, 2, onEvict);
        ctl.allocate(1, 10);
        ctl.scheduleEviction(1);
        ctl.tick();
        ctl.cancelEviction(1);

        ctl.tick();
        ctl.tick();
        expect(ctl.has(1)).toBe(true);
        expect(onEvict).not.toHaveBeenCalled();
    });

    it("never evicts pinned files", () => {
        const onEvict = vi.fn();
        const ctl = new GaussianSplattingResidencyController(100, 1, onEvict);
        ctl.pin(-1, 10); // environment
        ctl.scheduleEviction(-1); // no-op for pinned
        ctl.tick();
        ctl.tick();
        expect(ctl.has(-1)).toBe(true);
        expect(onEvict).not.toHaveBeenCalled();
    });

    it("evicts cooled files to fit a new allocation (evict-to-fit)", () => {
        const onEvict = vi.fn();
        const ctl = new GaussianSplattingResidencyController(30, 100, onEvict);
        ctl.allocate(1, 10);
        ctl.allocate(2, 10);
        ctl.allocate(3, 10); // buffer full

        // A fourth file does not fit while all are referenced.
        expect(ctl.allocate(4, 10)).toBeNull();

        // Files 1 and 2 become unreferenced -> scheduled. They are still resident (cooldown not elapsed)...
        ctl.scheduleEviction(1);
        ctl.scheduleEviction(2);
        // ...but a new allocation reclaims them immediately to make room.
        const offset = ctl.allocate(4, 15);
        expect(offset).not.toBeNull();
        expect(ctl.has(4)).toBe(true);
        expect(ctl.has(1)).toBe(false);
        expect(ctl.has(2)).toBe(false);
        expect(onEvict).toHaveBeenCalledWith(1);
        expect(onEvict).toHaveBeenCalledWith(2);
        // The still-referenced file 3 survived.
        expect(ctl.has(3)).toBe(true);
    });

    it("refuses an allocation that cannot fit even after evicting all cooled files", () => {
        const ctl = new GaussianSplattingResidencyController(30, 100, () => {});
        ctl.allocate(1, 10);
        ctl.allocate(2, 10);
        ctl.allocate(3, 10);
        ctl.scheduleEviction(1); // only one 10-wide file is reclaimable

        // Needs 25 but at most 10 (file 1) + 10 (tail, after evicting 1) can be made contiguous here.
        expect(ctl.allocate(4, 25)).toBeNull();
    });

    it("free releases a block immediately without firing onEvict", () => {
        const onEvict = vi.fn();
        const ctl = new GaussianSplattingResidencyController(100, 50, onEvict);
        ctl.allocate(1, 40);
        ctl.free(1);
        expect(ctl.has(1)).toBe(false);
        expect(onEvict).not.toHaveBeenCalled();

        // The freed space is reusable.
        const reused = ctl.allocate(2, 40);
        expect(reused).toBe(0);
    });

    it("free is a no-op for pinned files", () => {
        const ctl = new GaussianSplattingResidencyController(100, 50, () => {});
        ctl.pin(-1, 10);
        ctl.free(-1);
        expect(ctl.has(-1)).toBe(true);
    });

    it("returns null from pin when it cannot fit, and does not mark the file pinned", () => {
        const ctl = new GaussianSplattingResidencyController(10, 50, () => {});
        expect(ctl.pin(-1, 20)).toBeNull();
        expect(ctl.has(-1)).toBe(false);
    });

    it("compacts fragmented free space so a previously-failing allocation fits", () => {
        const ctl = new GaussianSplattingResidencyController(50, 100, () => {});
        ctl.allocate(1, 10);
        ctl.allocate(2, 10);
        ctl.allocate(3, 10);
        ctl.allocate(4, 10);
        ctl.allocate(5, 10); // full
        // Free two non-adjacent files -> two isolated 10-wide holes (fragmented), total free 20.
        ctl.free(2);
        ctl.free(4);
        expect(ctl.freeSize).toBe(20);

        // A contiguous 20 does not fit while fragmented.
        expect(ctl.allocate(6, 20)).toBeNull();

        const moves = ctl.compact();
        // Survivors 1,3,5 pack to the front; at least the ones that shifted are reported.
        expect(moves.length).toBeGreaterThan(0);
        for (const m of moves) {
            expect(m.newOffset).toBeLessThan(m.oldOffset);
            expect(m.count).toBe(10);
        }
        // After compaction the 20-wide block fits.
        const offset = ctl.allocate(6, 20);
        expect(offset).not.toBeNull();
        expect(ctl.offset(6)).toBe(offset!);
    });

    it("compact reports no moves when free space is already contiguous", () => {
        const ctl = new GaussianSplattingResidencyController(50, 100, () => {});
        ctl.allocate(1, 10);
        ctl.allocate(2, 10);
        // Free the last file: the freed space is already contiguous with the tail, nothing to move.
        ctl.free(2);
        expect(ctl.compact()).toEqual([]);
        expect(ctl.offset(1)).toBe(0);
    });
});
