import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ClusteredLightContainer } from "core/Lights/Clustered/clusteredLightContainer";
import { ClusteredLightingSceneComponent } from "core/Lights/Clustered/clusteredLightingSceneComponent";
import { PointLight } from "core/Lights/pointLight";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";

describe("ClusteredLightingSceneComponent readiness", () => {
    let engine: NullEngine;
    let scene: Scene;
    let component: ClusteredLightingSceneComponent;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        component = new ClusteredLightingSceneComponent(scene);
        component.register();
    });

    afterEach(() => {
        component.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    function createContainer(name = "cluster") {
        const light = new ClusteredLightContainer(name, [], scene);
        const supported = vi.spyOn(light, "isSupported", "get").mockReturnValue(true);
        const ready = vi.spyOn(light, "_isReady").mockReturnValue(false);
        return { light, ready, supported };
    }

    it.each([true, false])("waits for the proxy even when mesh readiness is cached (checkRenderTargets=%s)", (checkRenderTargets) => {
        const { ready } = createContainer();
        const mesh = CreateBox("mesh", {}, scene);
        mesh.material = new StandardMaterial("material", scene);
        vi.spyOn(mesh, "isReady").mockReturnValue(true);
        const render = vi.spyOn(scene, "render");
        const renderId = scene.getRenderId();

        expect(scene.isReady(checkRenderTargets)).toBe(false);
        expect(ready).toHaveBeenCalledOnce();

        ready.mockReturnValue(true);
        expect(scene.isReady(checkRenderTargets)).toBe(true);
        expect(scene.getRenderId()).toBe(renderId);
        expect(render).not.toHaveBeenCalled();
    });

    it("starts readiness checks for every container even when the first is not ready", () => {
        const first = createContainer("first");
        const second = createContainer("second");

        expect(scene.isReady()).toBe(false);
        expect(first.ready).toHaveBeenCalledOnce();
        expect(second.ready).toHaveBeenCalledOnce();
        first.ready.mockReturnValue(true);
        expect(scene.isReady()).toBe(false);
        second.ready.mockReturnValue(true);
        expect(scene.isReady()).toBe(true);
    });

    it("skips globally disabled lighting and checks it again when reenabled", () => {
        const { ready } = createContainer();
        scene.lightsEnabled = false;
        expect(scene.isReady()).toBe(true);
        expect(ready).not.toHaveBeenCalled();

        scene.lightsEnabled = true;
        expect(scene.isReady()).toBe(false);
        expect(ready).toHaveBeenCalledOnce();
    });

    it("skips containers disabled through a parent", () => {
        const { light, ready } = createContainer();
        const parent = new Mesh("parent", scene);
        light.parent = parent;
        parent.setEnabled(false);
        expect(scene.isReady()).toBe(true);
        expect(ready).not.toHaveBeenCalled();

        parent.setEnabled(true);
        expect(scene.isReady()).toBe(false);
    });

    it("does not wait for unsupported containers or unrelated lights", () => {
        const { ready, supported } = createContainer();
        supported.mockReturnValue(false);
        const point = new PointLight("point", Vector3.Zero(), scene);
        const pointReady = vi.spyOn(point, "_isReady").mockReturnValue(false);

        expect(scene.isReady()).toBe(true);
        expect(ready).not.toHaveBeenCalled();
        expect(pointReady).not.toHaveBeenCalled();
    });

    it("tracks containers added and removed after the scene was ready", () => {
        expect(scene.isReady()).toBe(true);
        const { light, ready } = createContainer();
        expect(scene.isReady()).toBe(false);
        ready.mockClear();
        light.dispose();
        expect(scene.isReady()).toBe(true);
        expect(ready).not.toHaveBeenCalled();
    });

    it("unregisters its readiness check on disposal", () => {
        const { ready } = createContainer();
        expect(scene.isReady()).toBe(false);
        ready.mockClear();
        component.dispose();
        expect(scene.isReady()).toBe(true);
        expect(ready).not.toHaveBeenCalled();
    });
});
