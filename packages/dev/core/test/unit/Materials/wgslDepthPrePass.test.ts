import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type ShaderSource = {
    name: string;
    source: string;
};

type Conditional = {
    depthPrePassBranch: "defined" | "undefined" | null;
    isElse: boolean;
};

const coreWgslShaderDirectory = fileURLToPath(new URL("../../../src/ShadersWGSL/", import.meta.url));
const materialsDirectory = fileURLToPath(new URL("../../../../materials/src/", import.meta.url));
const depthPrePassInclude = readFileSync(join(coreWgslShaderDirectory, "ShadersInclude/depthPrePass.fx"), "utf8");

function readShader(name: string, path: string): ShaderSource {
    return { name, source: readFileSync(path, "utf8") };
}

function findDepthPrePassMaterialFragments(): ShaderSource[] {
    const coreShaders = readdirSync(coreWgslShaderDirectory)
        .filter((fileName) => fileName.endsWith(".fragment.fx"))
        .map((fileName) => readShader(`core/${fileName}`, join(coreWgslShaderDirectory, fileName)));
    const materialShaders = readdirSync(materialsDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => {
            const wgslDirectory = join(materialsDirectory, entry.name, "wgsl");
            if (!existsSync(wgslDirectory)) {
                return [];
            }

            return readdirSync(wgslDirectory)
                .filter((fileName) => fileName.endsWith(".fragment.fx"))
                .map((fileName) => readShader(`materials/${entry.name}/${fileName}`, join(wgslDirectory, fileName)));
        });

    return [...coreShaders, ...materialShaders]
        .filter(({ source }) => source.includes("#include<depthPrePass>"))
        .sort(({ name: left }, { name: right }) => left.localeCompare(right));
}

function findUnguardedTailLines(source: string): string[] {
    const lines = source.split(/\r?\n/);
    const depthPrePassLine = lines.findIndex((line) => line.includes("#include<depthPrePass>"));
    const finalHookLine = lines.findIndex((line, index) => index > depthPrePassLine && line.includes("#define CUSTOM_FRAGMENT_MAIN_END"));
    const conditionals: Conditional[] = [];
    const unguardedLines: string[] = [];

    expect(depthPrePassLine).toBeGreaterThanOrEqual(0);
    expect(finalHookLine).toBeGreaterThan(depthPrePassLine);

    for (let index = 0; index <= finalHookLine; index++) {
        const line = lines[index];
        const trimmedLine = line.trim();

        if (/^#ifndef\s+DEPTHPREPASS\b/.test(trimmedLine)) {
            conditionals.push({ depthPrePassBranch: "undefined", isElse: false });
            continue;
        }
        if (/^#ifdef\s+DEPTHPREPASS\b/.test(trimmedLine)) {
            conditionals.push({ depthPrePassBranch: "defined", isElse: false });
            continue;
        }
        if (/^#if(n?def)?\b/.test(trimmedLine)) {
            conditionals.push({ depthPrePassBranch: null, isElse: false });
            continue;
        }
        if (/^#el(se|if)\b/.test(trimmedLine)) {
            const conditional = conditionals.at(-1);
            if (conditional) {
                conditional.isElse = true;
            }
            continue;
        }
        if (/^#endif\b/.test(trimmedLine)) {
            conditionals.pop();
            continue;
        }

        if (index <= depthPrePassLine || trimmedLine.length === 0 || trimmedLine.startsWith("//")) {
            continue;
        }

        const isExcludedFromDepthPrePass = conditionals.some(
            ({ depthPrePassBranch, isElse }) => (depthPrePassBranch === "undefined" && !isElse) || (depthPrePassBranch === "defined" && isElse)
        );
        if (!isExcludedFromDepthPrePass) {
            unguardedLines.push(`${index + 1}: ${trimmedLine}`);
        }
    }

    return unguardedLines;
}

describe("WGSL depth prepass material fragment tails", () => {
    const depthPrePassMaterialFragments = findDepthPrePassMaterialFragments();

    it("preserves the early return unless a consumer opts into a guarded tail", () => {
        expect(depthPrePassInclude).toMatch(/#ifndef\s+DEPTHPREPASS_SKIP_EARLY_RETURN\s+return fragmentOutputs;\s+#endif/);
    });

    it("tracks every material shader affected by the DEPTHPREPASS tail guard", () => {
        expect(depthPrePassMaterialFragments.map(({ name }) => name)).toEqual([
            "core/default.fragment.fx",
            "core/openpbr.fragment.fx",
            "core/pbr.fragment.fx",
            "materials/cell/cell.fragment.fx",
            "materials/fire/fire.fragment.fx",
            "materials/fur/fur.fragment.fx",
            "materials/gradient/gradient.fragment.fx",
            "materials/lava/lava.fragment.fx",
            "materials/mix/mix.fragment.fx",
            "materials/normal/normal.fragment.fx",
            "materials/simple/simple.fragment.fx",
            "materials/terrain/terrain.fragment.fx",
            "materials/triPlanar/triplanar.fragment.fx",
        ]);
    });

    it.each(depthPrePassMaterialFragments)("keeps every post-depth-prepass statement out of DEPTHPREPASS for $name", ({ source }) => {
        expect(findUnguardedTailLines(source)).toEqual([]);
    });

    it.each(depthPrePassMaterialFragments)("opts into the guarded tail before including depthPrePass for $name", ({ source }) => {
        const optInLine = source.indexOf("#define DEPTHPREPASS_SKIP_EARLY_RETURN");
        const depthPrePassLine = source.indexOf("#include<depthPrePass>");

        expect(optInLine).toBeGreaterThanOrEqual(0);
        expect(optInLine).toBeLessThan(depthPrePassLine);
    });
});
