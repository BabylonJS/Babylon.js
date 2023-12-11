import type { IObjectAccessor, IObjectAccessorContainer, IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import type { IGLTF } from "../glTFLoaderInterfaces";

export class GLTFPathToObjectConverter implements IPathToObjectConverter {
    constructor(
        public gltf: IGLTF,
        public infoTree: any
    ) {}

    public beforeConvertPath(path: string): string {
        return path;
    }

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
     */
    convert(prePath: string): IObjectAccessorContainer | undefined {
        const path = this.beforeConvertPath(prePath);
        let objectTree: any = this.gltf;
        let infoTree: any = this.infoTree;
        let target: any = undefined;

        if (!path.startsWith("/")) {
            return undefined;
        }
        const parts = path.split("/");
        parts.shift();

        for (const part of parts) {
            if (infoTree.__array__) {
                infoTree = infoTree.__array__;
            } else {
                infoTree = infoTree[part];
                if (!infoTree) {
                    return undefined;
                }
            }
            if (objectTree === undefined) {
                return undefined;
            }
            objectTree = objectTree[part];

            if (infoTree.__target__) {
                target = objectTree;
            }
        }

        return {
            object: target,
            accessor: infoTree as IObjectAccessor,
        };
    }
}
