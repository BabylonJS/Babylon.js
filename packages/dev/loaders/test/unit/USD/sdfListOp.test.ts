import { describe, expect, it } from "vitest";

import { ReadListOpItems, type ISdfListOp } from "loaders/USD/resolution/sdf/sdfListOp";

/**
 * ReadListOpItems is the single canonical reader that flattens one authored list op into its
 * addition-side items with no weaker base beneath it. Its semantics mirror the composition-time
 * authority ApplyListOp (composeLayerStack) applied over an empty base with an identity key:
 * an explicit opinion replaces everything; otherwise items compose in prepended, then appended, then
 * added order. Every standalone list-op read in the loader must go through this reader so the rule
 * cannot diverge across call sites again.
 */
describe("ReadListOpItems", () => {
    it("returns an empty array for an undefined list op", () => {
        expect(ReadListOpItems<string>(undefined)).toEqual([]);
    });

    it("returns an empty array for an empty non-explicit list op", () => {
        expect(ReadListOpItems<string>({ isExplicit: false })).toEqual([]);
    });

    it("returns the explicit items and ignores addition-side fields when explicit", () => {
        const listOp: ISdfListOp<string> = {
            isExplicit: true,
            explicit: ["/A", "/B"],
            prepended: ["/ignored"],
            appended: ["/ignored"],
            added: ["/ignored"],
        };
        expect(ReadListOpItems(listOp)).toEqual(["/A", "/B"]);
    });

    it("returns an empty array for an explicit op with no explicit items", () => {
        expect(ReadListOpItems<string>({ isExplicit: true })).toEqual([]);
    });

    it("composes non-explicit items in prepended, appended, added order", () => {
        const listOp: ISdfListOp<string> = {
            isExplicit: false,
            prepended: ["/pre"],
            appended: ["/app"],
            added: ["/add"],
        };
        expect(ReadListOpItems(listOp)).toEqual(["/pre", "/app", "/add"]);
    });

    it("reads whichever addition-side fields are present", () => {
        expect(ReadListOpItems<string>({ isExplicit: false, appended: ["/only"] })).toEqual(["/only"]);
        expect(ReadListOpItems<string>({ isExplicit: false, prepended: ["/p"], added: ["/a"] })).toEqual(["/p", "/a"]);
    });

    it("preserves object item identity for reference-shaped items", () => {
        const first = { assetPath: "./a.usda" };
        const second = { assetPath: "./b.usda" };
        const listOp: ISdfListOp<{ assetPath: string }> = { isExplicit: false, prepended: [first], appended: [second] };
        const items = ReadListOpItems(listOp);
        expect(items).toEqual([first, second]);
        expect(items[0]).toBe(first);
    });
});
