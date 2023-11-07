import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { loggerExample, mathExample, customEventExample, worldPointerExample, doNExample } from "./testData";
import { convertGLTFToJson } from "loaders/glTF/2.0/Extensions/Interactivity";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraph } from "core/FlowGraph/flowGraph";
import { Vector3, Vector4 } from "core/Maths";
import { Mesh } from "core/Meshes";
import { ArcRotateCamera } from "core/Cameras";

describe("Babylon Interactivity", () => {
    let engine;
    let scene: Scene;
    let log: jest.SpyInstance;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", 0, 0, 0, new Vector3(0, 0, 0));
        log = jest.spyOn(global.console, "log");
    });

    it("should load a basic graph", () => {
        const json = convertGLTFToJson(loggerExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        FlowGraph.Parse(json, coordinator);

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new Vector4(2, 4, 6, 8));
    });

    it("should load a math graph", () => {
        const json = convertGLTFToJson(mathExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        FlowGraph.Parse(json, coordinator);

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(42);
    });

    it("should load a custom event graph", () => {
        const json = convertGLTFToJson(customEventExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        FlowGraph.Parse(json, coordinator);

        coordinator.start();

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should resolve world pointers", () => {
        const json = convertGLTFToJson(worldPointerExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = FlowGraph.Parse(json, coordinator);
        const context = graph.getContext(0);

        coordinator.start();

        const mesh = new Mesh("mesh", scene);
        context.setVariable("/nodes/0", mesh);

        scene.onReadyObservable.notifyObservers(scene);
        expect(log).toHaveBeenCalledWith(new Vector3(1, 1, 1));
        expect(mesh.position).toStrictEqual(new Vector3(1, 1, 1));
    });

    it("should execute an event N times with doN", () => {
        const json = convertGLTFToJson(doNExample);
        const coordinator = new FlowGraphCoordinator({ scene });
        FlowGraph.Parse(json, coordinator);

        coordinator.start();

        for (let i = 0; i < 10; i++) {
            scene.render();
        }

        for (let i = 1; i < 6; i++) {
            expect(log).toHaveBeenCalledWith(i);
        }

        for (let i = 6; i < 11; i++) {
            expect(log).not.toHaveBeenCalledWith(i);
        }
    });
});
