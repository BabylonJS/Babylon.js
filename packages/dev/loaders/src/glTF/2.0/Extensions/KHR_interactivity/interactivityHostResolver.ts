import { type IFlowGraphHostResolver } from "core/FlowGraph/flowGraphHostResolver";
import { GetEventReference, GetEventReferenceKey } from "./interactivityReferences";

/**
 * Supplies the KHR_interactivity representation of opaque `ref` values to the FlowGraph engine.
 *
 * The engine itself has no notion of the glTF object model: it asks this resolver how to represent
 * event sources and runtime objects as references, and how to read one back.
 */
export class InteractivityHostResolver implements IFlowGraphHostResolver {
    /**
     * @param key the FlowGraph event source key
     * @returns the KHR_interactivity event reference
     */
    public encodeEventReference(key: string): string {
        return GetEventReference(key);
    }

    /**
     * @param reference the value to decode
     * @returns the FlowGraph event source key, or `undefined` when the value is not an event reference
     */
    public decodeEventReference(reference: string): string | undefined {
        return GetEventReferenceKey(reference);
    }

    /**
     * Maps a Babylon object loaded from the glTF back to a JSON Pointer addressing it.
     *
     * The glTF loader stamps `_internalMetadata.gltf.pointers` with one entry per JSON Pointer the
     * object can be addressed by; a single-primitive mesh, for example, holds both `/nodes/<i>` and
     * `/meshes/<j>/primitives/<k>`. The hint is the path segment preceding the template parameter
     * being resolved, so a template like `/nodes/{nodeRef}/globalMatrix` picks the `/nodes/<i>`
     * pointer even when another pointer was added to the object first.
     * @param object the Babylon object to address
     * @param hint the expected root segment of the pointer, when known
     * @returns the JSON Pointer for the object, or `undefined` when it is not addressable
     */
    public getObjectReference(object: object, hint?: string): string | undefined {
        const pointers = (object as { _internalMetadata?: { gltf?: { pointers?: unknown } } })._internalMetadata?.gltf?.pointers;
        if (!Array.isArray(pointers)) {
            return undefined;
        }
        const stringPointers = pointers.filter((pointer: unknown): pointer is string => typeof pointer === "string");
        if (stringPointers.length === 0) {
            return undefined;
        }
        if (hint) {
            const match = stringPointers.find((pointer) => pointer.split("/")[1] === hint);
            if (match) {
                return match;
            }
        }
        return stringPointers[0];
    }
}
