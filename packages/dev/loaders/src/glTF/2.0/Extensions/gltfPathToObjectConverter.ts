import type { IObjectInfo, IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import type { IGLTF } from "../glTFLoaderInterfaces";

/**
 * A converter that takes a glTF Object Model JSON Pointer
 * and transforms it into an ObjectAccessorContainer, allowing
 * objects referenced in the glTF to be associated with their
 * respective Babylon.js objects.
 */
export class GLTFPathToObjectConverter<T> implements IPathToObjectConverter<T> {
    public constructor(
        private _gltf: IGLTF,
        private _infoTree: any
    ) {}

    /**
     * The pointer string is represented by a [JSON pointer](https://datatracker.ietf.org/doc/html/rfc6901).
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
     *  - "/materials/2/emissiveFactor"
     *  - "/materials/2/pbrMetallicRoughness/baseColorFactor"
     *  - "/materials/2/extensions/KHR_materials_emissive_strength/emissiveStrength"
     *
     * @param path The path to convert
     * @returns The object and info associated with the path
     */
    public convert(path: string): IObjectInfo<T> {
        let objectTree: any = this._gltf;
        let infoTree: any = this._infoTree;
        let target: any = undefined;

        if (!path.startsWith("/")) {
            throw new Error("Path must start with a /");
        }
        const parts = path.split("/");
        parts.shift();

        for (const part of parts) {
            if (infoTree.__array__) {
                infoTree = infoTree.__array__;
            } else {
                infoTree = infoTree[part];
                if (!infoTree) {
                    throw new Error(`Path ${path} is invalid`);
                }
            }
            if (objectTree === undefined) {
                throw new Error(`Path ${path} is invalid`);
            }
            objectTree = objectTree[part];

            if (infoTree.__target__) {
                target = objectTree;
            }
        }

        return {
            object: target,
            info: infoTree,
        };
    }
}
