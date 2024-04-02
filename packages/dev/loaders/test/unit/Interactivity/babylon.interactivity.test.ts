import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { loggerExample, mathExample, customEventExample, worldPointerExample, doNExample, intMathExample, matrixMathExample } from "./testData";
import { convertGLTFToSerializedFlowGraph } from "loaders/glTF/2.0/Extensions/interactivityFunctions";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraph } from "core/FlowGraph/flowGraph";
import { Vector3, Vector4 } from "core/Maths";
import { Mesh } from "core/Meshes";
import { ArcRotateCamera } from "core/Cameras";
import { InteractivityPathToObjectConverter } from "loaders/glTF/2.0/Extensions/interactivityPathToObjectConverter";
import { Logger } from "core/Misc";
import { FlowGraphInteger } from "core/FlowGraph/flowGraphInteger";

describe("Babylon Interactivity", () => {
    let engine;
    let scene: Scene;
    const log: jest.SpyInstance = jest.spyOn(Logger, "Log");
    let mockGltf: any;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", 0, 0, 0, new Vector3(0, 0, 0));
        log.mockClear();
    });

    it("should load a basic graph", () => {
        const json = convertGLTFToSerializedFlowGraph(loggerExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(mockGltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new Vector4(2, 4, 6, 8));
    });

    it("should load a math graph", () => {
        const json = convertGLTFToSerializedFlowGraph(mathExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(mockGltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(42);
    });

    it("should do integer math operations", () => {
        const json = convertGLTFToSerializedFlowGraph(intMathExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(mockGltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new FlowGraphInteger(1));
    });

    it("should do matrix math operations", () => {
        const json = convertGLTFToSerializedFlowGraph(matrixMathExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(mockGltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

        coordinator.start();

        log.mockClear();
        scene.onReadyObservable.notifyObservers(scene);
        expect(log.mock.calls[0][0].m).toEqual(new Float32Array([0, 4, 8, 12, 2, 6, 10, 14, 1, 5, 9, 13, 3, 7, 11, 15]));
    });

    it("should load a custom event graph", () => {
        const json = convertGLTFToSerializedFlowGraph(customEventExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(mockGltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should resolve world pointers", () => {
        const mesh = new Mesh("mesh", scene);
        const gltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };
        const json = convertGLTFToSerializedFlowGraph(worldPointerExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(gltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new Vector3(1, 1, 1));
        expect(mesh.position).toStrictEqual(new Vector3(1, 1, 1));
    });

    it("should execute an event N times with doN", () => {
        const json = convertGLTFToSerializedFlowGraph(doNExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pathConverter = new InteractivityPathToObjectConverter(mockGltf);
        FlowGraph.Parse(json, { coordinator, pathConverter });

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
