import { describe, expect, it } from "vitest";
import * as fs from "fs";
import { fileURLToPath } from "url";

import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";
import { type IResolvedStage, type IResolvedPrim, type ResolvedPrimKind } from "loaders/USD/resolution/resolvedStage";
import { ParseUsdaWithDiagnostics } from "loaders/USD/resolution/parser/usda/usdaParser";

// A deliberately small, pinned slice of authoritative AOUSD / USD Working Group assets (see
// ./corpus/PROVENANCE.md) exercised end to end through the USD resolution layer. It proves the
// USDA-only product promise on real-world text: in-profile assets resolve to the expected
// resolved-stage data, and intentionally out-of-profile assets are diagnosed rather than silently
// producing a plausible-but-wrong scene. The harness is offline and bounded: every fixture is read
// from disk and the external-layer fetcher denies all requests, so no network access occurs.

const corpusRoot = new URL("./corpus/", import.meta.url);

function readCorpus(relativePath: string): string {
    return fs.readFileSync(fileURLToPath(new URL(relativePath, corpusRoot)), "utf8");
}

// Denies every external-layer fetch so resolution stays offline and deterministic. In-profile
// fixtures are single flat layers and never call it; out-of-profile external references hit it and
// must surface a diagnostic instead of silently succeeding.
const denyExternalFetch = async (identifier: string): Promise<never> => {
    throw new Error(`external fetch denied: ${identifier}`);
};

async function resolveCorpusAsync(relativePath: string): Promise<IResolvedStage> {
    const fileName = relativePath.split("/").pop();
    return await ResolveUsdStageWithFetcherAsync(readCorpus(relativePath), "", fileName, {}, denyExternalFetch);
}

function collectPrims(stage: IResolvedStage): IResolvedPrim[] {
    const out: IResolvedPrim[] = [];
    const walk = (prim: IResolvedPrim) => {
        out.push(prim);
        prim.children.forEach(walk);
    };
    stage.root.children.forEach(walk);
    return out;
}

function firstPrimOfKind(stage: IResolvedStage, kind: ResolvedPrimKind): IResolvedPrim | undefined {
    return collectPrims(stage).find((prim) => prim.kind === kind);
}

function errorDiagnostics(stage: IResolvedStage) {
    return stage.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
}

