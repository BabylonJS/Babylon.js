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
                k: {
                    z: 1,
                },
            },
        };

        const path = new FlowGraphPath();
        path.path = "/x/{y}/z";

        path.addTemplateSubstitution("y", "k");

        expect(path.getProperty(context)).toBe(1);

        path.setProperty(context, 2);
        expect(context._userVariables.x.k.z).toBe(2);
        expect(path.getProperty(context)).toBe(2);
    });

    it("Flow Graph Invalid Path", () => {
        context._userVariables = {
            a: {
                k: {
                    c: 1,
                },
            },
        };

        const path = new FlowGraphPath();
        path.path = "/a/b/c";

        expect(() => path.getProperty(context)).toThrow();
    });
});
