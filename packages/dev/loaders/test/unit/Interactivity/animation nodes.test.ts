import { Constants, NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import "loaders/glTF/2.0/Extensions/KHR_interactivity";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import { AnimationGroup } from "core/Animations/animationGroup";
import { Animation } from "core/Animations/animation";

describe("Interactivity/animation nodes", () => {
    let engine: NullEngine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: jest.SpyInstance = jest.spyOn(Logger, "Error").mockImplementation(() => {});
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        mockGltf: any, //Partial<IGLTF>,
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        variables: IKHRInteractivity_Variable[] = []
    ) {
        const ig: IKHRInteractivity_Graph = {
            declarations: [...declarations, { op: "event/onStart" }],
            types,
            nodes: [
                ...nodes,
                {
                    declaration: declarations.length,
                    flows: {
                        out: {
                            node: 0, // first node provided should be the flow node tested
                            socket: "in",
                        },
                    },
                },
            ],
            variables,
        };

        const pathConverter = GetPathToObjectConverter(mockGltf);
        const i2fg = new InteractivityGraphToFlowGraphParser(ig, mockGltf, {
            parent: {
                targetFps: 60,
            },
        } as unknown as any);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        graph.getContext(0).enableLogging = true;
        graph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        return {
            graph,
            logger: graph.getContext(0).logger!,
        };
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
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
        const startSpy = jest.spyOn(ag, "start");
        const stopSpy = jest.spyOn(ag, "stop");
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
                            value: [1], // index in the animation array
                            type: 0,
                        },
                    },
                },
            ],
            [{ signature: "int" }]
        );

        expect(startSpy).toHaveBeenCalledTimes(1);
        // expect the variables sent to start to be the default values
        expect(startSpy).toHaveBeenCalledWith(false, 1, 0, 10);
        expect(stopSpy).not.toHaveBeenCalled();
    });

    test("animation/start with custom values", async () => {
        const ag = new AnimationGroup("test");
        ag.to = 600; // 600 frames mean 10 seconds at 60fps
        // spy on the start, reset and stop functions
        const startSpy = jest.spyOn(ag, "start");
        const stopSpy = jest.spyOn(ag, "stop");
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
                            value: [1], // index in the animation array
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
            [{ signature: "int" }, { signature: "float" }]
        );

        expect(startSpy).toHaveBeenCalledTimes(1);
        // expect the variables sent to start to be the custom values
        expect(startSpy).toHaveBeenCalledWith(false, 2.4, 60, 180);
        expect(stopSpy).not.toHaveBeenCalled();
    });

    // animation/stop

    test("animation/stop after a delay", async () => {
        const ag = new AnimationGroup("test");
        // spy on the start, reset and stop functions
        const startSpy = jest.spyOn(ag, "start");
        const stopSpy = jest.spyOn(ag, "stop");
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
            [{ op: "animation/start" }, { op: "animation/stop" }, { op: "flow/setDelay" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: {
                            value: [1], // index in the animation array
                            type: 0,
                        },
                    },
                    flows: {
                        out: {
                            node: 2, // delay node
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        animation: {
                            value: [1], // index in the animation array
                            type: 0,
                        },
                    },
                },
                // delay 0.5 seconds and run stop
                {
                    declaration: 2,
                    values: {
                        duration: {
                            value: [0.5],
                            type: 1,
                        },
                    },
                    flows: {
                        done: {
                            node: 1, // stop node
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "int" }, { signature: "float" }]
        );

        // wait a second for the delay to pass
        await new Promise((resolve) => setTimeout(resolve, 1000));

        expect(startSpy).toHaveBeenCalled();
        expect(stopSpy).toHaveBeenCalledTimes(1);
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
        const startSpy = jest.spyOn(ag, "start");
        const stopSpy = jest.spyOn(ag, "stop");
        const gltf = {
            animations: [
                {
                    _babylonAnimationGroup: ag,
                },
            ],
        };

        await generateSimpleNodeGraph(
            gltf,
            [{ op: "animation/start" }, { op: "animation/stopAt" }],
            [
                {
                    declaration: 0,
                    values: {
                        animation: {
                            value: [0], // index in the animation array
                            type: 0,
                        },
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
                            value: [0], // index in the animation array
                            type: 0,
                        },
                        stopTime: {
                            value: [0.5],
                            type: 1,
                        },
                    },
                },
            ],
            [{ signature: "int" }, { signature: "float" }]
        );

        // wait 400 MSFT_audio_emitter, check that stop has NOT been triggered
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(startSpy).toHaveBeenCalled();
        expect(stopSpy).not.toHaveBeenCalled();

        // wait another 400 ms and check that stop has been called
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(stopSpy).toHaveBeenCalledTimes(1);
    });
});
