import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { GaussianSplattingDebugController } from "../../src/services/panes/properties/gaussianSplattingDebugController";

describe("Inspector Gaussian splat debug ownership", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: GaussianSplattingMesh;
    let original: GaussianSplattingMaterial;
    let controller: GaussianSplattingDebugController;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        mesh = new GaussianSplattingMesh("splats", null, scene);
        original = mesh.material as GaussianSplattingMaterial;
        controller = new GaussianSplattingDebugController();
    });

    afterEach(() => {
        controller.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("retains exactly the source material while switching per-mesh modes", () => {
        original.kernelSize = 0.7;
        controller.setMode(mesh, "size");
        const temporary = mesh.material as GaussianSplattingMaterial;
        expect(temporary).not.toBe(original);
        expect(temporary.getSourceMesh()).toBe(mesh);
        expect(temporary.kernelSize).toBe(0.7);
        expect(controller.getMode(mesh)).toBe("size");
        controller.setMode(mesh, "overdraw");
        expect(mesh.material).toBe(temporary);
        expect(controller.getPlugins(mesh)?.size.isEnabled).toBe(false);
        expect(controller.getPlugins(mesh)?.overdraw.isEnabled).toBe(true);
        controller.setMode(mesh, "normal");
        expect(mesh.material).toBe(original);
        expect(controller.getPlugins(mesh)).toBeUndefined();
    });

    it("does not change a shared original material and restores on Inspector close", () => {
        const second = new GaussianSplattingMesh("second", null, scene);
        second.material = original;
        controller.setMode(mesh, "size");
        expect(second.material).toBe(original);
        controller.dispose();
        expect(mesh.material).toBe(original);
        expect(second.material).toBe(original);
    });

    it("leaves the source mesh without a material if the application disposes its original", () => {
        const cameraProxy = new Mesh("cameraProxy", scene);
        const cameraViews = (
            mesh as unknown as {
                _cameraViewInfos: Map<number, { mesh: Mesh }>;
            }
        )._cameraViewInfos;
        cameraViews.set(1, { mesh: cameraProxy });
        controller.setMode(mesh, "size");
        const temporary = mesh.material;
        original.dispose();
        expect(scene.materials).not.toContain(original);
        controller.setMode(mesh, "normal");
        expect(mesh.material).toBeNull();
        expect(cameraProxy.material).toBeNull();
        expect(mesh.material).not.toBe(temporary);
        expect(controller.getPlugins(mesh)).toBeUndefined();
        cameraViews.delete(1);
    });

    it("leaves the source mesh without a material on Inspector close after its original was disposed", () => {
        controller.setMode(mesh, "overdraw");
        original.dispose();
        controller.dispose();
        expect(mesh.material).toBeNull();
    });

    it("retains minimum pixel size edits on the shared original while debugging", () => {
        const second = new GaussianSplattingMesh("second", null, scene);
        second.material = original;
        controller.setMode(mesh, "size");
        controller.setMinPixelSize(mesh, 3.5);
        mesh.minPixelSize = 3.5;
        expect(original.minPixelSize).toBe(3.5);
        expect(second.minPixelSize).toBe(3.5);
        controller.setMode(mesh, "normal");
        expect(mesh.minPixelSize).toBe(3.5);
        expect(mesh.material).toBe(original);
    });

    it("does not overwrite an external material replacement", () => {
        controller.setMode(mesh, "size");
        const replacement = new GaussianSplattingMaterial("replacement", scene);
        mesh.material = replacement;
        scene.onBeforeRenderObservable.notifyObservers(scene);
        controller.dispose();
        expect(mesh.material).toBe(replacement);
    });

    it("releases entries on mesh disposal without resurrecting materials", () => {
        controller.setMode(mesh, "overdraw");
        mesh.dispose();
        expect(controller.getPlugins(mesh)).toBeUndefined();
    });
});
