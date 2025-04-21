import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { loggerExample, mathExample, worldPointerExample, doNExample, intMathExample } from "./testData";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3, Vector4 } from "core/Maths";
import { Mesh } from "core/Meshes";
import { ArcRotateCamera } from "core/Cameras";
import { Logger } from "core/Misc";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";

describe("Babylon Interactivity", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log");
    let mockGltf: any;
    const pathConverter = GetPathToObjectConverter(mockGltf);
    const mockLoader = {
        parent: {
            targetFps: 60,
        },
    } as unknown as any;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", 0, 0, 0, new Vector3(0, 0, 0));
        log.mockClear();
    });

    it("should load a basic graph", async () => {
        const i2fg = new InteractivityGraphToFlowGraphParser(loggerExample, mockGltf, mockLoader);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        await ParseFlowGraphAsync(json, { coordinator, pathConverter });

        coordinator.start();

        expect(log).toHaveBeenCalledWith(new Vector4(2, 4, 6, 8));
    });

    it("should load a math graph", async () => {
        const i2fg = new InteractivityGraphToFlowGraphParser(mathExample, mockGltf, mockLoader);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        await ParseFlowGraphAsync(json, { coordinator, pathConverter });

        coordinator.start();

        expect(log).toHaveBeenCalledWith(42);
    });

    it("should do integer math operations", async () => {
        const i2fg = new InteractivityGraphToFlowGraphParser(intMathExample, mockGltf, mockLoader);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        await ParseFlowGraphAsync(json, { coordinator, pathConverter });

        coordinator.start();

        expect(log).toHaveBeenCalledWith(new FlowGraphInteger(1));
    });

    it("should resolve world pointers", async () => {
        const mesh = new Mesh("mesh", scene);
        const gltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };
        const i2fg = new InteractivityGraphToFlowGraphParser(worldPointerExample, mockGltf, mockLoader);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = GetPathToObjectConverter(gltf);
        await ParseFlowGraphAsync(json, { coordinator, pathConverter });

        coordinator.start();

        expect(log).toHaveBeenCalledWith(new Vector3(1, 1, 1));
        expect(mesh.position).toStrictEqual(new Vector3(1, 1, 1));
    });

    it("should execute an event N times with doN", async () => {
        const i2fg = new InteractivityGraphToFlowGraphParser(doNExample, mockGltf, mockLoader);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        await ParseFlowGraphAsync(json, { coordinator, pathConverter });

        coordinator.start();

        for (let i = 0; i < 10; i++) {
            scene.render();
        }

        for (let i = 1; i < 6; i++) {
            expect(log).toHaveBeenCalledWith(new FlowGraphInteger(i));
        }

        for (let i = 6; i < 11; i++) {
            expect(log).not.toHaveBeenCalledWith(i);
        }
    });
});
