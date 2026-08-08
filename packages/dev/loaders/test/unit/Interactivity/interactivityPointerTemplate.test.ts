import { type IKHRInteractivity_Graph } from "babylonjs-gltf2interface";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import { Logger } from "core/Misc/logger";

/**
 * Coverage for the KHR_interactivity JSON Pointer Template Parsing rules. A template parameter must span a whole
 * path segment; a malformed template is a syntax error and the whole behavior graph must be rejected.
 */
describe("KHR_interactivity JSON Pointer Template validation", () => {
    beforeEach(() => {
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
        vi.spyOn(Logger, "Warn").mockImplementation(() => {});
    });

    const parse = (pointer: string) => {
        const graph: IKHRInteractivity_Graph = {
            declarations: [{ op: "event/onStart" }, { op: "pointer/set" }],
            types: [{ signature: "float3" }],
            nodes: [
                { declaration: 0, flows: { out: { node: 1, socket: "in" } } },
                {
                    declaration: 1,
                    configuration: { pointer: { value: [pointer] }, type: { value: [0] } },
                    values: { value: { type: 0, value: [0, 0, 0] } },
                },
            ],
        } as unknown as IKHRInteractivity_Graph;
        return new InteractivityGraphToFlowGraphParser(graph, undefined as any).serializeToFlowGraph();
    };

    it.each([
        ["/nodes/{nodeRef}/scale"],
        ["/nodes/[index]/scale"],
        ["/materials/{materialRef}/pbrMetallicRoughness/baseColorFactor"],
        ["/nodes/0/translation"],
        // Literal brackets inside a path segment must be doubled.
        ["/nodes/[index]/extras/{{index}}"],
        ["/nodes/{index}/extras/[[index]]"],
        // Escaped tilde and forward slash in a template parameter id.
        ["/nodes/[my~1index]/scale"],
    ])("accepts the valid template %s", (pointer) => {
        expect(() => parse(pointer)).not.toThrow();
    });

    it.each([
        // A template parameter that does not span a whole path segment.
        ["/materials/{materialRef}pbrMetallicRoughness/baseColorFactor"],
        ["/nodes/x{index}/scale"],
        // Unterminated or empty template parameters.
        ["/nodes/{index/scale"],
        ["/nodes/[index/scale"],
        ["/nodes/{}/scale"],
        ["/nodes/[]/scale"],
        ["/nodes/{/scale"],
        // Brackets inside a template parameter.
        ["/nodes/{i[ndex}/scale"],
        ["/nodes/[i]ndex]/scale"],
        // An odd number of consecutive brackets in a literal path segment.
        ["/nodes/0/extras/{index}}"],
        // The same template parameter used twice.
        ["/nodes/{index}/children/{index}"],
        // Not a JSON Pointer.
        ["nodes/0/scale"],
    ])("rejects the invalid template %s", (pointer) => {
        expect(() => parse(pointer)).toThrow();
    });
});
