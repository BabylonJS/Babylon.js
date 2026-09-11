import { describe, expect, it } from "vitest";
import { BlockTypeBodyColor, GetBlockType, IsFlowGraphEventBlockName, IsGltfSpecificBlockName } from "flow-graph-editor/graphSystem/blockTypeColors";

describe("Flow Graph block type colors", () => {
    it.each(["FlowGraphGLTFDataProvider", "FlowGraphUnsupportedInteractivityBlock", "FlowGraphObjectReferenceBlock", "FlowGraphEventReferenceBlock"])(
        "marks %s as glTF-specific",
        (className) => {
            expect(IsGltfSpecificBlockName(className)).toBe(true);
            expect(GetBlockType(className)).toBe("gltf");
            expect(BlockTypeBodyColor[GetBlockType(className)]).toBe("#7651A6");
        }
    );

    it("distinguishes event sources from event actions", () => {
        expect(IsFlowGraphEventBlockName("FlowGraphSceneReadyEventBlock")).toBe(true);
        expect(IsFlowGraphEventBlockName("FlowGraphReceiveCustomEventBlock")).toBe(true);
        expect(IsFlowGraphEventBlockName("FlowGraphSendCustomEventBlock")).toBe(false);
        expect(IsFlowGraphEventBlockName("FlowGraphStopEventPropagationBlock")).toBe(false);
    });
});
