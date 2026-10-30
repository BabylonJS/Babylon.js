import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { PreProcess } from "core/Engines/Processors/shaderProcessor";

/**
 * The shader preprocessor reads `#if X` as `#if defined(X)`, so `#if !X` is `#if !defined(X)`: it used to test a define named "!X",
 * which never exists, and the branch was always dropped.
 */
describe("ShaderProcessor: #if !X", () => {
    let engine: NullEngine;

    // the code that remains once the conditions are evaluated with these defines
    function processed(code: string, defines: string[]): string {
        let result = "";
        const options = {
            defines: defines.map((define) => "#define " + define),
            indexParameters: {},
            isFragment: true,
            shouldUseHighPrecisionShader: false,
            supportsUniformBuffers: true,
            shadersRepository: "",
            includesShadersStore: {},
            processor: null,
            version: "",
            platformName: "",
            processingContext: null,
            isNDCHalfZRange: false,
            useReverseDepthBuffer: false,
        };
        PreProcess(code, options as any, (migrated) => (result = migrated), engine);
        return result;
    }

    // the branches kept, by their marker
    function kept(code: string, defines: string[]): string[] {
        return processed(code, defines).match(/\bkeep_\w+/g) ?? [];
    }

    beforeEach(() => {
        engine = new NullEngine();
    });

    afterEach(() => {
        engine.dispose();
    });

    it("keeps the branch of #if !X when X is not defined, and the other one when it is", () => {
        const code = "#if !X\nkeep_notX\n#else\nkeep_X\n#endif\n";
        expect(kept(code, [])).toEqual(["keep_notX"]);
        expect(kept(code, ["X"])).toEqual(["keep_X"]);
    });

    it("reads #if !X as #if !defined(X) in && and || too", () => {
        const code = "#if !X && Y\nkeep_and\n#endif\n#if !X || Y\nkeep_or\n#endif\n";
        expect(kept(code, ["Y"])).toEqual(["keep_and", "keep_or"]);
        expect(kept(code, ["X", "Y"])).toEqual(["keep_or"]);
        expect(kept(code, ["X"])).toEqual([]);
        expect(kept(code, [])).toEqual(["keep_or"]);
    });

    it("leaves #if X, #if !defined(X) and the comparisons as they were", () => {
        const code = "#if X\nkeep_X\n#endif\n#if !defined(X)\nkeep_notDefined\n#endif\n#if X == 2\nkeep_two\n#endif\n#if X != 2\nkeep_notTwo\n#endif\n";
        expect(kept(code, ["X 2"])).toEqual(["keep_X", "keep_two"]);
        expect(kept(code, ["X 3"])).toEqual(["keep_X", "keep_notTwo"]);
        expect(kept(code, [])).toContain("keep_notDefined");
    });
});
