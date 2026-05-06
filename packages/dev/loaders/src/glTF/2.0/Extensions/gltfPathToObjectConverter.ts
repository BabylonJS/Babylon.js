import { type IObjectInfo, type IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import { type IGLTF } from "../glTFLoaderInterfaces";
import { type IObjectAccessor } from "core/FlowGraph/typeDefinitions";

/**
 * Adding an exception here will break traversing through the glTF object tree.
 * This is used for properties that might not be in the glTF object model, but are optional and have a default value.
 * For example, the path /nodes/\{\}/extensions/KHR_node_visibility/visible is optional - the object can be deferred without the object fully existing.
 */
export const OptionalPathExceptionsList: {
    regex: RegExp;
}[] = [
    {
        // get the node as object when reading an extension
        regex: new RegExp(`^/nodes/\\d+/extensions/`),
    },
    {
        // weights may be undefined on nodes without morph targets
        regex: new RegExp(`^/nodes/\\d+/weights`),
    },
    {
        // weights may be undefined on meshes without morph targets
        regex: new RegExp(`^/meshes/\\d+/weights`),
    },
    {
        // KHR_texture_transform may not be present on texture info objects
        regex: new RegExp(`/extensions/KHR_texture_transform/`),
    },
];

/**
 * A converter that takes a glTF Object Model JSON Pointer
 * and transforms it into an ObjectAccessorContainer, allowing
 * objects referenced in the glTF to be associated with their
 * respective Babylon.js objects.
 */
export class GLTFPathToObjectConverter<T, BabylonType, BabylonValue> implements IPathToObjectConverter<IObjectAccessor<T, BabylonType, BabylonValue>> {
    public constructor(
        private _gltf: IGLTF,
        private _infoTree: any
    ) {}

    /**
     * The pointer string is represented by a [JSON pointer](https://datatracker.ietf.org/doc/html/rfc6901).
     * See also https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/ObjectModel.adoc#core-pointers
     * <animationPointer> := /<rootNode>/<assetIndex>/<propertyPath>
     * <rootNode> := "nodes" | "materials" | "meshes" | "cameras" | "extensions"
     * <assetIndex> := <digit> | <name>
     * <propertyPath> := <extensionPath> | <standardPath>
     * <extensionPath> := "extensions"/<name>/<standardPath>
     * <standardPath> := <name> | <name>/<standardPath>
     * <name> := W+
     * <digit> := D+
     *
     * Examples:
     *  - "/nodes/0/rotation"
     * - "/nodes.length"
     *  - "/materials/2/emissiveFactor"
     *  - "/materials/2/pbrMetallicRoughness/baseColorFactor"
     *  - "/materials/2/extensions/KHR_materials_emissive_strength/emissiveStrength"
     *
     * @param path The path to convert
     * @returns The object and info associated with the path
     */
    public convert(path: string): IObjectInfo<IObjectAccessor<T, BabylonType, BabylonValue>> {
        let objectTree: any = this._gltf;
        let infoTree: any = this._infoTree;
        let target: any = undefined;

        if (!path.startsWith("/")) {
            throw new Error("Path must start with a /");
        }
        const parts = path.split("/");
        parts.shift();

        // KHR_interactivity Opaque-Reference spec uses a trailing slash to mean
        // "ref to the resource itself" (e.g. `/animations/0/` is a ref to the
        // animation). Drop the trailing empty segment so we resolve to the
        // accessor for the resource rather than descending into a non-existent
        // empty-named child.
        if (parts.length > 0 && parts[parts.length - 1] === "") {
            parts.pop();
        }

        //if the last part has ".length" in it, separate that as an extra part
        if (parts[parts.length - 1].includes(".length")) {
            const lastPart = parts[parts.length - 1];
            const split = lastPart.split(".");
            parts.pop();
            parts.push(...split);
        }

        let ignoreObjectTree = false;

        for (const part of parts) {
            const isLength = part === "length";
            if (isLength) {
                // For .length, check if the current level has a 'length' accessor
                if (infoTree.length) {
                    infoTree = infoTree.length;
                } else if (infoTree.__array__) {
                    // Fallback: length of an array that doesn't have explicit length accessor
                    throw new Error(`Path ${path} is invalid - no length accessor`);
                } else {
                    throw new Error(`Path ${path} is invalid`);
                }
                // Set target to the current object tree (the array itself)
                // Only update target if objectTree is defined, otherwise keep the last valid target
                if (objectTree !== undefined) {
                    target = objectTree;
                }
                continue;
            }
            if (infoTree.__ignoreObjectTree__) {
                ignoreObjectTree = true;
            }
            if (infoTree.__array__) {
                infoTree = infoTree.__array__;
            } else {
                infoTree = infoTree[part];
                if (!infoTree) {
                    throw new Error(`Path ${path} is invalid`);
                }
            }
            // __passThroughTarget__: skip objectTree traversal for this property.
            // The accessor functions will receive the parent target (e.g., the INode)
            // instead of the child property (e.g., node.weights which may be undefined).
            if (infoTree.__passThroughTarget__) {
                ignoreObjectTree = true;
            } else if (!ignoreObjectTree) {
                if (objectTree === undefined) {
                    // check if the path is in the exception list. If it is, break and return the last object that was found
                    const exception = OptionalPathExceptionsList.find((e) => e.regex.test(path));
                    if (!exception) {
                        throw new Error(`Path ${path} is invalid`);
                    }
                } else {
                    objectTree = objectTree?.[part];
                }
            } else {
                // When ignoring object tree traversal and encountering a numeric array index,
                // wrap the accessor functions to pass the index through as the second argument.
                const numericIndex = parseInt(part);
                if (!isNaN(numericIndex) && typeof infoTree.get === "function") {
                    const orig = infoTree;
                    infoTree = { ...orig };
                    infoTree.get = (target: any) => orig.get(target, numericIndex);
                    if (typeof orig.set === "function") {
                        infoTree.set = (value: any, target: any) => orig.set(value, target, numericIndex);
                    }
                    if (typeof orig.getTarget === "function") {
                        infoTree.getTarget = (target: any) => orig.getTarget(target, numericIndex);
                    }
                }
            }

            if (infoTree.__target__) {
                // Only update target if objectTree is defined, otherwise keep the last valid target
                if (objectTree !== undefined) {
                    target = objectTree;
                }
            }
        }

        return {
            object: target,
            info: infoTree,
        };
    }
}
