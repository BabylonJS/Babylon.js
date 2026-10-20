import { describe, expect, it } from "vitest";
import { SmartFilter } from "@babylonjs/smart-filters-lite";
import { GetSmartFilterEditorOptions, IsCompatibleSmartFilter } from "../../src/smartFilterCompatibility.js";

class ForeignBundleSmartFilter {
    public readonly name = "Foreign filter";
    public readonly attachedBlocks: unknown[] = [];
    public readonly output = {};
    public readonly outputBlock = {};

    public getClassName(): string {
        return "SmartFilter";
    }
}

describe("Smart Filter debugger compatibility", () => {
    it("accepts an actual Lite SmartFilter", () => {
        expect(IsCompatibleSmartFilter(new SmartFilter("Lite filter"))).toBe(true);
    });

    it("accepts a structurally compatible filter from another bundle", () => {
        expect(IsCompatibleSmartFilter(new ForeignBundleSmartFilter())).toBe(true);
    });

    it("omits a Lite engine context from ThinEngine-only editor consumers", () => {
        const filter = new SmartFilter("Lite filter");
        const engineContext = {
            canvas: {},
            gl: {},
            caps: {},
        };

        const options = GetSmartFilterEditorOptions({ currentSmartFilter: filter, thinEngine: engineContext });

        expect(options?.filter).toBe(filter);
        expect(options?.engine).toBeUndefined();
    });

    it("preserves a host engine with the ThinEngine resize capability", () => {
        const filter = new ForeignBundleSmartFilter();
        const engine = {
            resize: () => {},
        };

        const options = GetSmartFilterEditorOptions({ currentSmartFilter: filter, thinEngine: engine });

        expect(options?.engine).toBe(engine);
    });

    it("rejects unrelated page globals", () => {
        expect(GetSmartFilterEditorOptions({ currentSmartFilter: { name: "Not a filter" } })).toBeNull();
    });
});
