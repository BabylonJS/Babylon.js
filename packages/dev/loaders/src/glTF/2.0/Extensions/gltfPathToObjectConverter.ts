import type { IObjectInfo, IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import type { IGLTF } from "../glTFLoaderInterfaces";
import type { IObjectAccessor } from "core/FlowGraph/typeDefinitions";

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
     *  - "/nodes.length"
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

        // If the last part ends with `.length`, separate that as an extra part
        if (parts[parts.length - 1].endsWith(".length")) {
            const lastPart = parts[parts.length - 1];
            const split = lastPart.split(".");
            parts.pop();
            parts.push(...split);
        }

        let index: number | undefined = undefined;

        for (const part of parts) {
            if (infoTree[part]) {
                infoTree = infoTree[part];
            } else if (infoTree.__array__) {
                infoTree = infoTree.__array__;
                if (target) {
                    index = parseInt(part, 10);
                }
            } else {
                throw new Error(`Path ${path} is invalid`);
            }

            if (!target) {
                objectTree = objectTree[part];
            }

            if (infoTree.__target__) {
                target = objectTree;
            }
        }

        return {
            object: target,
            index: index,
            info: infoTree,
        };
    }
}
