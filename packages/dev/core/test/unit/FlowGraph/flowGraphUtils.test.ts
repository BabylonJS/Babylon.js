import { NullEngine } from "core/Engines";
import { FlowGraphContext, FlowGraphCoordinator } from "core/FlowGraph";
import { FlowGraphPath } from "core/FlowGraph/flowGraphPath";
import { Scene } from "core/scene";

describe("Flow Graph Utilities Test", () => {
    let engine;
    let scene: Scene;
    let coordinator: FlowGraphCoordinator;
    let context: FlowGraphContext;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        coordinator = new FlowGraphCoordinator({ scene });
        context = new FlowGraphContext({ scene, coordinator });
    });

    it("Flow Graph Valid Path", () => {
        context._userVariables = {
            x: {
                1: {
                    z: 1,
                },
            },
        };

        const path = new FlowGraphPath("/x/{y}/z");

        expect(path.getTemplateStrings()).toEqual(["y"]);
        // We haven't specified what we want to substitute for y, so we can't evaluate the path
        expect(() => path.getProperty(context)).toThrow();

        path.setTemplateSubstitution("y", 1);

        expect(path.getProperty(context)).toBe(1);

        path.setProperty(context, 2);
        expect(context._userVariables.x[1].z).toBe(2);
        expect(path.getProperty(context)).toBe(2);

        const path2 = new FlowGraphPath("/x/1.z"); // the path can also be separated by dots
        expect(path2.getProperty(context)).toBe(2);
    });

    it("Flow Graph Invalid Path", () => {
        context._userVariables = {
            a: {
                k: {
                    c: 1,
                },
            },
        };

        const path = new FlowGraphPath("/a/b/c");

        expect(() => path.getProperty(context)).toThrow();
    });
});
