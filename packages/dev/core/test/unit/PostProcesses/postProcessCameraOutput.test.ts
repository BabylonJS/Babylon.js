import { type RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { type PostProcess } from "core/PostProcesses/postProcess";
import { PostProcessManager } from "core/PostProcesses/postProcessManager";
import { type Scene } from "core/scene";
import { WebXRLayerRenderTargetTexture } from "core/XR/webXRLayerRenderTargetTexture";
import { describe, expect, it, vi } from "vitest";

describe("PostProcessManager camera output", () => {
    function setup() {
        const target = {} as RenderTargetWrapper;
        const engine = { bindFramebuffer: vi.fn(), restoreDefaultFramebuffer: vi.fn(), setDepthBuffer: vi.fn(), setDepthWrite: vi.fn(), setAlphaMode: vi.fn() };
        const eye = (layer: number): WebXRLayerRenderTargetTexture =>
            Object.assign(Object.create(WebXRLayerRenderTargetTexture.prototype), {
                layerIndex: layer,
                _renderTarget: target,
                ignoreCameraViewport: true,
                getScene: () => ({ getEngine: () => engine }),
            });
        const left = eye(0);
        const right = eye(1);
        const scene = { activeCamera: { outputRenderTarget: left }, getEngine: () => engine, postProcessesEnabled: true };
        const manager = new PostProcessManager(scene as unknown as Scene);
        const pp = { apply: () => null } as unknown as PostProcess;
        const render = (output?: RenderTargetWrapper, face?: number, fullscreen = false) => manager._finalizeFrame(false, output, face, [pp], fullscreen);
        return { engine, scene, left, right, target, pp, render };
    }

    it("keeps the selected eye even when both cameras share an output wrapper", () => {
        const { engine, scene, left, right, target, pp, render } = setup();
        for (const cameraOutput of [left, right, left]) {
            scene.activeCamera.outputRenderTarget = cameraOutput;
            render(target, undefined, cameraOutput === right);
            expect(pp._outputTexture).toBe(target);
        }
        expect(engine.bindFramebuffer.mock.calls.map((args) => [args[4], args[6]])).toEqual([
            [false, 0],
            [true, 1],
            [false, 0],
        ]);
    });

    it("keeps explicit cube faces, independent targets and canvas output independent of the current eye", () => {
        const { engine, scene, right, target, render } = setup();
        scene.activeCamera.outputRenderTarget = right;
        const other = {} as RenderTargetWrapper;
        render(target, 0);
        render(other, undefined, true);
        render();
        expect(engine.bindFramebuffer.mock.calls).toEqual([
            [target, 0, undefined, undefined, false],
            [other, undefined, undefined, undefined, true],
        ]);
        expect(engine.restoreDefaultFramebuffer).toHaveBeenCalledOnce();
    });
});
