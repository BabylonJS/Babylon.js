import { type IGaussianSplattingStreamSourceRange } from "./gaussianSplattingStream";

/**
 * A LOD entry referencing an interval of a source file. Structurally an ISOGLODEntry.
 * @internal
 */
export interface ISplatResidencyEntry {
    /** Index of the source file. */
    file: number;
    /** First splat of the interval inside the source file. */
    offset: number;
    /** Number of splats in the interval. */
    count: number;
}

/**
 * One resident allocation unit carved from a source file.
 * @internal
 */
export interface ISplatResidencyPage {
    /** Allocation ID, never lower than the number of source files. */
    id: number;
    /** Merged source interval covered by the page. */
    source: Readonly<IGaussianSplattingStreamSourceRange>;
    /** LOD entries (by reference) that fall inside the source interval. */
    entries: ISplatResidencyEntry[];
}

/**
 * Result of {@link BuildSplatResidencyPages}.
 * @internal
 */
export interface ISplatResidencyPagesResult {
    /** Pages to publish. */
    pages: ISplatResidencyPage[];
    /** Source files left whole because at least one of their entries was invalid. */
    invalidFiles: number[];
}

/**
 * Groups overlapping intervals, but not adjacent ones, into independently resident pages.
 * Does not mutate entries; callers publish the mapping once the pages are returned.
 * Pinned source files remain whole so the permanent fallback cannot be partially evicted.
 * A source file with no known size, or with at least one invalid interval, produces no pages and stays whole.
 * @param entries LOD entries referenced by leaves
 * @param counts splat count of every source file whose metadata is available
 * @param pinned source files that must stay whole
 * @param sourceFileCount number of source files; valid source IDs are in [0, sourceFileCount)
 * @param firstId first unused allocation ID, at least sourceFileCount
 * @returns the pages plus the source files left whole because of invalid intervals
 * @internal
 */
export function BuildSplatResidencyPages(
    entries: readonly ISplatResidencyEntry[],
    counts: ReadonlyMap<number, number>,
    pinned: ReadonlySet<number>,
    sourceFileCount: number,
    firstId: number
): ISplatResidencyPagesResult {
    if (!Number.isSafeInteger(sourceFileCount) || sourceFileCount < 0 || !Number.isSafeInteger(firstId) || firstId < sourceFileCount) {
        throw new RangeError("Invalid residency page ID range.");
    }
    const byFile = new Map<number, ISplatResidencyEntry[]>();
    const invalid = new Set<number>();
    const invalidFiles: number[] = [];
    const seen = new Set<ISplatResidencyEntry>();
    for (const entry of entries) {
        if (seen.has(entry)) {
            continue;
        }
        seen.add(entry);
        const file = entry.file;
        if (!Number.isSafeInteger(file) || file < 0 || file >= sourceFileCount) {
            if (!invalid.has(file)) {
                invalid.add(file);
                invalidFiles.push(file);
            }
            continue;
        }
        if (pinned.has(file)) {
            continue;
        }
        const size = counts.get(file);
        if (size === undefined) {
            continue;
        }
        if (
            !Number.isSafeInteger(size) ||
            size < 0 ||
            !Number.isSafeInteger(entry.offset) ||
            entry.offset < 0 ||
            !Number.isSafeInteger(entry.count) ||
            entry.count < 0 ||
            entry.offset + entry.count > size
        ) {
            if (!invalid.has(file)) {
                invalid.add(file);
                invalidFiles.push(file);
            }
            continue;
        }
        if (entry.count === 0) {
            continue;
        }
        let ranges = byFile.get(file);
        if (!ranges) {
            ranges = [];
            byFile.set(file, ranges);
        }
        ranges.push(entry);
    }

    const pages: ISplatResidencyPage[] = [];
    for (const [file, ranges] of byFile) {
        if (invalid.has(file)) {
            continue;
        }
        ranges.sort((a, b) => a.offset - b.offset || a.count - b.count);
        let page: ISplatResidencyPage | undefined;
        for (const entry of ranges) {
            if (page && entry.offset < page.source.offset + page.source.count) {
                page.source = {
                    file,
                    offset: page.source.offset,
                    count: Math.max(page.source.offset + page.source.count, entry.offset + entry.count) - page.source.offset,
                };
                page.entries.push(entry);
            } else {
                const id = firstId + pages.length;
                if (!Number.isSafeInteger(id)) {
                    throw new RangeError("Residency page ID overflow.");
                }
                page = { id, source: { file, offset: entry.offset, count: entry.count }, entries: [entry] };
                pages.push(page);
            }
        }
    }
    return { pages, invalidFiles };
}