describe("USD corpus smoke - in-profile", () => {
    it("parses representative polygon geometry (triangulated cube) into a pooled mesh", async () => {
        const stage = await resolveCorpusAsync("geometry/triangles.usda");
        expect(errorDiagnostics(stage)).toHaveLength(0);
        expect(stage.meshes).toHaveLength(1);
        const mesh = stage.meshes[0];
        expect(mesh.positions.length).toBe(24); // 8 points x 3
        expect(mesh.indices.length).toBe(36); // 12 triangles x 3
        expect(mesh.indices.length % 3).toBe(0);
    });

    it("triangulates mixed quad/triangle face-vertex counts", async () => {
        const stage = await resolveCorpusAsync("geometry/mixed.usda");
        expect(errorDiagnostics(stage)).toHaveLength(0);
        expect(stage.meshes).toHaveLength(1);
        const mesh = stage.meshes[0];
        expect(mesh.positions.length).toBe(24);
        // One quad (-> 2 tris) + ten triangles (-> 10 tris) = 12 tris = 36 indices.
        expect(mesh.indices.length).toBe(36);
    });

    it("honors subdivisionScheme = none with no subdivision diagnostic", async () => {
        const stage = await resolveCorpusAsync("geometry/subdiv_none.usda");
        expect(stage.meshes).toHaveLength(1);
        expect(stage.meshes[0].subdivisionScheme).toBe("none");
        expect(stage.diagnostics).toHaveLength(0);
    });

    it("accumulates a translate/rotate/scale xformOp stack onto the prim transform", async () => {
        const stage = await resolveCorpusAsync("transforms/simple_transform.usda");
        expect(errorDiagnostics(stage)).toHaveLength(0);
        const mesh = firstPrimOfKind(stage, "mesh");
        expect(mesh).toBeDefined();
        expect(mesh!.transform.translation[0]).toBeCloseTo(4);
        expect(mesh!.transform.translation[1]).toBeCloseTo(5);
        expect(mesh!.transform.translation[2]).toBeCloseTo(6);
        expect(mesh!.transform.scale[0]).toBeCloseTo(1);
        expect(mesh!.transform.scale[1]).toBeCloseTo(2);
        expect(mesh!.transform.scale[2]).toBeCloseTo(3);
    });

    it("resolves a matrix4d xformOp to the same translation as its TRS twin", async () => {
        const stage = await resolveCorpusAsync("transforms/matrix_transform.usda");
        expect(errorDiagnostics(stage)).toHaveLength(0);
        const mesh = firstPrimOfKind(stage, "mesh");
        expect(mesh).toBeDefined();
        const translation = mesh!.transform.matrix ? [mesh!.transform.matrix[12], mesh!.transform.matrix[13], mesh!.transform.matrix[14]] : mesh!.transform.translation;
        expect(translation[0]).toBeCloseTo(4);
        expect(translation[1]).toBeCloseTo(5);
        expect(translation[2]).toBeCloseTo(6);
    });

    it("reduces a UsdPreviewSurface network to materials with a resolved UsdUVTexture sidecar", async () => {
        const stage = await resolveCorpusAsync("materials/TextureCoordinateTest.usda");
        expect(errorDiagnostics(stage)).toHaveLength(0);
        expect(stage.materials.length).toBeGreaterThan(0);
        const textured = stage.materials.find((material) => material.textures.baseColor?.uri.includes("TextureCoordinateTemplate.png"));
        expect(textured).toBeDefined();
    });

    it("resolves a whole scene: hierarchy, animated mesh, and camera from one layer", async () => {
        const stage = await resolveCorpusAsync("scenes/animated_cube_translation.usda");
        expect(errorDiagnostics(stage)).toHaveLength(0);
        expect(stage.meshes).toHaveLength(1);
        expect(firstPrimOfKind(stage, "camera")).toBeDefined();
        const animated = collectPrims(stage).find((prim) => prim.animation !== undefined);
        expect(animated).toBeDefined();
    });

    it("loads an in-profile fixture end to end through the public loader on a NullEngine", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const loader = new USDFileLoader();
            const result = await loader.importMeshAsync(null, scene, readCorpus("geometry/subdiv_none.usda"), "");
            expect(result.meshes.length).toBeGreaterThan(0);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("USD corpus smoke - out-of-profile", () => {
    it("diagnoses a subdivision surface as an approximation instead of shipping it silently", async () => {
        const stage = await resolveCorpusAsync("out-of-scope/subdiv_catmullClark.usda");
        const subdivision = stage.diagnostics.find((diagnostic) => /subdivision|catmullClark/i.test(diagnostic.message));
        expect(subdivision).toBeDefined();
    });

    it("surfaces an unresolved external (MaterialX) reference as diagnostics, not a silent success", async () => {
        const stage = await resolveCorpusAsync("out-of-scope/materialx_basic.usda");
        const warnings = stage.diagnostics.filter((diagnostic) => diagnostic.severity === "warning");
        expect(warnings.length).toBeGreaterThan(0);
        expect(stage.diagnostics.some((diagnostic) => /reference|external|mtlx|MaterialX/i.test(diagnostic.message))).toBe(true);
    });

    it("does not crash on an out-of-profile implicit gprim", async () => {
        // Current (pre-subtraction) behavior: an implicit UsdGeomSphere is still tessellated into a
        // mesh. The harness only guarantees no crash here; explicit rejection is enforced by the
        // loader-subtraction work (parent PRD #55, subtraction issue #56) and asserted below.
        const stage = await resolveCorpusAsync("out-of-scope/implicit_sphere.usda");
        expect(stage).toBeDefined();
    });

    // Tracks the target profile: an implicit gprim must be rejected/skipped with a diagnostic rather
    // than silently mapped to a mesh. Enforced by the loader subtraction (parent PRD #55, issue #56),
    // which removes implicit-gprim support; promote this to a real assertion once that lands.
    it.todo("rejects an out-of-profile implicit gprim with a diagnostic once subtraction (#56) removes implicit-gprim support");
});

describe("USD corpus smoke - format policy", () => {
    it("accepts AOUSD's cosmetic USDA 1.0 patch header without parser diagnostics", () => {
        const result = ParseUsdaWithDiagnostics(readCorpus("parser/simple.usda"), "parser/simple.usda");

        expect(result.diagnostics).toEqual([]);
        expect(result.layer.framesPerSecond).toBe(24);
        expect(result.layer.rootPrims.map((prim) => prim.name)).toEqual(["overview_cam", "TestOver", "TestOverWithoutTypename"]);
        expect(result.layer.rootPrims.map((prim) => prim.specifier)).toEqual(["def", "over", "over"]);
    });
});
