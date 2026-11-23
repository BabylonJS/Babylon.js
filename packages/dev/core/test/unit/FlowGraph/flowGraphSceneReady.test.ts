import { NullEngine } from "core/Engines/nullEngine";
import { FlowGraphCoordinator } from "core/FlowGraph";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import type { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("FlowGraph scene ready event", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        vi.useFakeTimers();
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.useRealTimers();
    });

    it("fires once, and only after the render targets of the scene are ready", () => {
        let renderTargetReady = false;
        scene.customRenderTargets.push({ isReadyForRendering: () => renderTargetReady } as unknown as RenderTargetTexture);
        const graph = new FlowGraphCoordinator({ scene }).createGraph();
        const sceneReadyEvents: boolean[] = [];
        graph.sceneEventCoordinator.onEventTriggeredObservable.add((event) => {
            if (event.type === FlowGraphEventType.SceneReady) {
                sceneReadyEvents.push(renderTargetReady);
            }
        });

        graph.start();
        vi.advanceTimersByTime(100);
        expect(sceneReadyEvents).toEqual([]);

        renderTargetReady = true;
        vi.advanceTimersByTime(300);
        expect(sceneReadyEvents).toEqual([true]);
    });
});
