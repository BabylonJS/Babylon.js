import { BuildSplatResidencyPages } from "loaders/SPLAT/gaussianSplattingResidencyPages";
import { describe, expect, it } from "vitest";

const Entry = (file: number, offset: number, count: number) => ({ file, offset, count });
const Counts = (sizes: Record<number, number>) => new Map<number, number>(Object.entries(sizes).map(([file, size]) => [Number(file), size]));

describe("BuildSplatResidencyPages", () => {
    it("creates one page per disjoint interval with sequential IDs", () => {
        const entries = [Entry(0, 0, 10), Entry(0, 20, 5), Entry(0, 40, 10)];

        const { pages, invalidFiles } = BuildSplatResidencyPages(entries, Counts({ 0: 100 }), new Set(), 3, 7);

        expect(invalidFiles).toEqual([]);
        expect(pages.map((page) => page.id)).toEqual([7, 8, 9]);
        expect(pages.map((page) => page.source)).toEqual([Entry(0, 0, 10), Entry(0, 20, 5), Entry(0, 40, 10)]);
        expect(pages.map((page) => page.entries)).toEqual([[entries[0]], [entries[1]], [entries[2]]]);
    });

    it("merges overlapping intervals into their union", () => {
        const a = Entry(0, 0, 10);
        const b = Entry(0, 5, 10);

        const { pages } = BuildSplatResidencyPages([a, b], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages).toHaveLength(1);
        expect(pages[0].source).toEqual(Entry(0, 0, 15));
        expect(pages[0].entries).toEqual([a, b]);
    });

    it("merges an interval fully contained in another", () => {
        const { pages } = BuildSplatResidencyPages([Entry(0, 0, 50), Entry(0, 10, 5)], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages).toHaveLength(1);
        expect(pages[0].source).toEqual(Entry(0, 0, 50));
    });

    it("does not merge adjacent intervals", () => {
        const { pages } = BuildSplatResidencyPages([Entry(0, 0, 10), Entry(0, 10, 10)], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages.map((page) => page.source)).toEqual([Entry(0, 0, 10), Entry(0, 10, 10)]);
    });

    it("merges identical intervals held by different entry objects", () => {
        const { pages } = BuildSplatResidencyPages([Entry(0, 4, 8), Entry(0, 4, 8)], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages).toHaveLength(1);
        expect(pages[0].entries).toHaveLength(2);
        expect(pages[0].source).toEqual(Entry(0, 4, 8));
    });

    it("deduplicates the same entry object listed twice", () => {
        const entry = Entry(0, 4, 8);

        const { pages } = BuildSplatResidencyPages([entry, entry], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages).toHaveLength(1);
        expect(pages[0].entries).toEqual([entry]);
    });

    it("produces sorted, deterministic pages from unsorted input", () => {
        const { pages } = BuildSplatResidencyPages([Entry(0, 40, 10), Entry(0, 0, 10), Entry(0, 20, 5)], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages.map((page) => page.source.offset)).toEqual([0, 20, 40]);
        expect(pages.map((page) => page.id)).toEqual([1, 2, 3]);
    });

    it("keeps pinned files whole", () => {
        const { pages, invalidFiles } = BuildSplatResidencyPages([Entry(0, 0, 10), Entry(1, 0, 10)], Counts({ 0: 100, 1: 100 }), new Set([0]), 2, 2);

        expect(invalidFiles).toEqual([]);
        expect(pages.map((page) => page.source.file)).toEqual([1]);
    });

    it("skips empty intervals", () => {
        const { pages } = BuildSplatResidencyPages([Entry(0, 10, 0)], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(pages).toEqual([]);
    });

    it("skips a file without a known size without reporting it as invalid", () => {
        const { pages, invalidFiles } = BuildSplatResidencyPages([Entry(0, 0, 10), Entry(1, 0, 10)], Counts({ 1: 100 }), new Set(), 2, 2);

        expect(invalidFiles).toEqual([]);
        expect(pages.map((page) => page.source.file)).toEqual([1]);
    });

    it.each([
        ["negative offset", Entry(0, -1, 5)],
        ["interval past the end of the file", Entry(0, 95, 10)],
        ["fractional offset", Entry(0, 1.5, 5)],
        ["string offset", { file: 0, offset: "5" as unknown as number, count: 5 }],
        ["negative count", Entry(0, 5, -1)],
    ])("leaves the whole file unpaged on %s", (_name, bad) => {
        const good = Entry(0, 0, 10);
        const other = Entry(1, 0, 10);

        const { pages, invalidFiles } = BuildSplatResidencyPages([good, bad, other], Counts({ 0: 100, 1: 100 }), new Set(), 2, 2);

        expect(invalidFiles).toEqual([0]);
        expect(pages.map((page) => page.source.file)).toEqual([1]);
        expect(pages.flatMap((page) => page.entries)).not.toContain(good);
    });

    it("reports an invalid file once", () => {
        const { invalidFiles } = BuildSplatResidencyPages([Entry(0, -1, 5), Entry(0, -2, 5)], Counts({ 0: 100 }), new Set(), 1, 1);

        expect(invalidFiles).toEqual([0]);
    });

    it.each([99, -1, 1.5])("reports a source file index %s outside the file range as invalid", (file) => {
        const { pages, invalidFiles } = BuildSplatResidencyPages([Entry(file, 0, 5)], Counts({ [file]: 100 }), new Set(), 2, 2);

        expect(pages).toEqual([]);
        expect(invalidFiles).toEqual([file]);
    });

    it("throws on programmer errors", () => {
        expect(() => BuildSplatResidencyPages([], new Map(), new Set(), 5, 4)).toThrow(RangeError);
        expect(() => BuildSplatResidencyPages([], new Map(), new Set(), 5, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
        expect(() => BuildSplatResidencyPages([], new Map(), new Set(), 1.5, 2)).toThrow(RangeError);
    });

    it("does not mutate its inputs", () => {
        const entries = [Entry(0, 0, 10), Entry(0, 5, 10), Entry(1, 3, 4)];
        const snapshot = JSON.parse(JSON.stringify(entries));

        BuildSplatResidencyPages(entries, Counts({ 0: 100, 1: 100 }), new Set(), 2, 2);

        expect(entries).toEqual(snapshot);
    });

    it("handles several files independently", () => {
        const { pages } = BuildSplatResidencyPages([Entry(1, 0, 10), Entry(0, 0, 10), Entry(1, 5, 10), Entry(0, 50, 10)], Counts({ 0: 100, 1: 100 }), new Set(), 2, 2);

        expect(pages.map((page) => page.source)).toEqual([Entry(1, 0, 15), Entry(0, 0, 10), Entry(0, 50, 10)]);
        expect(new Set(pages.map((page) => page.id)).size).toBe(3);
    });
});
