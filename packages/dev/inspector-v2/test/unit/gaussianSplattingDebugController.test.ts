import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Mesh } from "core/Meshes/mesh";
import { Plane } from "core/Maths/math.plane";
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
        const temporary = mesh.material as GaussianSplattingMaterial;
        const depth = temporary.shadowDepthWrapper!.baseMaterial;
        const onModeChanged = vi.fn();
        controller.onModeChangedObservable.add(onModeChanged);
        const replacement = new GaussianSplattingMaterial("replacement", scene);
        mesh.material = replacement;
        expect(controller.getPlugins(mesh)).toBeUndefined();
        expect(scene.materials).not.toContain(temporary);
        expect(scene.materials).not.toContain(depth);
        expect(onModeChanged).toHaveBeenCalledTimes(1);
        expect(onModeChanged.mock.calls[0][0]).toBe(mesh);
        controller.dispose();
        expect(mesh.material).toBe(replacement);
        expect(onModeChanged).toHaveBeenCalledTimes(1);
    });

    it("releases the temporary material immediately when the application assigns null without rendering", () => {
        const renderObserverCount = scene.onBeforeRenderObservable.observers.length;
        controller.setMode(mesh, "overdraw");
        const temporary = mesh.material as GaussianSplattingMaterial;
        const depth = temporary.shadowDepthWrapper!.baseMaterial;
        expect(scene.onBeforeRenderObservable.observers.length).toBe(renderObserverCount);
        const onModeChanged = vi.fn();
        controller.onModeChangedObservable.add(onModeChanged);

        mesh.material = null;

        expect(controller.getPlugins(mesh)).toBeUndefined();
        expect(mesh.material).toBeNull();
        expect(scene.materials).not.toContain(temporary);
        expect(scene.materials).not.toContain(depth);
        expect(onModeChanged).toHaveBeenCalledTimes(1);
        expect(onModeChanged.mock.calls[0][0]).toBe(mesh);
    });

    it("does not activate a disposed entry when another material observer replaces the initial temporary", () => {
        const replacement = new GaussianSplattingMaterial("replacement", scene);
        mesh.onMaterialChangedObservable.add(() => {
            if (mesh.material !== original) {
                mesh.material = replacement;
            }
        });
        const onModeChanged = vi.fn();
        controller.onModeChangedObservable.add(onModeChanged);

        controller.setMode(mesh, "size");

        expect(mesh.material).toBe(replacement);
        expect(controller.getPlugins(mesh)).toBeUndefined();
        expect(onModeChanged).toHaveBeenCalledTimes(1);
        expect(onModeChanged.mock.calls[0][0]).toBe(mesh);
    });

    it("releases entries on mesh disposal without resurrecting materials", () => {
        controller.setMode(mesh, "overdraw");
        mesh.dispose();
        expect(controller.getPlugins(mesh)).toBeUndefined();
    });

    it("releases Inspector-owned shadow resources and observers across repeated mode changes", () => {
        const materialCount = scene.materials.length;
        const renderObserverCount = scene.onBeforeRenderObservable.observers.length;
        const sceneObserverCount = scene.onDisposeObservable.observers.length;
        const meshObserverCount = mesh.onDisposeObservable.observers.length;
        for (let i = 0; i < 3; i++) {
            controller.setMode(mesh, i % 2 ? "overdraw" : "size");
            const temporary = mesh.material as GaussianSplattingMaterial;
            const shadow = temporary.shadowDepthWrapper!;
            const depth = shadow.baseMaterial;
            expect(temporary.reservedDataStore.hidden).toBe(true);
            expect(depth.reservedDataStore.hidden).toBe(true);
            expect(scene.materials).toContain(depth);
            controller.setMode(mesh, "normal");
            expect(scene.materials).not.toContain(temporary);
            expect(scene.materials).not.toContain(depth);
            expect(depth.onEffectCreatedObservable.observers).toHaveLength(0);
            expect(scene.materials).toHaveLength(materialCount);
            expect(scene.onBeforeRenderObservable.observers.filter((observer) => !observer._willBeUnregistered)).toHaveLength(renderObserverCount);
            expect(scene.onDisposeObservable.observers.filter((observer) => !observer._willBeUnregistered)).toHaveLength(sceneObserverCount);
            expect(mesh.onDisposeObservable.observers.filter((observer) => !observer._willBeUnregistered)).toHaveLength(meshObserverCount);
        }
    });

    it("releases owned shadow resources on external replacement, mesh disposal, and Inspector close", () => {
        for (const release of ["replacement", "mesh", "close"] as const) {
            const target = release === "mesh" ? new GaussianSplattingMesh("other", null, scene) : mesh;
            controller.setMode(target, "size");
            const temporary = target.material as GaussianSplattingMaterial;
            const depth = temporary.shadowDepthWrapper!.baseMaterial;
            if (release === "replacement") {
                target.material = original;
            } else if (release === "mesh") {
                target.dispose();
            } else {
                controller.dispose();
            }
            expect(scene.materials).not.toContain(temporary);
            expect(scene.materials).not.toContain(depth);
            expect(depth.onEffectCreatedObservable.observers).toHaveLength(0);
        }
    });

    it("releases owned shadow resources during scene disposal", () => {
        controller.setMode(mesh, "overdraw");
        const temporary = mesh.material as GaussianSplattingMaterial;
        const depth = temporary.shadowDepthWrapper!.baseMaterial;
        scene.dispose();
        expect(depth.onEffectCreatedObservable.observers).toHaveLength(0);
        expect(controller.getPlugins(mesh)).toBeUndefined();
    });

    it("releases only Inspector-owned shadow resources when the source material is disposed", () => {
        controller.setMode(mesh, "size");
        const temporary = mesh.material as GaussianSplattingMaterial;
        const depth = temporary.shadowDepthWrapper!.baseMaterial;
        const originalDepth = original.shadowDepthWrapper!.baseMaterial;
        original.dispose();
        controller.setMode(mesh, "normal");
        expect(scene.materials).not.toContain(depth);
        expect(scene.materials).toContain(originalDepth);
        expect(mesh.material).toBeNull();
    });

    it("does not dispose the source wrapper if the application replaces the temporary's shadow wrapper", () => {
        controller.setMode(mesh, "size");
        const temporary = mesh.material as GaussianSplattingMaterial;
        const depth = temporary.shadowDepthWrapper!.baseMaterial;
        const sourceWrapper = original.shadowDepthWrapper!;
        temporary.shadowDepthWrapper = sourceWrapper;
        controller.setMode(mesh, "normal");
        expect(scene.materials).not.toContain(depth);
        expect(scene.materials).toContain(sourceWrapper.baseMaterial);
        expect(sourceWrapper.baseMaterial.onEffectCreatedObservable.hasObservers()).toBe(true);
    });

    it("preserves source clip planes and supported logarithmic depth in both visualizations", () => {
        engine.getCaps().fragmentDepthSupported = true;
        const planes = Array.from({ length: 6 }, (_, i) => new Plane(1, 0, 0, i));
        original.clipPlane = planes[0];
        original.clipPlane2 = planes[1];
        original.clipPlane3 = planes[2];
        original.clipPlane4 = planes[3];
        original.clipPlane5 = planes[4];
        original.clipPlane6 = planes[5];
        original.useLogarithmicDepth = true;
        const supportedLogDepth = original.useLogarithmicDepth;
        expect(supportedLogDepth).toBe(true);
        for (const mode of ["size", "overdraw"] as const) {
            controller.setMode(mesh, mode);
            const temporary = mesh.material as GaussianSplattingMaterial;
            expect([temporary.clipPlane, temporary.clipPlane2, temporary.clipPlane3, temporary.clipPlane4, temporary.clipPlane5, temporary.clipPlane6]).toEqual(planes);
            expect(temporary.clipPlane).toBe(original.clipPlane);
            planes[0].d = 42;
            expect(temporary.clipPlane?.d).toBe(42);
            expect(temporary.useLogarithmicDepth).toBe(supportedLogDepth);
            controller.setMode(mesh, "normal");
            expect(mesh.material).toBe(original);
            expect(original.clipPlane).toBe(planes[0]);
            expect(original.useLogarithmicDepth).toBe(supportedLogDepth);
        }
    });
});
