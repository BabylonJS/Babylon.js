import { describe, expect, it } from "vitest";
import { SmartFilter } from "@babylonjs/smart-filters-lite";
import { GetSmartFilterEditorOptions, IsCompatibleSmartFilter } from "../../src/smartFilterCompatibility.js";

type LiteEngineContext = Parameters<SmartFilter["createRuntimeAsync"]>[0];

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

    it("passes a Lite engine context through without requiring ThinEngine capabilities", () => {
        const filter = new SmartFilter("Lite filter");
        const engineContext = {
            canvas: {} as LiteEngineContext["canvas"],
            gl: {} as LiteEngineContext["gl"],
            caps: {
                maxTextureSize: 4096,
                maxTextureUnits: 16,
                parallelShaderCompile: null,
                textureFloatRender: true,
                textureFloatLinearFiltering: true,
                textureHalfFloatRender: true,
                textureHalfFloatLinearFiltering: true,
                needPOTTextures: false,
            },
        } satisfies LiteEngineContext;

        const options = GetSmartFilterEditorOptions({ currentSmartFilter: filter, thinEngine: engineContext });

        expect(options?.filter).toBe(filter);
        expect(options?.engine).toBe(engineContext);
    });

    it("rejects unrelated page globals", () => {
        expect(GetSmartFilterEditorOptions({ currentSmartFilter: { name: "Not a filter" } })).toBeNull();
    });
});
