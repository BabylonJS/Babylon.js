import { Constants, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import "loaders/glTF/2.0/Extensions/KHR_interactivity";
import { _AddInteractivityObjectModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import { AnimationGroup } from "core/Animations/animationGroup";
import { Animation } from "core/Animations/animation";
import { CreateKHRInteractivityGraphModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphModel";
import { InteractivityHostResolver } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityHostResolver";

describe("Interactivity/animation nodes", () => {
    let engine: NullEngine;
    let scene: Scene;
    const log: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Error").mockImplementation(() => {});
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        mockGltf: any, //Partial<IGLTF>,
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        variables: IKHRInteractivity_Variable[] = [],
        entryNodeIndex: number = 0,
        strictValidation: boolean = true
    ) {
        const shiftedNodes = nodes.map((node) => ({
            ...node,
            declaration: node.declaration + 1,
            values: node.values
                ? Object.fromEntries(Object.entries(node.values).map(([key, value]) => [key, "node" in value ? { ...value, node: value.node + 1 } : value]))
                : undefined,
            flows: node.flows ? Object.fromEntries(Object.entries(node.flows).map(([key, flow]) => [key, { ...flow, node: flow.node + 1 }])) : undefined,
        }));
        const ig: IKHRInteractivity_Graph = {
            declarations: [{ op: "event/onStart" }, ...declarations],
            types,
            nodes: [
                {
                    declaration: 0,
                    flows: {
                        out: {
                            node: entryNodeIndex + 1,
                            socket: "in",
                        },
                    },
                },
                ...shiftedNodes,
            ],
            variables: variables.length ? variables : undefined,
        };

        const pathConverter = GetPathToObjectConverter(mockGltf);
        const model = CreateKHRInteractivityGraphModel(ig);
        if (strictValidation) {
            expect(model.valid, model.diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join("\n")).toBe(true);
        }
        const i2fg = new InteractivityGraphToFlowGraphParser(
            strictValidation ? model.effectiveSource : ig,
            mockGltf,
            60,
            0,
            undefined,
            strictValidation ? model.declarations : undefined
        );
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
        const graph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        graph.getContext(0).enableLogging = true;
        graph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        return {
            graph,
            serialized: json,
            logger: graph.getContext(0).logger!,
        };
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        _AddInteractivityObjectModel(scene, 60);
        new ArcRotateCamera("", 0, 0, 0, new Vector3(0, 0, 0));
        log.mockClear();
        errorLog.mockClear();
        renderInterval = setInterval(() => scene?.render(), 16);
    });

    afterEach(() => {
        clearInterval(renderInterval);
        scene.dispose();
        engine.dispose();
    });

    test("animation/start with default values", async () => {
        const ag = new AnimationGroup("test");
        ag.to = 10;
        // spy on the start, reset and stop functions
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const stopSpy = vi.spyOn(ag, "stop");
        const gltf = {
            animations: [
                {
                    // empty animation to use index: 1
                },
                {
                    _babylonAnimationGroup: ag,
                },
            ],
        };

        const { serialized } = await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: {
                            value: ["/animations/1"],
                            type: 0,
                        },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        endTime: { value: [10 / 60], type: 1 },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }]
        );

        expect(startSpy).toHaveBeenCalledTimes(1);
        // expect the variables sent to start to be the default values
        expect(startSpy).toHaveBeenCalledWith(false, 1, 0, 10);
        expect(stopSpy).not.toHaveBeenCalled();
        expect(serialized.allBlocks.find((block) => block.className === "FlowGraphPlayAnimationBlock")!.config.useVirtualTimeline).toBe(true);
    });

    test("animation/start with custom values", async () => {
        const ag = new AnimationGroup("test");
        ag.to = 600; // 600 frames mean 10 seconds at 60fps
        // spy on the start, reset and stop functions
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const stopSpy = vi.spyOn(ag, "stop");
        const gltf = {
            animations: [
                {
                    // empty animation to use index: 1
                },
                {
                    _babylonAnimationGroup: ag,
                },
            ],
        };

        await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: {
                            value: ["/animations/1"],
                            type: 0,
                        },
                        speed: {
                            value: [2.4], // index in the animation array
                            type: 1,
                        },
                        startTime: {
                            value: [1],
                            type: 1,
                        },
                        endTime: {
                            value: [3], // 3 seconds = 180 frames
                            type: 1,
                        },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }]
        );

        expect(startSpy).toHaveBeenCalledTimes(1);
        // expect the variables sent to start to be the custom values
        expect(startSpy).toHaveBeenCalledWith(false, 2.4, 60, 180);
        expect(stopSpy).not.toHaveBeenCalled();
    });

    test.each(["/animations/999", "/nodes/0"])("animation/start rejects a non-animation reference in strict mode: %s", async (reference) => {
        const ag = new AnimationGroup("test");
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        await generateSimpleNodeGraph(
            { animations: [{ _babylonAnimationGroup: ag }], nodes: [{}] },
            [{ op: "animation/start" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: { value: [reference], type: 0 },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        endTime: { value: [1], type: 1 },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }]
        );

        expect(startSpy).not.toHaveBeenCalled();
    });

    // Regression (WhackAMole): when endTime is supplied by a connection (here the read-only `maxTime`
    // animation pointer) rather than a literal, the parse-time seconds→frames dataTransformer cannot
    // run. The parser must insert a runtime multiply so the connected KHR time (seconds) is still
    // converted to Babylon frames. Without it the animation plays a tiny fraction of its range.
    test("animation/start converts a connected endTime (maxTime pointer) from seconds to frames", async () => {
        const ag = new AnimationGroup("test");
        const animation = new Animation("test", "value", 60, Constants.ANIMATIONTYPE_FLOAT);
        animation.setKeys([
            { frame: 0, value: 0 },
            { frame: 600, value: 1 },
        ]);
        ag.addTargetedAnimation(animation, { value: 0 });
        ag.to = 600;
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const gltf = {
            animations: [
                {}, // index 0 unused
                { _babylonAnimationGroup: ag },
            ],
        };
        const maxTime = GetPathToObjectConverter(gltf as any).convert("/animations/1/extensions/KHR_interactivity/maxTime");
        expect(maxTime.info.get(maxTime.object)).toBe(10);

        await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }, { op: "pointer/get" }],
            [
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/animations/1/extensions/KHR_interactivity/maxTime"] },
                        type: { value: [1] }, // float
                    },
                },
                {
                    declaration: 0,
                    values: {
                        animation: { value: ["/animations/1"], type: 0 },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        // endTime is fed by the pointer/get output rather than a literal.
                        endTime: { node: 0, socket: "value" },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }],
            [],
            1
        );

        expect(startSpy).toHaveBeenCalledTimes(1);
        // to === 600 frames proves the connected 10s maxTime was scaled by the 60 fps factor.
        expect(startSpy).toHaveBeenCalledWith(false, 1, 0, 600);
    });

    // animation/start input validation (KHR spec: err flow when speed/time inputs are invalid)

    test.each([
        ["speed 0", { speed: { value: [0], type: 1 } }],
        ["speed -1", { speed: { value: [-1], type: 1 } }],
        ["speed NaN", { speed: { value: [NaN], type: 1 } }],
        ["speed +Infinity", { speed: { value: [Infinity], type: 1 } }],
        ["endTime NaN", { endTime: { value: [NaN], type: 1 } }],
        ["startTime NaN", { startTime: { value: [NaN], type: 1 } }],
        ["startTime +Infinity", { startTime: { value: [Infinity], type: 1 } }],
    ])("animation/start does not start the animation for invalid input: %s", async (_name, extraValues) => {
        const ag = new AnimationGroup("test");
        ag.to = 10;
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const gltf = {
            animations: [{}, { _babylonAnimationGroup: ag }],
        };

        await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: { value: ["/animations/1"], type: 0 },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        endTime: { value: [2], type: 1 },
                        ...(extraValues as any),
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }],
            [],
            0,
            false
        );

        expect(startSpy).not.toHaveBeenCalled();
    });

    test("animation/start allows an infinite endTime (plays/loops, does not error)", async () => {
        const ag = new AnimationGroup("test");
        ag.to = 10;
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const gltf = {
            animations: [{}, { _babylonAnimationGroup: ag }],
        };

        await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: { value: ["/animations/1"], type: 0 },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        // Per the KHR spec only a NaN or infinite START time errors; an infinite END time is valid
                        // and means "play to the natural end / loop".
                        endTime: { value: [Infinity], type: 1 },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }],
            [],
            0,
            false
        );

        // The animation must still start (with loop = true because the end time is infinite).
        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(startSpy).toHaveBeenCalledWith(true, 1, 0, expect.anything());
    });

    // animation/stop

    test("animation/stop after a delay", async () => {
        const ag = new AnimationGroup("test");
        // spy on the start, reset and stop functions
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const stopSpy = vi.spyOn(ag, "stop");
        const gltf = {
            animations: [
                {
                    // empty animation to use index: 1
                },
                {
                    _babylonAnimationGroup: ag,
                },
            ],
        };

        const { serialized } = await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }, { op: "flow/setDelay" }, { op: "animation/stop" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: {
                            value: ["/animations/1"],
                            type: 0,
                        },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        endTime: { value: [1], type: 1 },
                    },
                    flows: {
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        duration: {
                            value: [0.5],
                            type: 1,
                        },
                    },
                    flows: {
                        done: {
                            node: 2,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        animation: {
                            value: ["/animations/1"],
                            type: 0,
                        },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }]
        );

        // wait a second for the delay to pass
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(startSpy).toHaveBeenCalled();
        expect(stopSpy).toHaveBeenCalledTimes(1);
        // The animation must be stopped while skipping the animation-end observable, so that stopping does not
        // activate the originating animation/start operation's `done` flow (KHR_interactivity spec).
        expect(stopSpy).toHaveBeenCalledWith(true);
        expect(serialized.allBlocks.find((block) => block.className === "FlowGraphStopAnimationBlock")!.config.skipOnAnimationEnd).toBe(true);
    });

    // animation/stopAt
    test("animation/stopAt - simple", async () => {
        const ag = new AnimationGroup("test");
        ag.to = 60;
        // object to animation
        const property = "Test";
        const objectToAnimation = {
            [property]: 1,
        };
        // create a targeted animation and add to the animation grou
        const animation: Animation = new Animation(property + "Animation", property, 60, Constants.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        animation.setKeys([
            { frame: 0, value: 1 },
            { frame: 60, value: 2 },
        ]);
        ag.addTargetedAnimation(animation, objectToAnimation);
        // spy on the start, reset and stop functions
        const startSpy = vi.spyOn(ag, "startWithVirtualTimeline");
        const stopSpy = vi.spyOn(ag, "stop");
        const gltf = {
            animations: [
                {
                    _babylonAnimationGroup: ag,
                },
            ],
        };

        const { serialized } = await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }, { op: "animation/stopAt" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: {
                            value: ["/animations/0"],
                            type: 0,
                        },
                        speed: { value: [1], type: 1 },
                        startTime: { value: [0], type: 1 },
                        endTime: { value: [1], type: 1 },
                    },
                    flows: {
                        out: {
                            node: 1, // stopAt node
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        animation: {
                            value: ["/animations/0"],
                            type: 0,
                        },
                        stopTime: {
                            value: [0.5],
                            type: 1,
                        },
                    },
                },
            ],
            [{ signature: "ref" }, { signature: "float" }]
        );

        // wait 400 MSFT_audio_emitter, check that stop has NOT been triggered
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(startSpy).toHaveBeenCalled();
        expect(stopSpy).not.toHaveBeenCalled();

        // wait another 400 ms and check that stop has been called
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(stopSpy).toHaveBeenCalledTimes(1);
        expect(serialized.allBlocks.find((block) => block.className === "FlowGraphStopAnimationBlock")!.config).toMatchObject({
            useVirtualStopAt: true,
            skipOnAnimationEnd: true,
        });
    });
});
