import { FlowGraphGLTFDataProvider } from "loaders/glTF/2.0/Extensions/KHR_interactivity/flowGraphGLTFDataProvider";

describe("FlowGraphGLTFDataProvider", () => {
    it("stores config on instance via super(config)", () => {
        const mockGLTF = {
            nodes: [{ _babylonTransformNode: { name: "node0" } }, { _babylonTransformNode: { name: "node1" } }],
            animations: [{ _babylonAnimationGroup: { name: "anim0" } }],
        };

        const block = new FlowGraphGLTFDataProvider({ glTF: mockGLTF as any });

        // config should be stored on the block instance (super(config) was called)
        expect(block.config).toBeDefined();
        expect((block.config as any).glTF).toBe(mockGLTF);
    });

    it("populates nodes and animationGroups outputs from glTF data", () => {
        const tn0 = { name: "node0" };
        const tn1 = { name: "node1" };
        const ag0 = { name: "anim0" };
        const mockGLTF = {
            nodes: [{ _babylonTransformNode: tn0 }, { _babylonTransformNode: tn1 }],
            animations: [{ _babylonAnimationGroup: ag0 }],
        };

        const block = new FlowGraphGLTFDataProvider({ glTF: mockGLTF as any });

        // Get the default values from the data outputs
        const nodesOutput = block.getDataOutput("nodes");
        const agOutput = block.getDataOutput("animationGroups");

        expect(nodesOutput).toBeDefined();
        expect(agOutput).toBeDefined();

        // Access _defaultValue (the initial array)
        const nodesDefault = (nodesOutput as any)._defaultValue;
        const agDefault = (agOutput as any)._defaultValue;

        expect(nodesDefault).toHaveLength(2);
        expect(nodesDefault[0]).toBe(tn0);
        expect(nodesDefault[1]).toBe(tn1);
        expect(agDefault).toHaveLength(1);
        expect(agDefault[0]).toBe(ag0);
    });

    it("handles undefined glTF gracefully (empty arrays)", () => {
        // When re-creating from serialized data, glTF may be undefined
        const block = new FlowGraphGLTFDataProvider({ glTF: undefined as any });

        const nodesOutput = block.getDataOutput("nodes");
        const agOutput = block.getDataOutput("animationGroups");

        expect(nodesOutput).toBeDefined();
        expect(agOutput).toBeDefined();

        expect((nodesOutput as any)._defaultValue).toEqual([]);
        expect((agOutput as any)._defaultValue).toEqual([]);
    });

    it("handles glTF with no nodes or animations gracefully", () => {
        const block = new FlowGraphGLTFDataProvider({ glTF: {} as any });

        expect((block.getDataOutput("nodes") as any)._defaultValue).toEqual([]);
        expect((block.getDataOutput("animationGroups") as any)._defaultValue).toEqual([]);
    });

    it("returns correct className", () => {
        const block = new FlowGraphGLTFDataProvider({ glTF: undefined as any });
        expect(block.getClassName()).toBe("FlowGraphGLTFDataProvider");
    });
});
