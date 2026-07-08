import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const wgslShaderDirectory = fileURLToPath(new URL("../../../src/ShadersWGSL/", import.meta.url));

function readShader(fileName: string): string {
    return readFileSync(join(wgslShaderDirectory, fileName), "utf8");
}

describe("WGSL depth prepass material fragment tails", () => {
    const depthPrePassMaterialFragments = readdirSync(wgslShaderDirectory)
        .filter((fileName) => fileName.endsWith(".fragment.fx"))
        .filter((fileName) => readShader(fileName).includes("#include<depthPrePass>"))
        .sort();

    it("tracks every material shader affected by the DEPTHPREPASS tail guard", () => {
        expect(depthPrePassMaterialFragments).toEqual(["default.fragment.fx", "openpbr.fragment.fx", "pbr.fragment.fx"]);
    });

    it.each(depthPrePassMaterialFragments)("keeps the post-depth-prepass material tail out of DEPTHPREPASS for %s", (fileName) => {
        const source = readShader(fileName);
        const depthPrePassIndex = source.indexOf("#include<depthPrePass>");
        const guardStart = source.indexOf("#ifndef DEPTHPREPASS", depthPrePassIndex);
        const finalHook = source.indexOf("#define CUSTOM_FRAGMENT_MAIN_END", guardStart);

        expect(depthPrePassIndex).toBeGreaterThanOrEqual(0);
        expect(guardStart).toBeGreaterThan(depthPrePassIndex);
        expect(finalHook).toBeGreaterThan(guardStart);
        expect(source.slice(depthPrePassIndex, guardStart)).not.toContain("CUSTOM_FRAGMENT_MAIN_END");
        expect(source.slice(finalHook)).toMatch(/#define CUSTOM_FRAGMENT_MAIN_END\s*#endif\s*}\s*$/);
    });
});
