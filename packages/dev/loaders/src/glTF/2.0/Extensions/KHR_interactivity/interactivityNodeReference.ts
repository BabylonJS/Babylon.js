import { type INode } from "../../glTFLoaderInterfaces";

/**
 * Creates the scene reference used by KHR node events. A glTF node with one
 * primitive loads as a Mesh; one with multiple primitives loads as a
 * TransformNode whose child meshes carry the pointer events.
 * @param node The loaded glTF node.
 * @returns A reference to its actual Babylon runtime node.
 */
export function GetInteractivityNodeRuntimeReference(node: INode | undefined): { className?: string; id?: string; uniqueId?: number } {
    const runtimeNode = node?._babylonTransformNode;
    return {
        className: runtimeNode?.getClassName(),
        id: runtimeNode?.id,
        uniqueId: runtimeNode?.uniqueId,
    };
}
