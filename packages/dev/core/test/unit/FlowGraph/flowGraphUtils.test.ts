import { FlowGraphPath } from "core/FlowGraph/flowGraphPath";

describe("Flow Graph Utilities Test", () => {
    it("Flow Graph Valid Path", () => {
        const path = new FlowGraphPath();
        path.path = "/x/{y}/z";
        path.target = {
            x: {
                k: {
                    z: 1,
                },
            },
        };
        path.addTemplateSubstitution("y", "k");

        expect(path.getProperty()).toBe(1);

        path.setProperty(2);
        expect(path.getProperty()).toBe(2);
    });

    it("Flow Graph Invalid Path", () => {
        const path = new FlowGraphPath();
        path.path = "/a/b/c";
        path.target = {
            a: {
                k: {
                    c: 1,
                },
            },
        };

        expect(() => path.getProperty()).toThrow();
    });
});
