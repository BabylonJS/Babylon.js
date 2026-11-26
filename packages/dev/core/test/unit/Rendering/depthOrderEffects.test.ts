import { expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import "core/Engines/Extensions/engine.multiRender";
import { WebGL2ShaderProcessor } from "core/Engines/WebGL/webGL2ShaderProcessors";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphVolumetricLightingTask } from "core/FrameGraph/Tasks/PostProcesses/volumetricLightingTask";
import { DirectionalLight } from "core/Lights/directionalLight";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { FluidRenderingTargetRenderer } from "core/Rendering/fluidRenderer/fluidRenderingTargetRenderer";
import { Scene } from "core/scene";
import "core/Shaders/fluidRenderingRender.fragment";
import "core/Shaders/postprocess.vertex";

it("binds the current depth-order variant in an existing volumetric lighting task", async () => {
    const engine = new NullEngine();
    engine.useReverseDepthBuffer = true;
    vi.spyOn(engine, "_getShaderProcessor").mockReturnValue(new WebGL2ShaderProcessor());
    vi.spyOn(engine, "buildTextureLayout").mockImplementation((enabled) => enabled.map((value, index) => (value ? index + 1 : 0)));
    vi.spyOn(engine, "createMultipleRenderTarget").mockImplementation((size) => engine._createHardwareRenderTargetWrapper(true, false, size));
    vi.spyOn(engine, "clearAttachments").mockImplementation(() => {});
    vi.spyOn(engine, "_createInternalTexture").mockImplementation((size, _options, _delay, source = InternalTextureSource.RenderTarget) => {
        const texture = new InternalTexture(engine, source, true);
        texture.isReady = true;
        texture.updateSize(typeof size === "number" ? size : size.width, typeof size === "number" ? size : size.height);
        return texture;
    });
    const scene = new Scene(engine);
    const graph = new FrameGraph(scene);
    const task = new FrameGraphVolumetricLightingTask("volume", graph);
    const camera = new FreeCamera("camera", Vector3.Zero(), scene);
    scene.activeCamera = camera;
    task.camera = camera;
    task.light = new DirectionalLight("light", Vector3.Down(), scene);
    const volume = CreateBox("volume", {}, scene);
    volume.position.z = 5;
    task.lightingVolumeMesh = { meshes: [volume], particleSystems: [] };

    const createTexture = (name: string) =>
        graph.textureManager.createRenderTargetTexture(name, {
            size: 16,
            sizeIsPercentage: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RGBA],
            },
        });
    task.targetTexture = createTexture("color");
    task.depthTexture = createTexture("depth");
    graph.addTask(task);
    scene.frameGraph = graph;

    const enableEffect = vi.spyOn(engine, "enableEffect");
    try {
        await graph.buildAsync(false);
        for (const reverseDepth of [true, false, true]) {
            engine.useReverseDepthBuffer = reverseDepth;
            camera.getProjectionMatrix(true);
            scene.updateTransformMatrix();

            enableEffect.mockClear();
            engine.beginFrame();
            scene.render();
            engine.endFrame();

            const effect = enableEffect.mock.calls
                .map(([bound]) => (bound === null ? null : DrawWrapper.GetEffect(bound)))
                .find((bound) => bound?.name === "volumetricLightingRenderVolume");
            expect(effect?.fragmentSourceCode).toMatch(reverseDepth ? /gl_FragCoord\.z\s*<\s*depth/ : /gl_FragCoord\.z\s*>\s*depth/);
            expect(effect?.fragmentSourceCode).not.toContain("#ifdef USE_REVERSE_DEPTHBUFFER");
        }
    } finally {
        task.dispose();
        graph.dispose();
        scene.dispose();
        engine.dispose();
    }
});

it("binds the current depth-order variant in an existing fixed-thickness fluid compositor", async () => {
    const engine = new NullEngine();
    engine.useReverseDepthBuffer = true;
    vi.spyOn(engine, "_getShaderProcessor").mockReturnValue(new WebGL2ShaderProcessor());
    const scene = new Scene(engine);
    const camera = new FreeCamera("camera", Vector3.Zero(), scene);
    scene.activeCamera = camera;
    const renderer = new FluidRenderingTargetRenderer(scene, camera);
    renderer.useFixedThickness = true;
    renderer.enableBlurDepth = false;

    try {
        renderer._initialize();
        const postProcess = renderer._renderPostProcess;
        if (postProcess === null) {
            throw new Error("The fluid compositor did not initialize.");
        }
        camera.attachPostProcess(postProcess);
        await vi.waitFor(() => expect(postProcess.isReady()).toBe(true));

        for (const reverseDepth of [true, false, true]) {
            engine.useReverseDepthBuffer = reverseDepth;
            camera.getProjectionMatrix(true);
            scene.updateTransformMatrix();
            postProcess.activate(camera);
            await vi.waitFor(() => expect(postProcess.isReady()).toBe(true));

            const effect = postProcess.apply();
            expect(effect?.fragmentSourceCode).toMatch(reverseDepth ? /bgDepth\s*>=\s*depthNonLinear/ : /bgDepth\s*<=\s*depthNonLinear/);
            expect(effect?.fragmentSourceCode).not.toContain("#ifdef USE_REVERSE_DEPTHBUFFER");
        }
    } finally {
        renderer.dispose();
        scene.dispose();
        engine.dispose();
    }
});
