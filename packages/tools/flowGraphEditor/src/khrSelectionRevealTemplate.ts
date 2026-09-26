import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Node } from "core/node";

/** The small part of the glTF export context needed by this authored behavior. */
interface ISelectionRevealExportContext {
    getNodeIndex(node: Node): number | undefined;
    setNodeExtension(nodeIndex: number, extensionName: string, value: unknown): void;
}

/**
 * Builds the graph with the node indices assigned by the source glTF document.
 * @param triggerIndex source glTF trigger node index
 * @param revealIndex source glTF reveal node index
 * @returns the KHR_interactivity graph extension
 */
export function BuildKhrSelectionRevealGraph(triggerIndex: number, revealIndex: number) {
    return {
        graph: 0,
        graphs: [
            {
                name: "Select to reveal",
                types: [{ signature: "bool" }, { signature: "int" }, { signature: "ref" }, { signature: "float3" }],
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
                    { op: "pointer/set" },
                ],
                nodes: [
                    {
                        declaration: 0,
                        configuration: { nodeIndex: { value: [triggerIndex] } },
                        flows: { out: { node: 1, socket: "in" } },
                    },
                    {
                        declaration: 1,
                        configuration: {
                            pointer: { value: [`/nodes/${revealIndex}/extensions/KHR_node_visibility/visible`] },
                            type: { value: [0] },
                        },
                        values: { value: { type: 0, value: [true] } },
                    },
                ],
            },
        ],
    };
}

/**
 * Creates a standards-native select-to-reveal behavior for a scene being exported to glTF.
 * Node indices come from the serializer after it has filtered and ordered the scene; names
 * and Babylon unique IDs are deliberately not used as glTF identities.
 * @param trigger visible mesh selected by the user
 * @param reveal mesh initially hidden, then shown after selection
 * @returns a KHR_interactivity export provider
 */
export function CreateKhrSelectionRevealTemplate(trigger: AbstractMesh, reveal: AbstractMesh) {
    if (trigger.getScene() !== reveal.getScene()) {
        throw new Error("The trigger and reveal meshes must belong to the same scene.");
    }
    if (trigger === reveal || trigger.isDescendantOf(reveal)) {
        throw new Error("The reveal mesh cannot be the trigger or an ancestor of it.");
    }
    if (!trigger.isEnabled() || !trigger.isVisible || !trigger.isPickable || trigger.getTotalVertices() === 0) {
        throw new Error("The trigger must be a visible, pickable mesh with geometry.");
    }
    if (!reveal.isEnabled()) {
        throw new Error("The reveal mesh must be enabled so the behavior can show it.");
    }

    return {
        required: true,
        additionalExtensionsUsed: ["KHR_node_selectability", "KHR_node_visibility"],
        additionalExtensionsRequired: ["KHR_node_selectability", "KHR_node_visibility"],
        build(context: ISelectionRevealExportContext) {
            const triggerIndex = context.getNodeIndex(trigger);
            const revealIndex = context.getNodeIndex(reveal);
            if (triggerIndex === undefined || revealIndex === undefined) {
                throw new Error("Both selected meshes must be exported as distinct glTF nodes.");
            }
            if (triggerIndex === revealIndex) {
                throw new Error("The trigger and reveal meshes resolved to the same glTF node.");
            }

            context.setNodeExtension(triggerIndex, "KHR_node_selectability", { selectable: true });
            context.setNodeExtension(revealIndex, "KHR_node_visibility", { visible: false });

            return BuildKhrSelectionRevealGraph(triggerIndex, revealIndex);
        },
    };
}
