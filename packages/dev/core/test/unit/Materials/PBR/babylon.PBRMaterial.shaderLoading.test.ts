import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { type Effect, type IEffectCreationOptions } from "core/Materials/effect";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";

function createReadyEffect(engine: Engine): Effect {
    return {
        dispose: vi.fn(),
        getEngine: () => engine,
        isReady: () => true,
    } as unknown as Effect;
}

describe("PBRMaterial shader loading", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("does not await shader imports again for a cloned material", async () => {
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));
        const sourceMesh = MeshBuilder.CreateSphere("source", {}, scene);
        const sourceMaterial = new PBRMaterial("sourceMaterial", scene);
        sourceMesh.material = sourceMaterial;

        expect(sourceMaterial.isReadyForSubMesh(sourceMesh, sourceMesh.subMeshes[0])).toBe(true);

        const firstOptions = createEffect.mock.calls[0][1] as IEffectCreationOptions;
        expect(firstOptions.extraInitializationsAsync).toBeTypeOf("function");
        await firstOptions.extraInitializationsAsync!();

        createEffect.mockClear();

        const clonedMesh = MeshBuilder.CreateSphere("clone", {}, scene);
        const clonedMaterial = sourceMaterial.clone("clonedMaterial");
        clonedMesh.material = clonedMaterial;

        expect(clonedMaterial.isReadyForSubMesh(clonedMesh, clonedMesh.subMeshes[0])).toBe(true);

        const clonedOptions = createEffect.mock.calls[0][1] as IEffectCreationOptions;
        expect(clonedOptions.extraInitializationsAsync).toBeUndefined();
    });
});
