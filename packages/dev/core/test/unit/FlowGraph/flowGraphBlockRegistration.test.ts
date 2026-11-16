// Only the pure registration helpers are imported here, so no side-effect module registers the blocks first.
import { RegisterAllFlowGraphBlocks, RegisterFlowGraphEventBlocks } from "core/FlowGraph/Blocks/allBlocks.pure";
import { GetClass } from "core/Misc/typeStore";
import { describe, expect, it } from "vitest";

describe("Flow graph eager block registration", () => {
    it("registers the mesh intersection event block with the event blocks", () => {
        expect(GetClass("FlowGraphMeshIntersectionEventBlock")).toBeUndefined();

        RegisterFlowGraphEventBlocks();

        expect(GetClass("FlowGraphMeshIntersectionEventBlock")?.name).toContain("FlowGraphMeshIntersectionEventBlock");
    });

    it("registers the mesh intersection event block through RegisterAllFlowGraphBlocks", () => {
        RegisterAllFlowGraphBlocks();
        expect(GetClass("FlowGraphMeshIntersectionEventBlock")).toBeDefined();
    });
});
