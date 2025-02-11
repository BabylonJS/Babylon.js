import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphAction } from "core/FlowGraph/flowGraphLogger";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { getPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";

/**
 * This test is for the interactivity nodes. Each nodes will have its own test, making sure it is working according to the specs.
 * Note that this expects that the Flow Graph is working correctly, as the nodes will be converted to FlowGraph blocks.
 */
describe("Interactivity nodes", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log");
    let mockGltf: any;
    const pathConverter = getPathToObjectConverter(mockGltf);

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", 0, 0, 0, new Vector3(0, 0, 0));
        log.mockClear();
    });

    it("should use math/e correctly", async () => {
        const i2fg = new InteractivityGraphToFlowGraphParser(
            {
                declarations: [{ op: "event/onStart" }, { op: "math/e" }, { op: "babylon/log", extension: "BABYLON_Logging" }],
                nodes: [
                    {
                        declaration: 0,
                        flows: {
                            out: {
                                node: 2,
                                socket: "in",
                            },
                        },
                    },
                    {
                        declaration: 1,
                    },
                    {
                        declaration: 2,
                        values: {
                            message: {
                                node: 1,
                                socket: "value",
                            },
                        },
                    },
                ],
            },
            mockGltf
        );
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        graph.getContext(0).enableLogging = true;
        // graph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        const logItem = graph.getContext(0).logger!.getItemsOfType(FlowGraphAction.GetConnectionValue).pop();
        expect(logItem?.payload.value).toBe(Math.E);
    });
});
