import { NullEngine } from "core/Engines/nullEngine";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Scene } from "core/scene";
import { BuildKhrTwoStepProcedureGraph, CreateKhrTwoStepProcedureTemplate } from "flow-graph-editor/khrTwoStepProcedureTemplate";
import { CreateKHRInteractivityDocument } from "loaders/glTF/2.0/Extensions/KHR_interactivity/pure";
import { describe, expect, it } from "vitest";

describe("KHR two-step procedure authoring", () => {
    it("produces a valid graph with indexed selections, state, visible cues, and a reset", () => {
        const graph = BuildKhrTwoStepProcedureGraph({ first: 4, second: 2, nextCue: 7, completionCue: 1, reset: 5 });
        const model = CreateKHRInteractivityDocument(graph, new Set(["KHR_node_selectability", "KHR_node_visibility"]), 8);

        expect(model.diagnostics).toEqual([]);
        expect(model.graphs[0].diagnostics).toEqual([]);
        expect(model.graphs[0].valid).toBe(true);
        expect(graph.graphs[0].variables).toEqual([{ name: "procedureStep", type: 1, value: [0] }]);
        expect(graph.graphs[0].nodes.filter((node: any) => node.configuration?.nodeIndex)).toEqual([
            expect.objectContaining({ configuration: { nodeIndex: { value: [4] } } }),
            expect.objectContaining({ configuration: { nodeIndex: { value: [2] } } }),
            expect.objectContaining({ configuration: { nodeIndex: { value: [5] } } }),
        ]);
        const pointers = graph.graphs[0].nodes.filter((node: any) => node.configuration?.pointer).map((node: any) => node.configuration.pointer.value[0]);
        expect(pointers).toContain("/nodes/7/extensions/KHR_node_visibility/visible");
        expect(pointers).toContain("/nodes/1/extensions/KHR_node_visibility/visible");
    });

    it("rejects overlapping roles, hidden controls, and cues that contain controls", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const meshes = {
            first: CreateBox("first", {}, scene),
            second: CreateBox("second", {}, scene),
            nextCue: CreateBox("next", {}, scene),
            completionCue: CreateBox("complete", {}, scene),
            reset: CreateBox("reset", {}, scene),
        };
        expect(() => CreateKhrTwoStepProcedureTemplate({ ...meshes, second: meshes.first })).toThrow("different");
        meshes.nextCue.parent = meshes.first;
        expect(() => CreateKhrTwoStepProcedureTemplate(meshes)).toThrow("ancestor");
        meshes.nextCue.parent = null;
        meshes.reset.isPickable = false;
        expect(() => CreateKhrTwoStepProcedureTemplate(meshes)).toThrow("visible, pickable");
        scene.dispose();
        engine.dispose();
    });
});
