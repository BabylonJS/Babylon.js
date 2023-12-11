import type { IObjectAccessor, IPathToObjectConverter } from "./objectModelInterfaces";

export class TreeToObjectConverter implements IPathToObjectConverter {
    constructor(
        public tree: any,
        public separator: string
    ) {}

    convert(path: string): IObjectAccessor | undefined {
        const pathParts = path.split(this.separator);
        const lastPart = pathParts.pop();
        if (lastPart === undefined) {
            return undefined;
        }
        let object: any = this.tree;
        for (const part of pathParts) {
            object = object[part];
            if (object === undefined) {
                return undefined;
            }
        }
        return {
            object,
            type: { name: typeof object },
            get: () => object[lastPart],
            set: (value: any) => (object[lastPart] = value),
        };
    }
}
