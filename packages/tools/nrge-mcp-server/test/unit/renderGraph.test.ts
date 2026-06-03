import { RenderGraphManager } from "../../src/renderGraph";

describe("Node Render Graph MCP Server – RenderGraphManager", () => {
    it("imports a valid render graph JSON", () => {
        const mgr = new RenderGraphManager();

        const graph = mgr.importJson(
            "graph",
            JSON.stringify({
                customType: "BABYLON.NodeRenderGraph",
                name: "original",
                blocks: [],
            })
        );

        expect(graph.name).toBe("graph");
        expect(graph.customType).toBe("BABYLON.NodeRenderGraph");
        expect(graph.blocks).toEqual([]);
    });

    it("rejects invalid render graph JSON", () => {
        const mgr = new RenderGraphManager();

        expect(() => mgr.importJson("graph", "not json")).toThrow("Invalid NRG JSON: parse error.");
        expect(() => mgr.importJson("graph", '{"customType":"WRONG","blocks":[]}')).toThrow("Invalid NRG JSON");
        expect(() => mgr.importJson("graph", '{"customType":"BABYLON.NodeRenderGraph"}')).toThrow("Invalid NRG JSON");
    });
});
