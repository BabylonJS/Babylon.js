import type { IObjectAccessor, IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import type { IGLTF } from "../glTFLoaderInterfaces";

export class GLTFPathToObjectConverter implements IPathToObjectConverter {
    constructor(
        public gltf: IGLTF,
        public infoTree: any
    ) {}

    convert(path: string): IObjectAccessor | undefined {
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
            type: infoTree.type,
            get: (...args) => infoTree.get(...args),
            set: (value: any, ...args) => infoTree.set(value, ...args),
            extras: { ...infoTree.extras },
        };
    }
}
