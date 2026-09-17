import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const coreSourceDirectory = fileURLToPath(new URL("../../../src/", import.meta.url));

function readSource(relativePath: string): string {
    return readFileSync(join(coreSourceDirectory, relativePath), "utf8");
}

describe("Gaussian splatting geometry rendering shaders", () => {
    const shaderLanguages = [
        { name: "GLSL", directory: "Shaders/" },
        { name: "WGSL", directory: "ShadersWGSL/" },
    ];

    it.each(shaderLanguages)("$name emits geometry outputs after material plugin color injection", ({ directory }) => {
        const fragment = readSource(`${directory}gaussianSplatting.fragment.fx`);
        const pluginHook = fragment.indexOf("#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR");
        const geometryOutput = fragment.indexOf("#include<geometryRenderingFragment>");

        expect(fragment).toContain("#define PREPASS_CUSTOM_VARYINGS");
        expect(fragment).toContain("#include<prePassDeclaration>[SCENE_MRT_COUNT]");
        expect(pluginHook).toBeGreaterThanOrEqual(0);
        expect(geometryOutput).toBeGreaterThan(pluginHook);
    });

    it.each(shaderLanguages)("$name computes motion from the rendered splat plane and supports compound history", ({ directory }) => {
        const vertex = readSource(`${directory}gaussianSplatting.vertex.fx`);

        expect(vertex).toContain("geometryPlanePositionW");
        expect(vertex).toContain("geometryPlanePositionL");
        expect(vertex).toContain("previousPartWorld");
        expect(vertex).toContain("vGeometryPreviousPosition");
    });

    it("discards WGSL's transparent zero-footprint result before unblended MRT outputs", () => {
        const fragment = readSource("ShadersWGSL/gaussianSplatting.fragment.fx");

        expect(fragment).toMatch(/#ifdef PREPASS\s+if \(finalColor\.a <= 0\.0\) \{\s+discard;/);
    });
});
