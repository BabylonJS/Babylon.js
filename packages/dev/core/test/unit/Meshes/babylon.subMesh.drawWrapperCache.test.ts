import { Engine, NullEngine } from "core/Engines";
import { MaterialDefines, MultiMaterial, StandardMaterial } from "core/Materials";
import { Mesh, SubMesh } from "core/Meshes";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Babylon SubMesh DrawWrapper Cache", () => {
    let subject: Engine;
    let scene: Scene;
    let mesh: Mesh;
    let subMesh: SubMesh;
    let passZeroId: number;
    let passOneId: number;
    let passZeroMaterial: MultiMaterial;
    let passOneMaterial: MultiMaterial;
    let passZeroSubMaterial: StandardMaterial;
    let passOneSubMaterial: StandardMaterial;

    beforeEach(async function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);

        passZeroId = subject.createRenderPassId("passZero");
        passOneId = subject.createRenderPassId("passOne");

        passZeroMaterial = new MultiMaterial("MultiMaterialZero", scene);
        passZeroSubMaterial = new StandardMaterial("StandardMaterialZero", scene);
        passZeroMaterial.subMaterials.push(passZeroSubMaterial);

        passOneMaterial = new MultiMaterial("MultiMaterialOne", scene);
        passOneSubMaterial = new StandardMaterial("StandardMaterialOne", scene);
        passOneMaterial.subMaterials.push(passOneSubMaterial);

        mesh = MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
        subMesh = new SubMesh(0, 0, 0, 0, 0, mesh);
        mesh.setMaterialForRenderPass(passZeroId, passZeroMaterial);
        mesh.setMaterialForRenderPass(passOneId, passOneMaterial);
    });

    afterEach(() => {
        scene.dispose();
        subject.dispose();
    });

    it("Inactive Pass Dirty", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        expect(subject.currentRenderPassId).toBe(passOneId);
        passZeroSubMaterial.disableLighting = true;
        expect((subMesh._drawWrappers[passZeroId].defines as MaterialDefines)._areLightsDirty).toBe(true);
    });
    it("Frozen Material Dirty", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);

        passZeroSubMaterial.freeze();
        expect(passZeroSubMaterial.isFrozen).toBe(true);

        scene.incrementRenderId();

        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        const wrapperZero = subMesh._drawWrappers[passZeroId];

        expect(wrapperZero).toBeDefined();
        expect(wrapperZero._wasPreviouslyReady).toBe(true);

        const effectZero = wrapperZero.effect;
        expect(effectZero).toBeTruthy();

        expect(effectZero!.defines).not.toContain("#define POINTSIZE");

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);

        passZeroSubMaterial.pointsCloud = true;
        passZeroSubMaterial.markDirty(true);

        expect(wrapperZero._wasPreviouslyReady).toBe(false);
        expect((wrapperZero.defines as MaterialDefines).isDirty).toBe(true);

        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);

        scene.incrementRenderId();

        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        expect(subMesh._drawWrappers[passZeroId]).toBe(wrapperZero);
        expect(wrapperZero.effect).toBeTruthy();
        expect(wrapperZero.effect).not.toBe(effectZero);
        expect(wrapperZero._wasPreviouslyReady).toBe(true);
        expect(wrapperZero.effect!.defines).toContain("#define POINTSIZE");
    });
    it("Mark Dirty", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        expect(subject.currentRenderPassId).toBe(passOneId);
        expect((subMesh._drawWrappers[passZeroId].defines as MaterialDefines).isDirty).toBe(false);
        passZeroSubMaterial.markDirty(true);
        expect((subMesh._drawWrappers[passZeroId].defines as MaterialDefines).isDirty).toBe(true);
    });
    it("Replace SubMaterial", () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);

        const replacementMaterial = new StandardMaterial("StandardMaterial", scene);
        passZeroMaterial.subMaterials[0] = replacementMaterial;
        expect(subMesh.getMaterial()).toBe(replacementMaterial);
    });
    it("Replace Pass Material", () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);

        const replacementMultiMaterial = new MultiMaterial("MultiMaterial", scene);
        const replacementSubMaterial = new StandardMaterial("StandardMaterial", scene);
        replacementMultiMaterial.subMaterials.push(replacementSubMaterial);
        mesh.setMaterialForRenderPass(passZeroId, replacementMultiMaterial);
        expect(subMesh.getMaterial()).toBe(replacementSubMaterial);
    });
    it("Scoped Pass Reset", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        const wrapperOne = subMesh._drawWrappers[passOneId];

        expect(subMesh._drawWrappers[passZeroId]).toBeDefined();
        expect(wrapperOne).toBeDefined();

        const effectOne = wrapperOne.effect;
        expect(effectOne).toBeTruthy();

        subMesh.resetDrawCache(passZeroId);

        expect(subMesh._drawWrappers[passZeroId]).toBeUndefined();
        expect(subMesh._drawWrappers[passOneId]).toBe(wrapperOne);
        expect(subMesh._drawWrappers[passOneId].effect).toBe(effectOne);
    });
    it("Scoped Material Reset", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        const wrapperOne = subMesh._drawWrappers[passOneId];

        expect(subMesh._drawWrappers[passZeroId]).toBeDefined();
        expect(wrapperOne).toBeDefined();

        const effectOne = wrapperOne.effect;
        expect(effectOne).toBeTruthy();

        passZeroSubMaterial.resetDrawCache();

        expect(subMesh._drawWrappers[passZeroId]).toBeUndefined();
        expect(subMesh._drawWrappers[passOneId]).toBe(wrapperOne);
        expect(subMesh._drawWrappers[passOneId].effect).toBe(effectOne);
    });
    it("Full Reset", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        expect(subMesh._drawWrappers[passZeroId]).toBeDefined();
        expect(subMesh._drawWrappers[passOneId]).toBeDefined();

        subMesh.resetDrawCache();

        expect(subMesh._drawWrappers[passZeroId]).toBeUndefined();
        expect(subMesh._drawWrappers[passOneId]).toBeUndefined();
    });
    it("Pass Release", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        expect(subMesh._drawWrappers[passZeroId]).toBeDefined();

        subject.releaseRenderPassId(passZeroId);

        expect(subMesh._drawWrappers[passZeroId]).toBeUndefined();
    });
    it("Pass Material Unset", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);

        mesh.setMaterialForRenderPass(passZeroId, undefined);

        expect(subMesh.getMaterial(false)).toBeNull();
        expect(subMesh._drawWrappers[passZeroId]).toBeUndefined();
    });
    it("Pass Switch", async () => {
        subject.currentRenderPassId = passZeroId;
        expect(subMesh.getMaterial()).toBe(passZeroSubMaterial);
        await passZeroMaterial.forceCompilationAsync(mesh);
        expect(passZeroMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        subject.currentRenderPassId = passOneId;
        expect(subMesh.getMaterial()).toBe(passOneSubMaterial);
        await passOneMaterial.forceCompilationAsync(mesh);
        expect(passOneMaterial.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

        const wrapperZero = subMesh._drawWrappers[passZeroId];
        const wrapperOne = subMesh._drawWrappers[passOneId];

        expect(wrapperZero).toBeDefined();
        expect(wrapperOne).toBeDefined();

        const effectZero = wrapperZero.effect;
        const effectOne = wrapperOne.effect;

        expect(effectZero).toBeTruthy();
        expect(effectOne).toBeTruthy();

        for (const passId of [passZeroId, passOneId, passZeroId]) {
            subject.currentRenderPassId = passId;
            const material = passId === passZeroId ? passZeroSubMaterial : passOneSubMaterial;

            expect(subMesh.getMaterial()).toBe(material);
            expect(material.isReadyForSubMesh(mesh, subMesh, false)).toBe(true);

            expect(subMesh._drawWrappers[passZeroId]).toBe(wrapperZero);
            expect(subMesh._drawWrappers[passZeroId].effect).toBe(effectZero);
            expect(subMesh._drawWrappers[passOneId]).toBe(wrapperOne);
            expect(subMesh._drawWrappers[passOneId].effect).toBe(effectOne);
        }
    });
});
