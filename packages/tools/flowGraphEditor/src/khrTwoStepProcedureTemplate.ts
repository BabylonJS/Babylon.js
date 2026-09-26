import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Node } from "core/node";

/** The five glTF node roles in an ordered, resettable procedure. */
export interface IKhrTwoStepProcedureNodes<T> {
    /** The first selectable part. */
    first: T;
    /** The second selectable part. */
    second: T;
    /** A cue revealed after selecting the first part. */
    nextCue: T;
    /** A cue revealed after selecting the second part. */
    completionCue: T;
    /** A selectable part that restarts the procedure. */
    reset: T;
}

const Roles = ["first", "second", "nextCue", "completionCue", "reset"] as const;

/**
 * Rejects selections that would become ambiguous when cues are hidden or events propagate.
 * @param nodes meshes assigned to the procedure roles
 */
export function ValidateKhrTwoStepProcedureMeshes(nodes: IKhrTwoStepProcedureNodes<AbstractMesh>): void {
    const meshes = Roles.map((role) => nodes[role]);
    if (new Set(meshes).size !== meshes.length) {
        throw new Error("Choose five different meshes for the procedure.");
    }
    if (meshes.some((mesh) => mesh.getScene() !== meshes[0].getScene())) {
        throw new Error("Procedure meshes must belong to the same scene.");
    }
    for (let i = 0; i < meshes.length; i++) {
        for (let j = i + 1; j < meshes.length; j++) {
            if (meshes[i].isDescendantOf(meshes[j]) || meshes[j].isDescendantOf(meshes[i])) {
                throw new Error("Procedure meshes cannot be an ancestor or descendant of each other.");
            }
        }
    }
    for (const mesh of [nodes.first, nodes.second, nodes.reset]) {
        if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable || mesh.getTotalVertices() === 0) {
            throw new Error("Each procedure control must be a visible, pickable mesh with geometry.");
        }
    }
    if (!nodes.nextCue.isEnabled() || !nodes.completionCue.isEnabled()) {
        throw new Error("Procedure cues must be enabled so the behavior can show them.");
    }
}

/**
 * Builds a two-step procedure with state 0 = first, 1 = second, and 2 = complete.
 * @param indices stable source glTF node indices
 * @returns the KHR_interactivity extension
 */
export function BuildKhrTwoStepProcedureGraph(indices: IKhrTwoStepProcedureNodes<number>) {
    const nodeIndices = Roles.map((role) => indices[role]);
    if (nodeIndices.some((index) => !Number.isSafeInteger(index) || index < 0) || new Set(nodeIndices).size !== nodeIndices.length) {
        throw new Error("Procedure roles must resolve to five different glTF nodes.");
    }
    const selection = (index: number, nextNode: number) => ({
        declaration: 0,
        configuration: { nodeIndex: { value: [index] } },
        flows: { out: { node: nextNode, socket: "in" } },
    });
    const setStep = (step: number) => ({
        declaration: 4,
        configuration: { variables: { value: [0] } },
        values: { [String(0)]: { type: 1, value: [step] } },
    });
    const setVisibility = (index: number, visible: boolean) => ({
        declaration: 5,
        configuration: { pointer: { value: [`/nodes/${index}/extensions/KHR_node_visibility/visible`] }, type: { value: [0] } },
        values: { value: { type: 0, value: [visible] } },
    });
    const compareStep = (step: number) => ({ declaration: 2, values: { a: { node: 0, socket: "value", type: 1 }, b: { type: 1, value: [step] } } });
    const orderedFlows = (targets: number[]) => Object.fromEntries(targets.map((node, index) => [String(index), { node, socket: "in" }]));
    return {
        graph: 0,
        graphs: [
            {
                name: "Two-step procedure",
                types: [{ signature: "bool" }, { signature: "int" }, { signature: "ref" }, { signature: "float3" }],
                variables: [{ name: "procedureStep", type: 1, value: [0] }],
                declarations: [
                    {
                        op: "event/onSelect",
                        extension: "KHR_node_selectability",
                        outputValueSockets: {
                            selectedNode: { type: 2 },
                            controllerIndex: { type: 1 },
                            selectionPoint: { type: 3 },
                            selectionRayOrigin: { type: 3 },
                            event: { type: 2 },
                        },
                    },
                    { op: "variable/get" },
                    { op: "math/eq" },
                    { op: "flow/branch" },
                    { op: "variable/set" },
                    { op: "pointer/set" },
                    { op: "flow/sequence" },
                ],
                nodes: [
                    { declaration: 1, configuration: { variable: { value: [0] } } },
                    compareStep(0),
                    compareStep(1),
                    selection(indices.first, 6),
                    selection(indices.second, 7),
                    selection(indices.reset, 10),
                    { declaration: 3, values: { condition: { node: 1 } }, flows: { true: { node: 8, socket: "in" } } },
                    { declaration: 3, values: { condition: { node: 2 } }, flows: { true: { node: 9, socket: "in" } } },
                    { declaration: 6, flows: orderedFlows([11, 14]) },
                    { declaration: 6, flows: orderedFlows([12, 18, 15]) },
                    { declaration: 6, flows: orderedFlows([13, 16, 17]) },
                    setStep(1),
                    setStep(2),
                    setStep(0),
                    setVisibility(indices.nextCue, true),
                    setVisibility(indices.completionCue, true),
                    setVisibility(indices.nextCue, false),
                    setVisibility(indices.completionCue, false),
                    setVisibility(indices.nextCue, false),
                ],
            },
        ],
    };
}

interface IProcedureExportContext {
    getNodeIndex(node: Node): number | undefined;
    setNodeExtension(nodeIndex: number, extensionName: string, value: unknown): void;
}

/**
 * Creates the same procedure while exporting a new scene to glTF.
 * @param meshes meshes assigned to the procedure roles
 * @returns a KHR_interactivity export provider
 */
export function CreateKhrTwoStepProcedureTemplate(meshes: IKhrTwoStepProcedureNodes<AbstractMesh>) {
    ValidateKhrTwoStepProcedureMeshes(meshes);
    return {
        required: true,
        additionalExtensionsUsed: ["KHR_node_selectability", "KHR_node_visibility"],
        additionalExtensionsRequired: ["KHR_node_selectability", "KHR_node_visibility"],
        build(context: IProcedureExportContext) {
            const indices = Object.fromEntries(Roles.map((role) => [role, context.getNodeIndex(meshes[role])])) as unknown as IKhrTwoStepProcedureNodes<number | undefined>;
            if (Roles.some((role) => indices[role] === undefined)) {
                throw new Error("All procedure meshes must be exported as glTF nodes.");
            }
            const graph = BuildKhrTwoStepProcedureGraph(indices as IKhrTwoStepProcedureNodes<number>);
            for (const role of ["first", "second", "reset"] as const) {
                context.setNodeExtension(indices[role]!, "KHR_node_selectability", { selectable: true });
            }
            for (const role of ["nextCue", "completionCue"] as const) {
                context.setNodeExtension(indices[role]!, "KHR_node_visibility", { visible: false });
            }
            return graph;
        },
    };
}
